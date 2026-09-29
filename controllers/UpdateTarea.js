const mongoose = require("mongoose");
const { Tarea, Salon } = require("../models/Models.js");
const {
    guardarVariosArchivosGridFS,
    eliminarVariosArchivosGridFS
} = require("../Frontend/middleware/archivosTareas.js");

function textoLimpio(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

function leerIdsParaEliminar(valor) {
    if (!valor) return [];

    if (Array.isArray(valor)) {
        return valor.map(String).filter(mongoose.Types.ObjectId.isValid);
    }

    try {
        const datos = JSON.parse(valor);
        return Array.isArray(datos)
            ? datos.map(String).filter(mongoose.Types.ObjectId.isValid)
            : [];
    } catch (error) {
        return String(valor)
            .split(",")
            .map((id) => id.trim())
            .filter(mongoose.Types.ObjectId.isValid);
    }
}

module.exports = async function UpdateTarea(request, response) {
    const { id } = request.query;
    const {
        tema,
        nombre,
        descripcion,
        doctarea,
        fechavencimiento,
        eliminarArchivos
    } = request.body;

    if (!id) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID de la tarea."
        });
    }

    const temaNormalizado = textoLimpio(tema);
    const nombreNormalizado = textoLimpio(nombre);
    const descripcionNormalizada = textoLimpio(descripcion);
    const documentoNormalizado = textoLimpio(doctarea);
    const archivosNuevos = Array.isArray(request.files) ? request.files : [];
    const idsSolicitadosParaEliminar = leerIdsParaEliminar(eliminarArchivos);

    if (
        !temaNormalizado ||
        !nombreNormalizado ||
        !descripcionNormalizada ||
        !fechavencimiento
    ) {
        return response.status(400).json({
            success: false,
            message: "Faltan campos requeridos: tema, nombre, descripción o fecha de vencimiento."
        });
    }

    const fechaVencimiento = new Date(fechavencimiento);

    if (Number.isNaN(fechaVencimiento.getTime())) {
        return response.status(400).json({
            success: false,
            message: "La fecha de vencimiento no es válida."
        });
    }

    if (fechaVencimiento.getTime() <= Date.now()) {
        return response.status(400).json({
            success: false,
            message: "La fecha de vencimiento debe ser posterior a la fecha y hora actuales."
        });
    }

    let adjuntosNuevosGuardados = [];

    try {
        const tarea = await Tarea.findById(id);

        if (!tarea) {
            return response.status(404).json({
                success: false,
                message: "Tarea no encontrada."
            });
        }

        const salon = await Salon.findById(tarea.idgrupo)
            .select("_id idprofe")
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "El salón relacionado con la tarea no existe."
            });
        }

        const idsExistentes = new Set(
            (tarea.archivos || []).map((archivo) => String(archivo.archivoId))
        );

        const idsParaEliminar = idsSolicitadosParaEliminar.filter(
            (archivoId) => idsExistentes.has(String(archivoId))
        );

        const archivosConservados = (tarea.archivos || []).filter(
            (archivo) => !idsParaEliminar.includes(String(archivo.archivoId))
        );

        if (archivosNuevos.length > 0) {
            if (archivosConservados.length + archivosNuevos.length > 5) {
                return response.status(400).json({
                    success: false,
                    message: "Una tarea puede tener como máximo 5 archivos adjuntos."
                });
            }

            adjuntosNuevosGuardados = await guardarVariosArchivosGridFS(
                archivosNuevos,
                {
                    categoria: "material_tarea",
                    idTarea: tarea._id,
                    idSalon: salon._id,
                    idProfesor: salon.idprofe
                }
            );
        }

        const archivosFinales = [
            ...archivosConservados.map((archivo) => archivo.toObject?.() || archivo),
            ...adjuntosNuevosGuardados
        ];

        if (!documentoNormalizado && archivosFinales.length === 0) {
            await eliminarVariosArchivosGridFS(
                adjuntosNuevosGuardados.map((archivo) => archivo.archivoId)
            );

            return response.status(400).json({
                success: false,
                message: "La tarea debe conservar un enlace de referencia, al menos un archivo o ambos."
            });
        }

        tarea.tema = temaNormalizado;
        tarea.nombre = nombreNormalizado;
        tarea.descripcion = descripcionNormalizada;
        tarea.doctarea = documentoNormalizado || null;
        tarea.fechavencimiento = fechaVencimiento;
        tarea.archivos = archivosFinales;

        await tarea.save();

        // Solo eliminamos los archivos antiguos después de guardar correctamente
        // la nueva versión de la tarea.
        await eliminarVariosArchivosGridFS(idsParaEliminar);

        return response.status(200).json({
            success: true,
            message: "Tarea actualizada correctamente.",
            tarea
        });
    } catch (error) {
        console.error("Error al actualizar la tarea:", error);

        if (adjuntosNuevosGuardados.length > 0) {
            await eliminarVariosArchivosGridFS(
                adjuntosNuevosGuardados.map((archivo) => archivo.archivoId)
            );
        }

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message: "El ID de la tarea no es válido."
            });
        }

        if (error.name === "ValidationError") {
            return response.status(400).json({
                success: false,
                message: "Los datos proporcionados para la tarea no son válidos."
            });
        }

        return response.status(500).json({
            success: false,
            message: "Error en el servidor."
        });
    }
};

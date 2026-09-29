const mongoose = require("mongoose");
const {
    Tarea,
    TareaEstudiante,
    SalonEstudiante
} = require("../models/Models.js");
const {
    guardarArchivoGridFS,
    eliminarArchivoGridFS
} = require("../Frontend/middleware/archivosTareas.js");

function textoLimpio(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

module.exports = async function EstudianteEntregaTarea(request, response) {
    const { idtarea, idestudiante } = request.body;
    const docentrega = textoLimpio(request.body.docentrega);
    const archivoRecibido = request.file || null;
    const eliminarArchivoAnterior =
        String(request.body.eliminarArchivoAnterior || "").toLowerCase() === "true";

    if (!idtarea || !idestudiante) {
        return response.status(400).json({
            success: false,
            message: "Faltan el ID de la tarea o del estudiante."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idtarea) ||
        !mongoose.Types.ObjectId.isValid(idestudiante)
    ) {
        return response.status(400).json({
            success: false,
            message: "El ID de la tarea o del estudiante no es válido."
        });
    }

    let archivoNuevo = null;

    try {
        const tarea = await Tarea.findById(idtarea).lean();

        if (!tarea) {
            return response.status(404).json({
                success: false,
                message: "La tarea no existe."
            });
        }

        if (
            tarea.fechavencimiento &&
            new Date(tarea.fechavencimiento).getTime() < Date.now()
        ) {
            return response.status(400).json({
                success: false,
                message: "La fecha de entrega de esta tarea ya venció."
            });
        }

        const matricula = await SalonEstudiante.findOne({
            idgrupo: tarea.idgrupo,
            idestudiante,
            status: { $ne: "Retirado" }
        }).lean();

        if (!matricula) {
            return response.status(403).json({
                success: false,
                message: "El estudiante no tiene una matrícula activa en este salón."
            });
        }

        let entrega = await TareaEstudiante.findOne({
            idtarea,
            idestudiante
        });

        if (!entrega) {
            entrega = new TareaEstudiante({
                idtarea,
                idestudiante
            });
        }

        const archivoAnteriorId = entrega.archivoEntrega?.archivoId
            ? String(entrega.archivoEntrega.archivoId)
            : null;

        const conservarArchivoAnterior =
            Boolean(entrega.archivoEntrega?.archivoId) &&
            !archivoRecibido &&
            !eliminarArchivoAnterior;

        if ((!docentrega || !archivoRecibido) && !conservarArchivoAnterior) {
            return response.status(400).json({
                success: false,
                message: "Debes enviar un enlace, un archivo o ambos."
            });
        }

        if (archivoRecibido) {
            archivoNuevo = await guardarArchivoGridFS(
                archivoRecibido,
                {
                    categoria: "entrega_estudiante",
                    idTarea: tarea._id,
                    idSalon: tarea.idgrupo,
                    idEstudiante: idestudiante
                }
            );
        }

        entrega.docentrega = docentrega || null;

        if (archivoNuevo) {
            entrega.archivoEntrega = archivoNuevo;
        } else if (eliminarArchivoAnterior) {
            entrega.archivoEntrega = null;
        }

        entrega.fechaentrega = new Date();
        await entrega.save();

        if (
            archivoAnteriorId &&
            (archivoNuevo || eliminarArchivoAnterior) &&
            archivoAnteriorId !== String(archivoNuevo?.archivoId || "")
        ) {
            await eliminarArchivoGridFS(archivoAnteriorId);
        }

        return response.status(200).json({
            success: true,
            message: archivoNuevo
                ? "Archivo entregado exitosamente."
                : "Tarea entregada exitosamente.",
            entrega
        });
    } catch (error) {
        console.error("Error al entregar la tarea:", error);

        if (archivoNuevo?.archivoId) {
            await eliminarArchivoGridFS(archivoNuevo.archivoId);
        }

        return response.status(500).json({
            success: false,
            message: "Error en el servidor al registrar la entrega."
        });
    }
};

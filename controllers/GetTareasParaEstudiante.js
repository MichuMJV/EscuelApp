const mongoose = require("mongoose");
const {
    Tarea,
    TareaEstudiante,
    SalonEstudiante
} = require("../models/Models.js");

function construirDescarga(archivo, idUsuario) {
    if (!archivo?.archivoId) return null;

    const datos = archivo.toObject?.() || archivo;

    return {
        ...datos,
        urlDescarga:
            `/Escuelapp/DescargarArchivo/${encodeURIComponent(datos.archivoId)}` +
            `?idusuario=${encodeURIComponent(idUsuario)}`
    };
}

module.exports = async function GetTareasParaEstudiante(request, response) {
    const { idgrupo, idestudiante } = request.query;

    if (!idgrupo || !idestudiante) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón y del estudiante."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idgrupo) ||
        !mongoose.Types.ObjectId.isValid(idestudiante)
    ) {
        return response.status(400).json({
            success: false,
            message: "El ID del salón o del estudiante no es válido."
        });
    }

    try {
        const matricula = await SalonEstudiante.findOne({
            idgrupo,
            idestudiante,
            status: { $ne: "Retirado" }
        }).lean();

        if (!matricula) {
            return response.status(403).json({
                success: false,
                message: "El estudiante no tiene una matrícula activa en este salón."
            });
        }

        const tareasDelSalon = await Tarea.find({ idgrupo })
            .sort({ tema: 1, fechavencimiento: 1 })
            .lean();

        if (tareasDelSalon.length === 0) {
            return response.status(200).json({
                success: true,
                tareas: []
            });
        }

        const idsTareas = tareasDelSalon.map((tarea) => tarea._id);
        const asignaciones = await TareaEstudiante.find({
            idtarea: { $in: idsTareas },
            idestudiante
        }).lean();

        const asignacionesPorTarea = new Map(
            asignaciones.map((asignacion) => [
                String(asignacion.idtarea),
                asignacion
            ])
        );

        const tareas = tareasDelSalon.map((tarea) => {
            const tema =
                typeof tarea.tema === "string" && tarea.tema.trim()
                    ? tarea.tema.trim()
                    : "Sin tema";

            const asignacionOriginal =
                asignacionesPorTarea.get(String(tarea._id)) || null;

            const miAsignacion = asignacionOriginal
                ? {
                    ...asignacionOriginal,
                    archivoEntrega: construirDescarga(
                        asignacionOriginal.archivoEntrega,
                        idestudiante
                    ),
                    tieneEntrega: Boolean(
                        asignacionOriginal.docentrega ||
                        asignacionOriginal.archivoEntrega?.archivoId
                    )
                }
                : null;

            return {
                ...tarea,
                tema,
                archivos: (tarea.archivos || []).map((archivo) =>
                    construirDescarga(archivo, idestudiante)
                ),
                miAsignacion
            };
        });

        tareas.sort((tareaA, tareaB) => {
            const temaA = tareaA.tema.toLocaleLowerCase("es");
            const temaB = tareaB.tema.toLocaleLowerCase("es");

            if (temaA === "sin tema" && temaB !== "sin tema") return 1;
            if (temaA !== "sin tema" && temaB === "sin tema") return -1;

            const comparacion = temaA.localeCompare(temaB, "es", {
                sensitivity: "base"
            });

            if (comparacion !== 0) return comparacion;

            return new Date(tareaA.fechavencimiento || 8640000000000000).getTime() -
                new Date(tareaB.fechavencimiento || 8640000000000000).getTime();
        });

        return response.status(200).json({
            success: true,
            tareas
        });
    } catch (error) {
        console.error("Error al obtener las tareas del estudiante:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};

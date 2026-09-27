const {
    Tarea,
    TareaEstudiante
} = require("../models/Models.js");

module.exports = async function GetTareasParaEstudiante(
    request,
    response
) {
    const {
        idgrupo,
        idestudiante
    } = request.query;

    if (!idgrupo || !idestudiante) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del salón y del estudiante."
        });
    }

    try {
        const tareasDelSalon = await Tarea.find({
            idgrupo: idgrupo
        })
            .sort({
                tema: 1,
                fechavencimiento: 1
            })
            .lean();

        if (tareasDelSalon.length === 0) {
            return response.status(200).json({
                success: true,
                tareas: []
            });
        }

        const idsTareas = tareasDelSalon.map(function (tarea) {
            return tarea._id;
        });

        const asignacionesEstudiante =
            await TareaEstudiante.find({
                idtarea: {
                    $in: idsTareas
                },
                idestudiante: idestudiante
            }).lean();

        const asignacionesPorTarea = new Map();

        asignacionesEstudiante.forEach(function (asignacion) {
            asignacionesPorTarea.set(
                asignacion.idtarea.toString(),
                asignacion
            );
        });

        const tareas = tareasDelSalon.map(function (tarea) {
            const temaNormalizado =
                typeof tarea.tema === "string" &&
                tarea.tema.trim()
                    ? tarea.tema.trim()
                    : "Sin tema";

            const miAsignacion =
                asignacionesPorTarea.get(
                    tarea._id.toString()
                ) || null;

            return {
                ...tarea,
                tema: temaNormalizado,
                miAsignacion: miAsignacion
            };
        });

        tareas.sort(function (tareaA, tareaB) {
            const temaA = tareaA.tema.toLocaleLowerCase("es");
            const temaB = tareaB.tema.toLocaleLowerCase("es");

            const temaASinAsignar =
                temaA === "sin tema";

            const temaBSinAsignar =
                temaB === "sin tema";

            if (temaASinAsignar && !temaBSinAsignar) {
                return 1;
            }

            if (!temaASinAsignar && temaBSinAsignar) {
                return -1;
            }

            const comparacionTemas =
                temaA.localeCompare(
                    temaB,
                    "es",
                    {
                        sensitivity: "base"
                    }
                );

            if (comparacionTemas !== 0) {
                return comparacionTemas;
            }

            const fechaA = tareaA.fechavencimiento
                ? new Date(
                    tareaA.fechavencimiento
                ).getTime()
                : Number.MAX_SAFE_INTEGER;

            const fechaB = tareaB.fechavencimiento
                ? new Date(
                    tareaB.fechavencimiento
                ).getTime()
                : Number.MAX_SAFE_INTEGER;

            return fechaA - fechaB;
        });

        return response.status(200).json({
            success: true,
            tareas: tareas
        });
    } catch (error) {
        console.error(
            "Error al obtener las tareas del estudiante:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message:
                    "El ID del salón o del estudiante no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error en el servidor."
        });
    }
};
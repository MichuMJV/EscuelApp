const mongoose = require("mongoose");

const {
    Salon,
    Usuario,
    SalonEstudiante,
    Tarea,
    TareaEstudiante
} = require("../models/Models.js");

const ESTADOS_VALIDOS = [
    "Matriculado",
    "Retirado",
    "Aprobado",
    "Reprobado"
];

module.exports = async function modificarMatricula(
    request,
    response
) {
    const {
        idProfesor,
        idMatricula
    } = request.query;

    const {
        status,
        nota
    } = request.body;

    if (!idProfesor || !idMatricula) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del profesor y el ID de la matrícula."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idProfesor) ||
        !mongoose.Types.ObjectId.isValid(idMatricula)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del profesor o de la matrícula no es válido."
        });
    }

    const estadoNormalizado =
        typeof status === "string"
            ? status.trim()
            : "";

    if (!ESTADOS_VALIDOS.includes(estadoNormalizado)) {
        return response.status(400).json({
            success: false,
            message:
                "El estado proporcionado no es válido."
        });
    }

    const notaNormalizada =
        nota === undefined ||
        nota === null ||
        String(nota).trim() === ""
            ? null
            : Number(nota);

    if (
        notaNormalizada !== null &&
        (
            !Number.isFinite(notaNormalizada) ||
            notaNormalizada < 0 ||
            notaNormalizada > 100
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "La nota final debe ser un número entre 0 y 100."
        });
    }

    try {
        const profesor = await Usuario.findById(
            idProfesor
        )
            .select("_id nombre rol")
            .lean();

        if (!profesor) {
            return response.status(404).json({
                success: false,
                message:
                    "El profesor especificado no fue encontrado."
            });
        }

        if (Number(profesor.rol) !== 2) {
            return response.status(403).json({
                success: false,
                message:
                    "El usuario especificado no tiene el rol de profesor."
            });
        }

        const matricula = await SalonEstudiante.findById(
            idMatricula
        );

        if (!matricula) {
            return response.status(404).json({
                success: false,
                message:
                    "La matrícula especificada no fue encontrada."
            });
        }

        const salon = await Salon.findById(
            matricula.idgrupo
        );

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón relacionado con la matrícula no fue encontrado."
            });
        }

        const profesorEsPropietario =
            salon.idprofe &&
            salon.idprofe.toString() ===
                profesor._id.toString();

        if (!profesorEsPropietario) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para modificar matrículas de este salón."
            });
        }

        const estadoAnterior =
            matricula.status || "Matriculado";

        const estabaRetirado =
            estadoAnterior === "Retirado";

        const quedaraRetirado =
            estadoNormalizado === "Retirado";

        if (
            estabaRetirado &&
            !quedaraRetirado
        ) {
            const cupoDisponible = Number(salon.cupo);

            if (
                !Number.isFinite(cupoDisponible) ||
                cupoDisponible <= 0
            ) {
                return response.status(400).json({
                    success: false,
                    message:
                        "No hay cupos disponibles para reactivar esta matrícula."
                });
            }

            salon.cupo = cupoDisponible - 1;

            await crearAsignacionesFaltantes(
                salon._id,
                matricula.idestudiante
            );
        }

        if (
            !estabaRetirado &&
            quedaraRetirado
        ) {
            const cupoActual = Number(salon.cupo);

            salon.cupo =
                Number.isFinite(cupoActual)
                    ? cupoActual + 1
                    : 1;
        }

        matricula.status = estadoNormalizado;

        if (notaNormalizada !== null) {
            matricula.notafinal =
                String(notaNormalizada);
        }

        if (
            estadoNormalizado === "Matriculado" &&
            notaNormalizada === null
        ) {
            matricula.notafinal =
                matricula.notafinal || "0";
        }

        const [
            matriculaActualizada
        ] = await Promise.all([
            matricula.save(),
            salon.save()
        ]);

        return response.status(200).json({
            success: true,
            message:
                "La matrícula fue actualizada correctamente.",

            matricula: {
                _id: matriculaActualizada._id,
                idgrupo:
                    matriculaActualizada.idgrupo,
                idestudiante:
                    matriculaActualizada.idestudiante,
                status:
                    matriculaActualizada.status,
                notafinal:
                    matriculaActualizada.notafinal,
                fecha:
                    matriculaActualizada.fecha
            },

            salon: {
                _id: salon._id,
                nombre: salon.nombre,
                materia: salon.materia,
                cupo: salon.cupo
            }
        });
    } catch (error) {
        console.error(
            "Error al modificar la matrícula:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message:
                    "Uno de los identificadores proporcionados no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error en el servidor al modificar la matrícula."
        });
    }
};

async function crearAsignacionesFaltantes(
    idGrupo,
    idEstudiante
) {
    const tareas = await Tarea.find({
        idgrupo: idGrupo
    })
        .select("_id")
        .lean();

    if (tareas.length === 0) {
        return;
    }

    const operaciones = tareas.map(function (tarea) {
        return {
            updateOne: {
                filter: {
                    idtarea: tarea._id,
                    idestudiante: idEstudiante
                },

                update: {
                    $setOnInsert: {
                        idtarea: tarea._id,
                        idestudiante: idEstudiante
                    }
                },

                upsert: true
            }
        };
    });

    await TareaEstudiante.bulkWrite(
        operaciones,
        {
            ordered: false
        }
    );
}
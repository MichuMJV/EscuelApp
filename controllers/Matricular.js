const mongoose = require("mongoose");

const {
    Salon,
    Usuario,
    SalonEstudiante,
    Tarea,
    TareaEstudiante
} = require("../models/Models.js");

module.exports = async function Matricular(request, response) {
    const {
        nombre,
        clave,
        idgrupo,
        idEstudiante: idEstudianteBody,
        idProfesor
    } = request.body;

    const idEstudiante =
        request.query.idEstudiante ||
        request.query.idestudiante ||
        idEstudianteBody;

    const esMatriculaProfesor = Boolean(
        idgrupo && idEstudiante && idProfesor
    );

    const esMatriculaEstudiante = Boolean(
        nombre && clave && idEstudiante
    );

    if (!esMatriculaProfesor && !esMatriculaEstudiante) {
        return response.status(400).json({
            success: false,
            message:
                "Faltan datos para realizar la matrícula."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(idEstudiante)) {
        return response.status(400).json({
            success: false,
            message: "El ID del estudiante no es válido."
        });
    }

    if (
        esMatriculaProfesor &&
        (
            !mongoose.Types.ObjectId.isValid(idgrupo) ||
            !mongoose.Types.ObjectId.isValid(idProfesor)
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del salón o del profesor no es válido."
        });
    }

    try {
        const estudiante = await Usuario.findById(
            idEstudiante
        )
            .select("_id nombre cedula rol")
            .lean();

        if (!estudiante) {
            return response.status(404).json({
                success: false,
                message: "El estudiante no fue encontrado."
            });
        }

        if (Number(estudiante.rol) !== 3) {
            return response.status(400).json({
                success: false,
                message:
                    "El usuario seleccionado no tiene el rol de estudiante."
            });
        }

        let salon;

        if (esMatriculaProfesor) {
            salon = await Salon.findById(idgrupo);

            if (!salon) {
                return response.status(404).json({
                    success: false,
                    message:
                        "El salón especificado no fue encontrado."
                });
            }

            const profesor = await Usuario.findById(
                idProfesor
            )
                .select("_id nombre rol")
                .lean();

            if (!profesor) {
                return response.status(404).json({
                    success: false,
                    message:
                        "El profesor no fue encontrado."
                });
            }

            if (Number(profesor.rol) !== 2) {
                return response.status(403).json({
                    success: false,
                    message:
                        "El usuario indicado no tiene el rol de profesor."
                });
            }

            if (
                !salon.idprofe ||
                salon.idprofe.toString() !==
                    profesor._id.toString()
            ) {
                return response.status(403).json({
                    success: false,
                    message:
                        "No tienes permiso para matricular estudiantes en este salón."
                });
            }
        } else {
            const nombreNormalizado =
                typeof nombre === "string"
                    ? nombre.trim()
                    : "";

            const claveNormalizada =
                typeof clave === "string"
                    ? clave.trim()
                    : "";

            if (!nombreNormalizado || !claveNormalizada) {
                return response.status(400).json({
                    success: false,
                    message:
                        "Se requiere el nombre y la clave del salón."
                });
            }

            salon = await Salon.findOne({
                nombre: nombreNormalizado
            });

            if (!salon) {
                return response.status(404).json({
                    success: false,
                    message:
                        "El nombre del salón no existe."
                });
            }

            if (salon.clave !== claveNormalizada) {
                return response.status(400).json({
                    success: false,
                    message: "La clave del salón es incorrecta."
                });
            }
        }

        const matriculaExistente =
            await SalonEstudiante.findOne({
                idgrupo: salon._id,
                idestudiante: estudiante._id
            });

        const matriculaEstaRetirada =
            matriculaExistente &&
            matriculaExistente.status === "Retirado";

        if (
            matriculaExistente &&
            !matriculaEstaRetirada
        ) {
            return response.status(409).json({
                success: false,
                message:
                    "El estudiante ya está matriculado en este salón."
            });
        }

        const cupoDisponible = Number(salon.cupo);

        if (
            !Number.isFinite(cupoDisponible) ||
            cupoDisponible <= 0
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "No hay cupos disponibles en este salón."
            });
        }

        let matricula;

        if (matriculaEstaRetirada) {
            matriculaExistente.status = "Matriculado";
            matriculaExistente.notafinal = "0";
            matriculaExistente.fecha = new Date();

            matricula = await matriculaExistente.save();
        } else {
            matricula = await SalonEstudiante.create({
                idgrupo: salon._id,
                idestudiante: estudiante._id,
                status: "Matriculado",
                notafinal: "0",
                fecha: new Date()
            });
        }

        try {
            await asignarTareasExistentes(
                salon._id,
                estudiante._id
            );

            salon.cupo = cupoDisponible - 1;
            await salon.save();
        } catch (errorAsignacion) {
            await revertirMatriculaFallida(
                matricula,
                matriculaEstaRetirada
            );

            throw errorAsignacion;
        }

        return response.status(
            matriculaEstaRetirada ? 200 : 201
        ).json({
            success: true,

            message: matriculaEstaRetirada
                ? "La matrícula del estudiante fue reactivada correctamente."
                : "El estudiante fue matriculado correctamente.",

            matricula: {
                _id: matricula._id,
                idgrupo: matricula.idgrupo,
                idestudiante: matricula.idestudiante,
                status: matricula.status,
                notafinal: matricula.notafinal,
                fecha: matricula.fecha
            },

            estudiante: {
                _id: estudiante._id,
                nombre:
                    estudiante.nombre ||
                    "Estudiante sin nombre",
                cedula:
                    estudiante.cedula ||
                    "Sin cédula"
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
            "Error en el proceso de matrícula:",
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
                "Ocurrió un error en el servidor durante el proceso de matrícula."
        });
    }
};

async function asignarTareasExistentes(
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

async function revertirMatriculaFallida(
    matricula,
    eraMatriculaRetirada
) {
    try {
        if (eraMatriculaRetirada) {
            await SalonEstudiante.findByIdAndUpdate(
                matricula._id,
                {
                    $set: {
                        status: "Retirado"
                    }
                }
            );

            return;
        }

        await SalonEstudiante.findByIdAndDelete(
            matricula._id
        );
    } catch (errorReversion) {
        console.error(
            "No fue posible revertir la matrícula después del error:",
            errorReversion
        );
    }
}
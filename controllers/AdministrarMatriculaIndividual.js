const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const {
    Usuario,
    Salon,
    Tarea,
    TareaEstudiante,
    SalonEstudiante
} = require("../models/Models.js");

const ACCIONES_VALIDAS = [
    "MATRICULAR",
    "RETIRAR"
];

const ESTADOS_ACTIVOS = [
    "Matriculado",
    "Aprobado",
    "Reprobado"
];

module.exports = async function AdministrarMatriculaIndividual(
    request,
    response
) {
    const {
        idSalon,
        idAdmin,
        nombre,
        cedula,
        accion
    } = request.body;

    if (
        !idSalon ||
        !idAdmin ||
        !cedula ||
        !accion
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el salón, el administrador, la cédula y la acción."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idSalon) ||
        !mongoose.Types.ObjectId.isValid(idAdmin)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del salón o del administrador no es válido."
        });
    }

    const nombreNormalizado =
        normalizarNombre(nombre);

    const cedulaNormalizada =
        normalizarCedula(cedula);

    const accionNormalizada =
        normalizarAccion(accion);

    if (!cedulaNormalizada) {
        return response.status(400).json({
            success: false,
            message:
                "La cédula del estudiante es obligatoria."
        });
    }

    if (
        !ACCIONES_VALIDAS.includes(
            accionNormalizada
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "La acción debe ser MATRICULAR o RETIRAR."
        });
    }

    try {
        const administrador = await Usuario.findById(
            idAdmin
        )
            .select("_id nombre rol")
            .lean();

        if (!administrador) {
            return response.status(404).json({
                success: false,
                message:
                    "El administrador no fue encontrado."
            });
        }

        if (Number(administrador.rol) !== 1) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para administrar matrículas."
            });
        }

        const salon = await Salon.findById(
            idSalon
        );

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón seleccionado no fue encontrado."
            });
        }

        let usuario = await Usuario.findOne({
            cedula: cedulaNormalizada
        });

        if (accionNormalizada === "RETIRAR") {
            return await retirarEstudiante({
                usuario,
                salon,
                cedulaNormalizada,
                response
            });
        }

        return await matricularEstudiante({
            usuario,
            salon,
            nombreNormalizado,
            cedulaNormalizada,
            response
        });
    } catch (error) {
        console.error(
            "Error al administrar la matrícula individual:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message:
                    "Uno de los identificadores proporcionados no es válido."
            });
        }

        if (error.name === "ValidationError") {
            return response.status(400).json({
                success: false,
                message:
                    "Los datos proporcionados no cumplen las validaciones del sistema."
            });
        }

        if (error.code === 11000) {
            return response.status(409).json({
                success: false,
                message:
                    "Ya existe un registro con esos datos."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error interno al administrar la matrícula."
        });
    }
};

async function matricularEstudiante({
    usuario,
    salon,
    nombreNormalizado,
    cedulaNormalizada,
    response
}) {
    if (
        usuario &&
        Number(usuario.rol) !== 3
    ) {
        return response.status(400).json({
            success: false,
            message:
                "La cédula pertenece a una cuenta que no tiene el rol de estudiante."
        });
    }

    if (!usuario && !nombreNormalizado) {
        return response.status(400).json({
            success: false,
            message:
                "El nombre es obligatorio para crear una cuenta nueva."
        });
    }

    let matriculaExistente = null;

    if (usuario) {
        matriculaExistente =
            await SalonEstudiante.findOne({
                idgrupo: salon._id,
                idestudiante: usuario._id
            });
    }

    if (
        matriculaExistente &&
        ESTADOS_ACTIVOS.includes(
            matriculaExistente.status
        )
    ) {
        return response.status(409).json({
            success: false,
            message:
                "El estudiante ya tiene una matrícula activa en este salón."
        });
    }

    const cupoDisponible = Number(
        salon.cupo
    );

    if (
        !Number.isFinite(cupoDisponible) ||
        cupoDisponible <= 0
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El salón no tiene cupos disponibles."
        });
    }

    let usuarioCreado = false;
    let contrasenaTemporal = "";
    let matricula = null;

    try {
        if (!usuario) {
            contrasenaTemporal =
                generarContrasenaTemporal();

            const contrasenaHasheada =
                await bcrypt.hash(
                    contrasenaTemporal,
                    10
                );

            usuario = await Usuario.create({
                rol: 3,
                nombre: nombreNormalizado,
                cedula: cedulaNormalizada,
                contrasena:
                    contrasenaHasheada,
                debeCambiarContrasena: true,
                fechaCambioContrasena: null,
                fechaCreacion: new Date()
            });

            usuarioCreado = true;
        }

        if (
            matriculaExistente &&
            matriculaExistente.status ===
                "Retirado"
        ) {
            matriculaExistente.status =
                "Matriculado";

            matriculaExistente.notafinal =
                "0";

            matriculaExistente.fecha =
                new Date();

            matricula =
                await matriculaExistente.save();
        } else {
            matricula =
                await SalonEstudiante.create({
                    idgrupo: salon._id,
                    idestudiante: usuario._id,
                    status: "Matriculado",
                    notafinal: "0",
                    fecha: new Date()
                });
        }

        await crearAsignacionesFaltantes(
            salon._id,
            usuario._id
        );

        salon.cupo =
            cupoDisponible - 1;

        await salon.save();

        return response.status(
            usuarioCreado ? 201 : 200
        ).json({
            success: true,

            message: matriculaExistente
                ? "La matrícula fue reactivada correctamente."
                : "El estudiante fue matriculado correctamente.",

            usuarioCreado,

            contrasenaTemporal:
                usuarioCreado
                    ? contrasenaTemporal
                    : null,

            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                cedula: usuario.cedula,
                rol: usuario.rol,
                debeCambiarContrasena:
                    usuario.debeCambiarContrasena
            },

            matricula: {
                _id: matricula._id,
                idgrupo: matricula.idgrupo,
                idestudiante:
                    matricula.idestudiante,
                status: matricula.status,
                notafinal:
                    matricula.notafinal,
                fecha: matricula.fecha
            },

            salon: {
                _id: salon._id,
                nombre: salon.nombre,
                materia: salon.materia,
                cupo: salon.cupo
            }
        });
    } catch (error) {
        await revertirMatriculaIndividual({
            usuario,
            usuarioCreado,
            matricula,
            matriculaExistente
        });

        throw error;
    }
}

async function retirarEstudiante({
    usuario,
    salon,
    cedulaNormalizada,
    response
}) {
    if (!usuario) {
        return response.status(404).json({
            success: false,
            message:
                `No existe un usuario registrado con la cédula ${cedulaNormalizada}.`
        });
    }

    if (Number(usuario.rol) !== 3) {
        return response.status(400).json({
            success: false,
            message:
                "La cédula pertenece a una cuenta que no tiene el rol de estudiante."
        });
    }

    const matricula =
        await SalonEstudiante.findOne({
            idgrupo: salon._id,
            idestudiante: usuario._id
        });

    if (!matricula) {
        return response.status(404).json({
            success: false,
            message:
                "El estudiante no tiene una matrícula en este salón."
        });
    }

    if (matricula.status === "Retirado") {
        return response.status(409).json({
            success: false,
            message:
                "El estudiante ya se encuentra retirado de este salón."
        });
    }

    const estadoAnterior =
        matricula.status;

    const cupoAnterior =
        Number(salon.cupo);

    try {
        matricula.status = "Retirado";

        await matricula.save();

        salon.cupo =
            Number.isFinite(cupoAnterior)
                ? cupoAnterior + 1
                : 1;

        await salon.save();

        return response.status(200).json({
            success: true,
            message:
                "El estudiante fue retirado correctamente.",

            usuarioCreado: false,
            contrasenaTemporal: null,

            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                cedula: usuario.cedula,
                rol: usuario.rol
            },

            matricula: {
                _id: matricula._id,
                idgrupo: matricula.idgrupo,
                idestudiante:
                    matricula.idestudiante,
                status: matricula.status,
                notafinal:
                    matricula.notafinal,
                fecha: matricula.fecha
            },

            salon: {
                _id: salon._id,
                nombre: salon.nombre,
                materia: salon.materia,
                cupo: salon.cupo
            }
        });
    } catch (error) {
        try {
            matricula.status = estadoAnterior;
            await matricula.save();

            if (Number.isFinite(cupoAnterior)) {
                salon.cupo = cupoAnterior;
                await salon.save();
            }
        } catch (errorReversion) {
            console.error(
                "No fue posible revertir el retiro fallido:",
                errorReversion
            );
        }

        throw error;
    }
}

async function crearAsignacionesFaltantes(
    idSalon,
    idEstudiante
) {
    const tareas = await Tarea.find({
        idgrupo: idSalon
    })
        .select("_id")
        .lean();

    if (tareas.length === 0) {
        return;
    }

    const operaciones = tareas.map(
        function (tarea) {
            return {
                updateOne: {
                    filter: {
                        idtarea: tarea._id,
                        idestudiante:
                            idEstudiante
                    },

                    update: {
                        $setOnInsert: {
                            idtarea: tarea._id,
                            idestudiante:
                                idEstudiante
                        }
                    },

                    upsert: true
                }
            };
        }
    );

    await TareaEstudiante.bulkWrite(
        operaciones,
        {
            ordered: false
        }
    );
}

async function revertirMatriculaIndividual({
    usuario,
    usuarioCreado,
    matricula,
    matriculaExistente
}) {
    try {
        if (matricula) {
            if (matriculaExistente) {
                matriculaExistente.status =
                    "Retirado";

                await matriculaExistente.save();
            } else {
                await SalonEstudiante.findByIdAndDelete(
                    matricula._id
                );
            }
        }

        if (
            usuarioCreado &&
            usuario
        ) {
            await Promise.all([
                TareaEstudiante.deleteMany({
                    idestudiante: usuario._id
                }),

                SalonEstudiante.deleteMany({
                    idestudiante: usuario._id
                })
            ]);

            await Usuario.findByIdAndDelete(
                usuario._id
            );
        }
    } catch (errorReversion) {
        console.error(
            "No fue posible revertir por completo la matrícula fallida:",
            errorReversion
        );
    }
}

function generarContrasenaTemporal() {
    const mayusculas =
        "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const minusculas =
        "abcdefghijkmnopqrstuvwxyz";

    const numeros =
        "23456789";

    const simbolos =
        "@#$%";

    const conjuntoCompleto =
        mayusculas +
        minusculas +
        numeros +
        simbolos;

    const caracteres = [
        obtenerCaracterSeguro(mayusculas),
        obtenerCaracterSeguro(minusculas),
        obtenerCaracterSeguro(numeros),
        obtenerCaracterSeguro(simbolos)
    ];

    while (caracteres.length < 12) {
        caracteres.push(
            obtenerCaracterSeguro(
                conjuntoCompleto
            )
        );
    }

    return mezclarCaracteres(
        caracteres
    ).join("");
}

function obtenerCaracterSeguro(
    caracteres
) {
    return caracteres[
        crypto.randomInt(
            0,
            caracteres.length
        )
    ];
}

function mezclarCaracteres(caracteres) {
    const resultado = [...caracteres];

    for (
        let indice = resultado.length - 1;
        indice > 0;
        indice -= 1
    ) {
        const indiceAleatorio =
            crypto.randomInt(
                0,
                indice + 1
            );

        [
            resultado[indice],
            resultado[indiceAleatorio]
        ] = [
            resultado[indiceAleatorio],
            resultado[indice]
        ];
    }

    return resultado;
}

function normalizarNombre(valor) {
    if (typeof valor !== "string") {
        return "";
    }

    return valor
        .trim()
        .replace(/\s+/g, " ");
}

function normalizarCedula(valor) {
    if (
        typeof valor !== "string" &&
        typeof valor !== "number"
    ) {
        return "";
    }

    return String(valor)
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}

function normalizarAccion(valor) {
    if (typeof valor !== "string") {
        return "";
    }

    return valor
        .trim()
        .toLocaleUpperCase("es")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}
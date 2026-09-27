const mongoose = require("mongoose");

const {
    Salon,
    Apps,
    SalonAplicacion,
    SalonEstudiante,
    Usuario
} = require("../models/Models.js");

const ESTADOS_MATRICULA_VISIBLES = [
    "Matriculado",
    "Aprobado",
    "Reprobado"
];

module.exports = async function GetAplicacionesSalon(
    request,
    response
) {
    const {
        idgrupo,
        idusuario,
        incluirDisponibles
    } = request.query;

    if (!idgrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(idgrupo)) {
        return response.status(400).json({
            success: false,
            message: "El ID del salón no es válido."
        });
    }

    if (
        idusuario &&
        !mongoose.Types.ObjectId.isValid(idusuario)
    ) {
        return response.status(400).json({
            success: false,
            message: "El ID del usuario no es válido."
        });
    }

    try {
        const salon = await Salon.findById(idgrupo)
            .select(
                "_id idprofe nombre materia grado logo"
            )
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "El salón no fue encontrado."
            });
        }

        let usuario = null;

        if (idusuario) {
            usuario = await Usuario.findById(idusuario)
                .select("_id nombre rol")
                .lean();

            if (!usuario) {
                return response.status(404).json({
                    success: false,
                    message: "El usuario no fue encontrado."
                });
            }

            const tieneAcceso = await validarAccesoSalon(
                usuario,
                salon
            );

            if (!tieneAcceso) {
                return response.status(403).json({
                    success: false,
                    message:
                        "No tienes permiso para consultar las aplicaciones de este salón."
                });
            }
        }

        const relaciones = await SalonAplicacion.find({
            idgrupo: salon._id
        })
            .sort({
                fecha: 1
            })
            .lean();

        const idsAplicaciones = relaciones.map(
            function (relacion) {
                return relacion.idaplicacion;
            }
        );

        const aplicacionesAsignadas =
            idsAplicaciones.length > 0
                ? await Apps.find({
                    _id: {
                        $in: idsAplicaciones
                    }
                })
                    .select("_id nombre imagen link")
                    .sort({
                        nombre: 1
                    })
                    .lean()
                : [];

        const aplicaciones = aplicacionesAsignadas.map(
            function (aplicacion) {
                const relacion = relaciones.find(
                    function (registro) {
                        return (
                            registro.idaplicacion.toString() ===
                            aplicacion._id.toString()
                        );
                    }
                );

                return {
                    _id: aplicacion._id,
                    nombre: aplicacion.nombre,
                    imagen: aplicacion.imagen,
                    link: normalizarEnlace(
                        aplicacion.link
                    ),
                    fechaAsignacion: relacion
                        ? relacion.fecha
                        : null
                };
            }
        );

        let disponibles = [];

        if (incluirDisponibles === "true") {
            const filtroDisponibles =
                idsAplicaciones.length > 0
                    ? {
                        _id: {
                            $nin: idsAplicaciones
                        }
                    }
                    : {};

            const aplicacionesDisponibles =
                await Apps.find(filtroDisponibles)
                    .select("_id nombre imagen link")
                    .sort({
                        nombre: 1
                    })
                    .lean();

            disponibles = aplicacionesDisponibles.map(
                function (aplicacion) {
                    return {
                        _id: aplicacion._id,
                        nombre: aplicacion.nombre,
                        imagen: aplicacion.imagen,
                        link: normalizarEnlace(
                            aplicacion.link
                        )
                    };
                }
            );
        }

        return response.status(200).json({
            success: true,

            salon: {
                _id: salon._id,
                nombre:
                    salon.nombre ||
                    "Salón sin nombre",
                materia:
                    salon.materia ||
                    "Materia sin especificar",
                grado:
                    salon.grado !== undefined
                        ? salon.grado
                        : null,
                logo: salon.logo || null,
                idprofe: salon.idprofe
            },

            totalAsignadas: aplicaciones.length,
            aplicaciones,
            disponibles
        });
    } catch (error) {
        console.error(
            "Error al consultar las aplicaciones del salón:",
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
                "Ocurrió un error al consultar las aplicaciones del salón."
        });
    }
};

async function validarAccesoSalon(
    usuario,
    salon
) {
    const rol = Number(usuario.rol);

    if (rol === 1) {
        return true;
    }

    if (rol === 2) {
        return Boolean(
            salon.idprofe &&
            salon.idprofe.toString() ===
                usuario._id.toString()
        );
    }

    if (rol === 3) {
        const matricula =
            await SalonEstudiante.findOne({
                idgrupo: salon._id,
                idestudiante: usuario._id,
                status: {
                    $in: ESTADOS_MATRICULA_VISIBLES
                }
            })
                .select("_id")
                .lean();

        return Boolean(matricula);
    }

    return false;
}

function normalizarEnlace(valor) {
    if (
        typeof valor !== "string" ||
        !valor.trim()
    ) {
        return "";
    }

    const enlace = valor.trim();

    if (
        enlace.startsWith("http://") ||
        enlace.startsWith("https://")
    ) {
        return enlace;
    }

    return `https://${enlace}`;
}
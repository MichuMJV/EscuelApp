const mongoose = require("mongoose");

const {
    Usuario,
    Salon,
    Apps,
    SalonAplicacion
} = require("../models/Models.js");

module.exports = async function RetirarAplicacionSalon(
    request,
    response
) {
    const {
        idgrupo,
        idaplicacion,
        idusuario
    } = request.body;

    if (
        !idgrupo ||
        !idaplicacion ||
        !idusuario
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del salón, de la aplicación y del usuario."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idgrupo) ||
        !mongoose.Types.ObjectId.isValid(idaplicacion) ||
        !mongoose.Types.ObjectId.isValid(idusuario)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Uno de los identificadores proporcionados no es válido."
        });
    }

    try {
        const usuario = await Usuario.findById(
            idusuario
        )
            .select("_id nombre rol")
            .lean();

        if (!usuario) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario no fue encontrado."
            });
        }

        const rolUsuario = Number(usuario.rol);

        if (![1, 2].includes(rolUsuario)) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para gestionar las aplicaciones de un salón."
            });
        }

        const salon = await Salon.findById(
            idgrupo
        )
            .select(
                "_id nombre materia idprofe"
            )
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón seleccionado no fue encontrado."
            });
        }

        if (rolUsuario === 2) {
            const esProfesorPropietario =
                salon.idprofe &&
                salon.idprofe.toString() ===
                    usuario._id.toString();

            if (!esProfesorPropietario) {
                return response.status(403).json({
                    success: false,
                    message:
                        "No tienes permiso para gestionar aplicaciones de este salón."
                });
            }
        }

        const aplicacion = await Apps.findById(
            idaplicacion
        )
            .select("_id nombre imagen link")
            .lean();

        if (!aplicacion) {
            return response.status(404).json({
                success: false,
                message:
                    "La aplicación seleccionada no fue encontrada."
            });
        }

        const relacion =
            await SalonAplicacion.findOne({
                idgrupo: salon._id,
                idaplicacion: aplicacion._id
            });

        if (!relacion) {
            return response.status(404).json({
                success: false,
                message:
                    "La aplicación no está asignada a este salón."
            });
        }

        await SalonAplicacion.deleteOne({
            _id: relacion._id
        });

        return response.status(200).json({
            success: true,
            message:
                "La aplicación fue retirada del salón correctamente.",

            salon: {
                _id: salon._id,
                nombre:
                    salon.nombre ||
                    "Salón sin nombre",
                materia:
                    salon.materia ||
                    "Materia sin especificar"
            },

            aplicacion: {
                _id: aplicacion._id,
                nombre:
                    aplicacion.nombre ||
                    "Aplicación sin nombre",
                imagen:
                    aplicacion.imagen || "",
                link: normalizarEnlace(
                    aplicacion.link
                )
            }
        });
    } catch (error) {
        console.error(
            "Error al retirar la aplicación del salón:",
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
                "Ocurrió un error al retirar la aplicación del salón."
        });
    }
};

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
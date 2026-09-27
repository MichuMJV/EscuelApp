const mongoose = require("mongoose");

const {
    Usuario,
    Apps,
    SalonAplicacion
} = require("../models/Models.js");

module.exports = async function DeleteApp(
    request,
    response
) {
    const {
        idaplicacion,
        nombre,
        idusuario: idUsuarioBody
    } = request.body || {};

    const idUsuario =
        idUsuarioBody ||
        request.query.idusuario ||
        request.query.idUsuario ||
        request.query.id;

    if (!idUsuario) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del administrador."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            idUsuario
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del administrador no es válido."
        });
    }

    const nombreNormalizado =
        typeof nombre === "string"
            ? nombre.trim()
            : "";

    if (
        !idaplicacion &&
        !nombreNormalizado
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID o el nombre de la aplicación."
        });
    }

    if (
        idaplicacion &&
        !mongoose.Types.ObjectId.isValid(
            idaplicacion
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID de la aplicación no es válido."
        });
    }

    try {
        const administrador =
            await Usuario.findById(
                idUsuario
            )
                .select(
                    "_id nombre rol"
                )
                .lean();

        if (!administrador) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario administrador no fue encontrado."
            });
        }

        if (
            Number(administrador.rol) !== 1
        ) {
            return response.status(403).json({
                success: false,
                message:
                    "Solo un administrador puede eliminar una aplicación del catálogo global."
            });
        }

        let aplicacion;

        if (idaplicacion) {
            aplicacion = await Apps.findById(
                idaplicacion
            );
        } else {
            aplicacion = await Apps.findOne({
                nombre: {
                    $regex:
                        `^${escaparExpresionRegular(
                            nombreNormalizado
                        )}$`,
                    $options: "i"
                }
            });
        }

        if (!aplicacion) {
            return response.status(404).json({
                success: false,
                message:
                    "La aplicación no fue encontrada."
            });
        }

        const idAplicacion =
            aplicacion._id;

        const datosAplicacion = {
            _id: aplicacion._id,
            nombre: aplicacion.nombre,
            imagen: aplicacion.imagen,
            link: aplicacion.link
        };

        const resultadoRelaciones =
            await SalonAplicacion.deleteMany({
                idaplicacion: idAplicacion
            });

        const resultadoAplicacion =
            await Apps.deleteOne({
                _id: idAplicacion
            });

        if (
            resultadoAplicacion.deletedCount !== 1
        ) {
            return response.status(500).json({
                success: false,
                message:
                    "No fue posible eliminar la aplicación del catálogo."
            });
        }

        return response.status(200).json({
            success: true,

            message:
                "La aplicación fue eliminada del catálogo y retirada de todos los salones.",

            aplicacion: datosAplicacion,

            relacionesEliminadas:
                resultadoRelaciones.deletedCount ||
                0
        });
    } catch (error) {
        console.error(
            "Error al eliminar la aplicación:",
            error
        );

        if (
            error.name === "CastError"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Uno de los identificadores proporcionados no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al eliminar la aplicación."
        });
    }
};

function escaparExpresionRegular(valor) {
    return valor.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}
const mongoose = require("mongoose");

const {
    Usuario,
    Salon,
    Apps,
    SalonAplicacion
} = require("../models/Models.js");

module.exports = async function AgregarAplicacionSalon(
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

        if (
            ![1, 2].includes(
                Number(usuario.rol)
            )
        ) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para gestionar aplicaciones de un salón."
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

        if (
            Number(usuario.rol) === 2 &&
            (
                !salon.idprofe ||
                salon.idprofe.toString() !==
                    usuario._id.toString()
            )
        ) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para gestionar aplicaciones de este salón."
            });
        }

        const aplicacion = await Apps.findById(
            idaplicacion
        )
            .select(
                "_id nombre imagen link"
            )
            .lean();

        if (!aplicacion) {
            return response.status(404).json({
                success: false,
                message:
                    "La aplicación seleccionada no fue encontrada."
            });
        }

        const relacionExistente =
            await SalonAplicacion.findOne({
                idgrupo: salon._id,
                idaplicacion: aplicacion._id
            })
                .select("_id fecha")
                .lean();

        if (relacionExistente) {
            return response.status(409).json({
                success: false,
                message:
                    "La aplicación ya está asignada a este salón."
            });
        }

        const nuevaRelacion =
            await SalonAplicacion.create({
                idgrupo: salon._id,
                idaplicacion:
                    aplicacion._id,
                fecha: new Date()
            });

        return response.status(201).json({
            success: true,
            message:
                "La aplicación fue agregada al salón correctamente.",

            relacion: {
                _id: nuevaRelacion._id,
                idgrupo:
                    nuevaRelacion.idgrupo,
                idaplicacion:
                    nuevaRelacion.idaplicacion,
                fecha:
                    nuevaRelacion.fecha
            },

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
            "Error al agregar la aplicación al salón:",
            error
        );

        if (error.code === 11000) {
            return response.status(409).json({
                success: false,
                message:
                    "La aplicación ya está asignada a este salón."
            });
        }

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
                    "Los datos proporcionados no son válidos."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al agregar la aplicación al salón."
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
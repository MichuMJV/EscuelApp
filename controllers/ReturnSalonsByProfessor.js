const mongoose = require("mongoose");

const {
    Salon,
    Usuario
} = require("../models/Models.js");

module.exports = async function ReturnSalonsByProfessor(
    request,
    response
) {
    const idProfesor =
        request.query.idprofesor ||
        request.query.idProfesor ||
        request.query.id;

    if (!idProfesor) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del profesor.",
            SalonData: []
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            idProfesor
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del profesor no es válido.",
            SalonData: []
        });
    }

    try {
        const profesor = await Usuario.findById(
            idProfesor
        )
            .select(
                "_id nombre rol"
            )
            .lean();

        if (!profesor) {
            return response.status(404).json({
                success: false,
                message:
                    "El profesor no fue encontrado.",
                SalonData: []
            });
        }

        if (Number(profesor.rol) !== 2) {
            return response.status(403).json({
                success: false,
                message:
                    "El usuario indicado no tiene el rol de profesor.",
                SalonData: []
            });
        }

        const SalonData = await Salon.find({
            idprofe: profesor._id
        })
            .select(
                "_id idprofe nombre grado materia fecha clave logo cupo"
            )
            .sort({
                nombre: 1,
                materia: 1
            })
            .lean();

        return response.status(200).json({
            success: true,
            profesor: {
                _id: profesor._id,
                nombre:
                    profesor.nombre ||
                    "Profesor"
            },
            total: SalonData.length,
            SalonData
        });
    } catch (error) {
        console.error(
            "Error al consultar los salones del profesor:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message:
                    "El identificador proporcionado no es válido.",
                SalonData: []
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al consultar los salones del profesor.",
            SalonData: []
        });
    }
};
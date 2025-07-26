// controllers/getSalonesEstudiante.js

// 1. CORRECCIÓN: Importamos el modelo 'Salon', no el nombre de la colección.
const { SalonEstudiante, Salon } = require("../models/Models.js");
const mongoose = require("mongoose");

module.exports = async function getSalonesEstudiante(request, response) {
    const { idestudiante } = request.query;

    if (!idestudiante) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del estudiante.",
        });
    }

    try {
        const salones = await SalonEstudiante.aggregate([
            {
                $match: {
                    idestudiante: new mongoose.Types.ObjectId(idestudiante)
                }
            },
            {
                $lookup: {
                    // 2. CORRECCIÓN: El nombre de la colección debe ser EXACTO, en minúsculas.
                    from: "salonesescuela",
                    localField: "idgrupo",
                    foreignField: "_id",
                    as: "salonDetails"
                }
            },
            {
                $unwind: "$salonDetails"
            },
            {
                $replaceRoot: { newRoot: "$salonDetails" }
            }
        ]);

        return response.status(200).json({
            success: true,
            salones: salones
        });

    } catch (error) {
        console.error("Error al obtener los salones del estudiante:", error);
        return response.status(500).json({
            success: false,
            message: "Error en el servidor."
        });
    }
};
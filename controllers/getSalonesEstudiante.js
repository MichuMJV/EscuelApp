// controllers/getSalonesEstudiante.js
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
        // Usamos aggregate para "unir" las matrículas con los detalles del salón
        const salones = await SalonEstudiante.aggregate([
            // 1. Encontrar todas las matrículas del estudiante
            {
                $match: {
                    idestudiante: new mongoose.Types.ObjectId(idestudiante),
                    status: "Matriculado" // Opcional: solo mostrar salones donde esté activo
                }
            },
            // 2. Unir con la colección 'salones' para obtener los detalles
            {
                $lookup: {
                    from: "salonesescuela", // Nombre de la colección de salones en la BD
                    localField: "idgrupo",
                    foreignField: "_id",
                    as: "salonDetails"
                }
            },
            // 3. Descomprimir el array resultante de 'salonDetails'
            {
                $unwind: "$salonDetails"
            },
            // 4. Reemplazar la raíz del documento para devolver solo los detalles del salón
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
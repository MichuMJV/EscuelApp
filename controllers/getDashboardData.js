// controllers/getDashboardData.js
const { TareaEstudiante, Usuario, Tarea } = require("../models/Models.js");
const mongoose = require("mongoose");

module.exports = async function getDashboardData(request, response) {
    const { idgrupo } = request.query;
    if (!idgrupo) {
        return response.status(400).json({ success: false, message: "Se requiere el ID del salón." });
    }

    try {
        const dashboardData = await TareaEstudiante.aggregate([
            // 1. Unir con Tarea para obtener el nombre de la tarea y el idgrupo
            {
                $lookup: {
                    from: Tarea.collection.name,
                    localField: "idtarea",
                    foreignField: "_id",
                    as: "datosTarea"
                }
            },
            // 2. Unir con Usuario para obtener el nombre del estudiante
            {
                $lookup: {
                    from: Usuario.collection.name,
                    localField: "idestudiante",
                    foreignField: "_id",
                    as: "datosEstudiante"
                }
            },
            // 3. Descomprimir los arrays resultantes
            { $unwind: "$datosTarea" },
            { $unwind: "$datosEstudiante" },
            // 4. Filtrar para mostrar solo las entregas del salón actual
            {
                $match: {
                    "datosTarea.idgrupo": new mongoose.Types.ObjectId(idgrupo)
                }
            },
            // 5. Proyectar y formatear los datos para que sean fáciles de usar en el frontend
            {
                $project: {
                    _id: 1, // El ID de la entrega (TareaEstudiante)
                    nombreEstudiante: "$datosEstudiante.nombre",
                    nombreTarea: "$datosTarea.nombre",
                    docentrega: 1,
                    fechaentrega: 1,
                    nota: 1
                }
            }
        ]);

        return response.status(200).json({ success: true, data: dashboardData });

    } catch (error) {
        console.error("Error al obtener los datos del dashboard:", error);
        return response.status(500).json({ success: false, message: "Error en el servidor." });
    }
};
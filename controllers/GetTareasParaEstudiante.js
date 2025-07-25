const { Tarea, Salon } = require("../models/Models.js");
const mongoose = require("mongoose"); // Necesitamos mongoose para convertir strings a ObjectId

module.exports = async function GetTareasParaEstudiante(request, response) {
    // Obtenemos el ID del salón Y el ID del estudiante
    const { idgrupo, idestudiante } = request.query;

    // Verificamos que se hayan enviado ambos IDs
    if (!idgrupo || !idestudiante) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón y del estudiante."
        });
    }

    try {
        // Verificamos que el salón exista
        const salonExiste = await Salon.findById(idgrupo);
        if (!salonExiste) {
            return response.status(404).json({ success: false, message: "El salón no fue encontrado." });
        }

        // AGGREGATION: La magia para unir las colecciones
        const tareasConNotas = await Tarea.aggregate([
            // 1. Encontrar todas las tareas que pertenecen al salón (idgrupo)
            {
                $match: {
                    idgrupo: new mongoose.Types.ObjectId(idgrupo)
                }
            },
            // 2. Unir (lookup) con la colección TareaEstudiante
            {
                $lookup: {
                    from: "tareasestudianteescuela", // Nombre de la colección en la DB
                    let: { tarea_id: "$_id" }, // Variable local para el id de la tarea actual
                    pipeline: [
                        {
                            // Buscamos una coincidencia donde el id de la tarea Y el id del estudiante sean correctos
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$idtarea", "$$tarea_id"] },
                                        { $eq: ["$idestudiante", new mongoose.Types.ObjectId(idestudiante)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "miAsignacion" // El resultado de la unión se guardará aquí
                }
            },
            // 3. Aplanar el resultado para que sea más fácil de usar en el frontend
            {
                $addFields: {
                    miAsignacion: { $arrayElemAt: ["$miAsignacion", 0] }
                }
            }
        ]);

        return response.status(200).json({
            success: true,
            tareas: tareasConNotas
        });

    } catch (error) {
        console.error("Error al obtener las tareas para el estudiante:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};
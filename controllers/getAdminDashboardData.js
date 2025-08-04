// controllers/getAdminDashboardData.js
const { TareaEstudiante, Usuario, Tarea, Salon } = require("../models/Models.js");
const mongoose = require("mongoose");

module.exports = async function getAdminDashboardData(request, response) {
    try {
        const fullData = await TareaEstudiante.aggregate([
            // 1. Ordenamos por fecha de entrega más reciente primero.
            {
                $sort: { fechaentrega: -1 }
            },
            // 2. Unimos con la colección de Tareas para obtener sus detalles.
            {
                $lookup: {
                    from: Tarea.collection.name,
                    localField: "idtarea",
                    foreignField: "_id",
                    as: "datosTarea"
                }
            },
            // 3. Unimos con la colección de Usuarios para obtener el nombre del estudiante.
            {
                $lookup: {
                    from: Usuario.collection.name,
                    localField: "idestudiante",
                    foreignField: "_id",
                    as: "datosEstudiante"
                }
            },
            // 4. Descomprimimos los arrays para poder acceder a los campos.
            { $unwind: "$datosTarea" },
            { $unwind: "$datosEstudiante" },
            // 5. Ahora que tenemos el 'idgrupo', unimos con la colección de Salones.
            {
                $lookup: {
                    from: Salon.collection.name,
                    localField: "datosTarea.idgrupo",
                    foreignField: "_id",
                    as: "datosSalon"
                }
            },
            { $unwind: "$datosSalon" },
            // 6. Proyectamos y formateamos los campos para un resultado limpio.
            {
                $project: {
                    _id: 1, // El ID único de la entrega
                    nombreEstudiante: "$datosEstudiante.nombre",
                    nombreSalon: "$datosSalon.nombre",
                    materia: "$datosSalon.materia",
                    nombreTarea: "$datosTarea.nombre",
                    docentrega: "$docentrega",
                    fechaentrega: "$fechaentrega",
                    nota: "$nota"
                }
            }
        ]);

        return response.status(200).json({ success: true, data: fullData });

    } catch (error) {
        console.error("Error al obtener los datos del dashboard de admin:", error);
        return response.status(500).json({ success: false, message: "Error en el servidor." });
    }
};
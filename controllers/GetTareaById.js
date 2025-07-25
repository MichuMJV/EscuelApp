const { Tarea } = require("../models/Models.js");

module.exports = async function GetTareaById(request, response) {
    // Obtenemos el ID de la tarea desde los parámetros de la URL
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID de la tarea."
        });
    }

    try {
        // Buscamos la tarea en la base de datos por su ID
        const tarea = await Tarea.findById(id);

        if (!tarea) {
            return response.status(404).json({
                success: false,
                message: "Tarea no encontrada."
            });
        }

        // Si la encontramos, la devolvemos en la respuesta
        return response.status(200).json({
            success: true,
            tarea: tarea
        });

    } catch (error) {
        console.error("Error al obtener la tarea por ID:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};
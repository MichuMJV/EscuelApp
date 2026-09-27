const { Tarea } = require("../models/Models.js");

module.exports = async function GetTareaById(request, response) {
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID de la tarea."
        });
    }

    try {
        const tareaEncontrada = await Tarea.findById(id).lean();

        if (!tareaEncontrada) {
            return response.status(404).json({
                success: false,
                message: "Tarea no encontrada."
            });
        }

        const temaNormalizado =
            typeof tareaEncontrada.tema === "string" &&
            tareaEncontrada.tema.trim()
                ? tareaEncontrada.tema.trim()
                : "Sin tema";

        const tarea = {
            ...tareaEncontrada,
            tema: temaNormalizado
        };

        return response.status(200).json({
            success: true,
            tarea: tarea
        });
    } catch (error) {
        console.error(
            "Error al obtener la tarea por ID:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message: "El ID de la tarea no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};
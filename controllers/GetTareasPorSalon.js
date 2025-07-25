// Importamos los modelos necesarios
const { Tarea, Salon } = require("../models/Models.js");

module.exports = async function GetTareasPorSalon(request, response) {
    // Obtenemos el ID del salón desde los query params de la URL
    const { id: idgrupo } = request.query;

    // Verificamos que se haya enviado un ID
    if (!idgrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
        });
    }

    try {
        // Paso 1: Verificamos que el salón realmente exista (buena práctica)
        const salonExiste = await Salon.findById(idgrupo);
        if (!salonExiste) {
            return response.status(404).json({
                success: false,
                message: "El salón especificado no fue encontrado."
            });
        }

        // Paso 2: Buscamos todas las tareas que coincidan con el idgrupo
        const tareas = await Tarea.find({ idgrupo: idgrupo });

        // Enviamos la respuesta con las tareas encontradas (puede ser un array vacío)
        return response.status(200).json({
            success: true,
            tareas: tareas
        });

    } catch (error) {
        console.error("Error al obtener las tareas por salón:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};
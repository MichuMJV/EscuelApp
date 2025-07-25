// UpdateTarea.js
const { Tarea } = require("../models/Models.js");

module.exports = async function UpdateTarea(request, response) {
    const { id } = request.query;
    // El body contendrá los campos actualizados
    const datosActualizados = request.body;

    if (!id) {
        return response.status(400).json({ success: false, message: "Se requiere el ID de la tarea." });
    }

    try {
        // findByIdAndUpdate busca por ID y actualiza el documento con los nuevos datos
        const tareaActualizada = await Tarea.findByIdAndUpdate(id, datosActualizados, { new: true });

        if (!tareaActualizada) {
            return response.status(404).json({ success: false, message: "Tarea no encontrada." });
        }
        
        return response.status(200).json({
            success: true,
            message: "Tarea actualizada correctamente",
            tarea: tareaActualizada
        });

    } catch (error) {
        console.error("Error al actualizar la tarea:", error);
        return response.status(500).json({ success: false, message: "Error en el servidor." });
    }
};
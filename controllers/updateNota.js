// controllers/updateNota.js
const { TareaEstudiante } = require("../models/Models.js");

module.exports = async function updateNota(request, response) {
    // Recibimos el ID de la entrega (no de la tarea) y la nueva nota
    const { idEntrega, nuevaNota } = request.body;

    if (!idEntrega || nuevaNota === undefined) {
        return response.status(400).json({ success: false, message: "Se requiere el ID de la entrega y la nueva nota." });
    }

    try {
        const entregaActualizada = await TareaEstudiante.findByIdAndUpdate(
            idEntrega,
            { $set: { nota: nuevaNota } },
            { new: true } // Esta opción devuelve el documento ya actualizado
        );

        if (!entregaActualizada) {
            return response.status(404).json({ success: false, message: "Entrega no encontrada." });
        }

        return response.status(200).json({ success: true, message: "Nota actualizada.", data: entregaActualizada });

    } catch (error) {
        console.error("Error al actualizar la nota:", error);
        return response.status(500).json({ success: false, message: "Error en el servidor." });
    }
};
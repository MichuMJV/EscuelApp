const { TareaEstudiante, Usuario } = require("../models/Models.js");

module.exports = async function updateNota(request, response) {
    // 1. Recibimos también el ID de la persona que está calificando.
    const { idEntrega, nuevaNota, idCalificador } = request.body;

    console.log("Datos recibidos para actualizar nota:", { idEntrega, nuevaNota, idCalificador });

    if (!idEntrega || nuevaNota === undefined || !idCalificador) {
        return response.status(400).json({ 
            success: false, 
            message: "Se requiere el ID de la entrega, la nueva nota y el ID del calificador." 
        });
    }

    try {
        // 2. Buscamos al usuario que intenta calificar.
        const calificador = await Usuario.findById(idCalificador);

        if (!calificador) {
            return response.status(404).json({ success: false, message: "El usuario calificador no fue encontrado." });
        }

        // 3. Verificamos que su rol sea Administrador (1) o Profesor (2).
        if (![1, 2].includes(calificador.rol)) {
            return response.status(403).json({ success: false, message: "No tienes permiso para calificar tareas." });
        }

        // 4. Si todo es correcto, procede a actualizar la nota.
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
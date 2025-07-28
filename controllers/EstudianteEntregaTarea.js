// controllers/EstudianteEntregaTarea.js
const { TareaEstudiante } = require("../models/Models.js");

module.exports = async function EstudianteEntregaTarea(request, response) {
    const { idtarea, idestudiante, docentrega } = request.body;

    if (!idtarea || !idestudiante || !docentrega) {
        return response.status(400).json({ success: false, message: "Faltan datos para la entrega." });
    }

    try {
        // Busca una entrega para esta tarea/estudiante. Si existe, la actualiza. Si no, la crea.
        const entrega = await TareaEstudiante.findOneAndUpdate(
            { idtarea: idtarea, idestudiante: idestudiante }, // El filtro para buscar
            { 
                $set: { 
                    docentrega: docentrega,
                    fechaentrega: new Date()
                } 
            }, // Los datos a actualizar o insertar
            { 
                new: true,    // Devuelve el documento ya actualizado
                upsert: true  // Opción clave: Crea el documento si no existe
            }
        );

        return response.status(200).json({
            success: true,
            message: "Tarea entregada exitosamente.",
            entrega: entrega
        });

    } catch (error) {
        console.error("Error al entregar la tarea:", error);
        return response.status(500).json({ success: false, message: "Error en el servidor." });
    }
};
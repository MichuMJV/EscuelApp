// controllers/DeleteSalon.js
const { Salon, Tarea, SalonEstudiante, TareaEstudiante, Usuario } = require("../models/Models.js");
const mongoose = require("mongoose");

module.exports = async function DeleteSalon(request, response) {
    // 1. Recibimos los IDs desde el body para mayor seguridad
    const { idSalon, idAdmin } = request.body;

    if (!idSalon || !idAdmin) {
        return response.status(400).json({ success: false, message: "Falta el ID del salón o del administrador." });
    }

    try {
        // 2. Verificamos que el usuario que realiza la acción sea un administrador
        const admin = await Usuario.findById(idAdmin);
        if (!admin || admin.rol !== 1) { // Solo el rol 1 (Admin) puede borrar salones
            return response.status(403).json({ success: false, message: "No tienes permisos para realizar esta acción." });
        }

        // --- INICIO DE LA ELIMINACIÓN EN CASCADA ---
        // Esto asegura que no queden datos huérfanos en la base de datos.

        // 3. Encontrar todas las tareas asociadas a este salón
        const tareasParaBorrar = await Tarea.find({ idgrupo: idSalon }).select('_id');
        const idsDeTareas = tareasParaBorrar.map(t => t._id);

        // 4. Borrar todas las entregas de los estudiantes para esas tareas
        if (idsDeTareas.length > 0) {
            await TareaEstudiante.deleteMany({ idtarea: { $in: idsDeTareas } });
        }

        // 5. Borrar todas las tareas del salón
        await Tarea.deleteMany({ idgrupo: idSalon });

        // 6. Borrar todas las matrículas de estudiantes en este salón
        await SalonEstudiante.deleteMany({ idgrupo: idSalon });

        // 7. Finalmente, borrar el salón mismo
        const resultado = await Salon.findByIdAndDelete(idSalon);

        if (!resultado) {
            return response.status(404).json({ success: false, message: "El salón no fue encontrado." });
        }
        
        // (Para una app en producción, estos 5 pasos se envolverían en una "transacción"
        // para asegurar que si uno falla, no se borre nada.)

        return response.json({ success: true, message: "Salón y todos sus datos relacionados eliminados exitosamente." });

    } catch (error) {
        console.error("Error al eliminar el salón:", error);
        return response.status(500).json({ success: false, message: "Error en el servidor." });
    }
};
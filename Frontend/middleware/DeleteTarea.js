const mongoose = require("mongoose");
const {
    Tarea,
    TareaEstudiante,
    Salon,
    Usuario
} = require("../models/Models.js");
const {
    obtenerIdsArchivos,
    eliminarVariosArchivosGridFS
} = require("../middleware/archivosTareas.js");

module.exports = async function DeleteTarea(request, response) {
    const idTarea = request.params.id || request.query.id;
    const idUsuario = request.body?.idUsuario || request.query.idUsuario;

    if (!idTarea || !idUsuario) {
        return response.status(400).json({
            success: false,
            message: "Se requieren el ID de la tarea y el ID del usuario."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(idTarea) || !mongoose.Types.ObjectId.isValid(idUsuario)) {
        return response.status(400).json({
            success: false,
            message: "El ID de la tarea o del usuario no es válido."
        });
    }

    try {
        const [tarea, usuario] = await Promise.all([
            Tarea.findById(idTarea),
            Usuario.findById(idUsuario).select("_id rol").lean()
        ]);

        if (!tarea) {
            return response.status(404).json({ success: false, message: "Tarea no encontrada." });
        }

        if (!usuario) {
            return response.status(404).json({ success: false, message: "Usuario no encontrado." });
        }

        const salon = await Salon.findById(tarea.idgrupo).select("_id idprofe").lean();
        if (!salon) {
            return response.status(404).json({ success: false, message: "Salón no encontrado." });
        }

        const esAdministrador = Number(usuario.rol) === 1;
        const esProfesorPropietario =
            Number(usuario.rol) === 2 &&
            salon.idprofe &&
            String(salon.idprofe) === String(usuario._id);

        if (!esAdministrador && !esProfesorPropietario) {
            return response.status(403).json({
                success: false,
                message: "No tienes permiso para eliminar esta tarea."
            });
        }

        const entregas = await TareaEstudiante.find({ idtarea: tarea._id })
            .select("archivos archivoEntrega")
            .lean();

        const idsArchivos = [
            ...obtenerIdsArchivos(tarea),
            ...entregas.flatMap(obtenerIdsArchivos)
        ];

        // Primero quitamos las referencias de negocio. La limpieza de GridFS es idempotente
        // y se ejecuta después para evitar dejar una tarea visible a medias.
        await TareaEstudiante.deleteMany({ idtarea: tarea._id });
        await Tarea.deleteOne({ _id: tarea._id });

        const resultadosArchivos = await eliminarVariosArchivosGridFS(idsArchivos);
        const archivosConError = resultadosArchivos.filter(
            (resultado) => resultado.status === "rejected"
        ).length;

        return response.status(200).json({
            success: true,
            message: archivosConError
                ? "La tarea fue eliminada. Algunos archivos necesitarán limpieza posterior."
                : "Tarea, entregas y archivos eliminados correctamente.",
            data: {
                idTarea: String(tarea._id),
                entregasEliminadas: entregas.length,
                archivosProcesados: idsArchivos.length,
                archivosConError
            }
        });
    } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error al eliminar la tarea."
        });
    }
};

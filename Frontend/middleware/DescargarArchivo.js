const mongoose = require("mongoose");
const {
    Tarea,
    TareaEstudiante,
    Salon,
    Matricula,
    Usuario
} = require("../models/Models.js");
const {
    obtenerBucket,
    buscarArchivoGridFS
} = require("../middleware/archivosTareas.js");

function idsIguales(a, b) {
    return Boolean(a && b && String(a) === String(b));
}

async function usuarioPuedeDescargar(usuario, archivo) {
    const metadata = archivo.metadata || {};
    const rol = Number(usuario.rol);

    if (rol === 1) return true;

    if (metadata.categoria === "material_tarea") {
        if (!metadata.idTarea || !metadata.idSalon) return false;

        const tarea = await Tarea.findById(metadata.idTarea).select("_id idgrupo").lean();
        if (!tarea || !idsIguales(tarea.idgrupo, metadata.idSalon)) return false;

        const salon = await Salon.findById(metadata.idSalon).select("_id idprofe").lean();
        if (!salon) return false;

        if (rol === 2) return idsIguales(salon.idprofe, usuario._id);

        if (rol === 3) {
            return Boolean(await Matricula.exists({
                idgrupo: salon._id,
                idestudiante: usuario._id,
                status: { $ne: "Retirado" }
            }));
        }
    }

    if (metadata.categoria === "entrega_estudiante") {
        if (rol === 3) return idsIguales(metadata.idEstudiante, usuario._id);

        if (rol === 2 && metadata.idTarea) {
            const tarea = await Tarea.findById(metadata.idTarea).select("idgrupo").lean();
            if (!tarea) return false;
            const salon = await Salon.findById(tarea.idgrupo).select("idprofe").lean();
            return Boolean(salon && idsIguales(salon.idprofe, usuario._id));
        }
    }

    return false;
}

module.exports = async function DescargarArchivo(request, response) {
    const idArchivo = request.params.idarchivo || request.query.idarchivo;
    const idUsuario = request.query.idusuario;

    if (!idArchivo || !idUsuario) {
        return response.status(400).json({
            success: false,
            message: "Se requieren el ID del archivo y el ID del usuario."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(idArchivo) || !mongoose.Types.ObjectId.isValid(idUsuario)) {
        return response.status(400).json({
            success: false,
            message: "El ID del archivo o del usuario no es válido."
        });
    }

    try {
        const [usuario, archivo] = await Promise.all([
            Usuario.findById(idUsuario).select("_id rol").lean(),
            buscarArchivoGridFS(idArchivo)
        ]);

        if (!usuario) {
            return response.status(404).json({ success: false, message: "Usuario no encontrado." });
        }

        if (!archivo) {
            return response.status(404).json({ success: false, message: "Archivo no encontrado." });
        }

        if (!(await usuarioPuedeDescargar(usuario, archivo))) {
            return response.status(403).json({
                success: false,
                message: "No tienes permiso para descargar este archivo."
            });
        }

        const nombre = String(
            archivo.metadata?.nombreOriginal || archivo.filename || "archivo"
        ).replace(/[\r\n"]/g, "_");

        response.setHeader("Content-Type", archivo.contentType || "application/octet-stream");
        response.setHeader("Content-Length", archivo.length);
        response.setHeader(
            "Content-Disposition",
            `attachment; filename="${nombre}"; filename*=UTF-8''${encodeURIComponent(nombre)}`
        );
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Cache-Control", "private, no-store");

        obtenerBucket()
            .openDownloadStream(archivo._id)
            .on("error", (error) => {
                console.error("Error al transmitir el archivo:", error);
                if (!response.headersSent) {
                    response.status(500).json({
                        success: false,
                        message: "No fue posible descargar el archivo."
                    });
                } else {
                    response.destroy(error);
                }
            })
            .pipe(response);
    } catch (error) {
        console.error("Error al descargar el archivo:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error al descargar el archivo."
        });
    }
};

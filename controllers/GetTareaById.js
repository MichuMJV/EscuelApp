const mongoose = require("mongoose");
const { Tarea, Usuario, Salon } = require("../models/Models.js");

function construirDescarga(archivo, idUsuario) {
    if (!archivo?.archivoId) return null;

    const datos = archivo.toObject?.() || archivo;

    return {
        ...datos,
        urlDescarga: idUsuario
            ? `/Escuelapp/DescargarArchivo/${encodeURIComponent(datos.archivoId)}` +
              `?idusuario=${encodeURIComponent(idUsuario)}`
            : null
    };
}

module.exports = async function GetTareaById(request, response) {
    const { id, idusuario } = request.query;

    if (!id) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID de la tarea."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
            success: false,
            message: "El ID de la tarea no es válido."
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

        if (idusuario) {
            if (!mongoose.Types.ObjectId.isValid(idusuario)) {
                return response.status(400).json({
                    success: false,
                    message: "El ID del usuario no es válido."
                });
            }

            const [usuario, salon] = await Promise.all([
                Usuario.findById(idusuario).select("_id rol").lean(),
                Salon.findById(tareaEncontrada.idgrupo).select("idprofe").lean()
            ]);

            if (!usuario || !salon) {
                return response.status(404).json({
                    success: false,
                    message: "Usuario o salón no encontrado."
                });
            }

            const usuarioAutorizado =
                Number(usuario.rol) === 1 ||
                (Number(usuario.rol) === 2 &&
                    String(salon.idprofe) === String(usuario._id));

            if (!usuarioAutorizado) {
                return response.status(403).json({
                    success: false,
                    message: "No tienes permiso para consultar esta tarea."
                });
            }
        }

        const tema =
            typeof tareaEncontrada.tema === "string" && tareaEncontrada.tema.trim()
                ? tareaEncontrada.tema.trim()
                : "Sin tema";

        const tarea = {
            ...tareaEncontrada,
            tema,
            archivos: (tareaEncontrada.archivos || []).map((archivo) =>
                construirDescarga(archivo, idusuario)
            )
        };

        return response.status(200).json({
            success: true,
            tarea
        });
    } catch (error) {
        console.error("Error al obtener la tarea por ID:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};

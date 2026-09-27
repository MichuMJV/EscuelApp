const { Tarea } = require("../models/Models.js");

module.exports = async function UpdateTarea(request, response) {
    const { id } = request.query;

    const {
        tema,
        nombre,
        descripcion,
        doctarea,
        fechavencimiento
    } = request.body;

    if (!id) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID de la tarea."
        });
    }

    const temaNormalizado =
        typeof tema === "string"
            ? tema.trim()
            : "";

    const nombreNormalizado =
        typeof nombre === "string"
            ? nombre.trim()
            : "";

    const descripcionNormalizada =
        typeof descripcion === "string"
            ? descripcion.trim()
            : "";

    const documentoNormalizado =
        typeof doctarea === "string"
            ? doctarea.trim()
            : "";

    if (
        !temaNormalizado ||
        !nombreNormalizado ||
        !descripcionNormalizada ||
        !documentoNormalizado ||
        !fechavencimiento
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Faltan campos requeridos: tema, nombre, descripción, documento o fecha de vencimiento."
        });
    }

    const fechaVencimiento = new Date(fechavencimiento);

    if (Number.isNaN(fechaVencimiento.getTime())) {
        return response.status(400).json({
            success: false,
            message: "La fecha de vencimiento no es válida."
        });
    }

    if (fechaVencimiento.getTime() <= Date.now()) {
        return response.status(400).json({
            success: false,
            message:
                "La fecha de vencimiento debe ser posterior a la fecha y hora actuales."
        });
    }

    const datosActualizados = {
        tema: temaNormalizado,
        nombre: nombreNormalizado,
        descripcion: descripcionNormalizada,
        doctarea: documentoNormalizado,
        fechavencimiento: fechaVencimiento
    };

    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            id,
            {
                $set: datosActualizados
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!tareaActualizada) {
            return response.status(404).json({
                success: false,
                message: "Tarea no encontrada."
            });
        }

        return response.status(200).json({
            success: true,
            message: "Tarea actualizada correctamente.",
            tarea: tareaActualizada
        });
    } catch (error) {
        console.error(
            "Error al actualizar la tarea:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message: "El ID de la tarea no es válido."
            });
        }

        if (error.name === "ValidationError") {
            return response.status(400).json({
                success: false,
                message:
                    "Los datos proporcionados para la tarea no son válidos."
            });
        }

        return response.status(500).json({
            success: false,
            message: "Error en el servidor."
        });
    }
};
const mongoose = require("mongoose");

const {
    TareaEstudiante,
    Usuario,
    Tarea,
    Salon
} = require("../models/Models.js");

module.exports = async function updateNota(request, response) {
    const {
        idEntrega,
        nuevaNota,
        idCalificador
    } = request.body;

    if (
        !idEntrega ||
        nuevaNota === undefined ||
        nuevaNota === null ||
        !idCalificador
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID de la entrega, la nueva nota y el ID del calificador."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idEntrega) ||
        !mongoose.Types.ObjectId.isValid(idCalificador)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID de la entrega o del calificador no es válido."
        });
    }

    const notaNormalizada =
        typeof nuevaNota === "string"
            ? nuevaNota.trim()
            : nuevaNota;

    if (
        notaNormalizada === ""
    ) {
        return response.status(400).json({
            success: false,
            message: "La calificación no puede estar vacía."
        });
    }

    const notaNumerica = Number(notaNormalizada);

    if (
        !Number.isFinite(notaNumerica) ||
        notaNumerica < 0 ||
        notaNumerica > 100
    ) {
        return response.status(400).json({
            success: false,
            message:
                "La calificación debe ser un número entre 0 y 100."
        });
    }

    try {
        const calificador = await Usuario.findById(
            idCalificador
        )
            .select("_id nombre rol")
            .lean();

        if (!calificador) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario que intenta calificar no fue encontrado."
            });
        }

        const rolCalificador = Number(calificador.rol);

        if (![1, 2].includes(rolCalificador)) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para calificar tareas."
            });
        }

        const entrega = await TareaEstudiante.findById(
            idEntrega
        );

        if (!entrega) {
            return response.status(404).json({
                success: false,
                message:
                    "La asignación de la tarea no fue encontrada."
            });
        }

        const documentoEntregado =
            typeof entrega.docentrega === "string"
                ? entrega.docentrega.trim()
                : "";

        if (!documentoEntregado) {
            return response.status(400).json({
                success: false,
                message:
                    "No se puede calificar una tarea que todavía no ha sido entregada."
            });
        }

        const tarea = await Tarea.findById(
            entrega.idtarea
        )
            .select("_id idgrupo nombre")
            .lean();

        if (!tarea) {
            return response.status(404).json({
                success: false,
                message:
                    "La tarea relacionada con esta entrega no fue encontrada."
            });
        }

        const salon = await Salon.findById(
            tarea.idgrupo
        )
            .select("_id nombre idprofe")
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón relacionado con esta tarea no fue encontrado."
            });
        }

        if (rolCalificador === 2) {
            const profesorEsPropietario =
                salon.idprofe &&
                salon.idprofe.toString() ===
                    calificador._id.toString();

            if (!profesorEsPropietario) {
                return response.status(403).json({
                    success: false,
                    message:
                        "No tienes permiso para calificar tareas de este salón."
                });
            }
        }

        entrega.nota = String(notaNumerica);

        const entregaActualizada =
            await entrega.save();

        return response.status(200).json({
            success: true,
            message: "Calificación actualizada correctamente.",

            data: {
                _id: entregaActualizada._id,
                idtarea: entregaActualizada.idtarea,
                idestudiante:
                    entregaActualizada.idestudiante,
                nota: entregaActualizada.nota,
                docentrega:
                    entregaActualizada.docentrega,
                fechaentrega:
                    entregaActualizada.fechaentrega
            }
        });
    } catch (error) {
        console.error(
            "Error al actualizar la calificación:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message:
                    "Uno de los identificadores proporcionados no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error en el servidor al actualizar la calificación."
        });
    }
};
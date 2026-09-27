const { Tarea, Salon } = require("../models/Models.js");

module.exports = async function GetTareasPorSalon(request, response) {
    const { id: idgrupo } = request.query;

    if (!idgrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
        });
    }

    try {
        const salonExiste = await Salon.findById(idgrupo);

        if (!salonExiste) {
            return response.status(404).json({
                success: false,
                message: "El salón especificado no fue encontrado."
            });
        }

        const tareasEncontradas = await Tarea.find({
            idgrupo: idgrupo
        })
            .sort({
                tema: 1,
                fechavencimiento: 1
            })
            .lean();

        const tareas = tareasEncontradas.map(function (tarea) {
            const temaNormalizado =
                typeof tarea.tema === "string" &&
                tarea.tema.trim()
                    ? tarea.tema.trim()
                    : "Sin tema";

            return {
                ...tarea,
                tema: temaNormalizado
            };
        });

        return response.status(200).json({
            success: true,
            tareas: tareas
        });
    } catch (error) {
        console.error(
            "Error al obtener las tareas por salón:",
            error
        );

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message: "El ID del salón no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};
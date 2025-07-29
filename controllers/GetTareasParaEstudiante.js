const { Tarea, TareaEstudiante } = require("../models/Models.js");
const mongoose = require("mongoose");

module.exports = async function GetTareasParaEstudiante(request, response) {
    const { idgrupo, idestudiante } = request.query;

    if (!idgrupo || !idestudiante) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón y del estudiante.",
        });
    }

    try {
        // PASO 1: Buscar todas las tareas que pertenecen al salón.
        const tareasDelSalon = await Tarea.find({ idgrupo: idgrupo }).lean();

        if (tareasDelSalon.length === 0) {
            return response.json({ success: true, tareas: [] });
        }

        const resultadoFinal = [];

        // PASO 2: Usar un bucle simple para procesar cada tarea secuencialmente.
        for (const tarea of tareasDelSalon) {
            

            // PASO 3: Por cada tarea, hacer una búsqueda simple de su entrega.
            const asignacion = await TareaEstudiante.findOne({
                idtarea: tarea._id,
                idestudiante: idestudiante
            }).lean();


            // PASO 4: Unir la tarea con su asignación (que será 'null' si no se encontró).
            tarea.miAsignacion = asignacion;
            resultadoFinal.push(tarea);
        }

        return response.status(200).json({
            success: true,
            tareas: resultadoFinal
        });

    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor."
        });
    }
};
// 1. Importamos TODOS los modelos que vamos a necesitar
const { Salon, Tarea, SalonEstudiante, TareaEstudiante } = require("../models/Models.js");

module.exports = async function NewTarea(request, response) {
    const { nombre, descripcion, doctarea } = request.body;
    const { id: idgrupo } = request.query; // Renombramos 'id' a 'idgrupo' para más claridad

    // Validación de campos de entrada
    if (!nombre || !descripcion || !doctarea) {
        return response.status(400).json({
            success: false,
            message: "Faltan campos requeridos: nombre, descripción o documento de la tarea."
        });
    }

    try {
        // Paso 1: Verificar que el salón (grupo) exista
        const salon = await Salon.findById(idgrupo);
        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "Este grupo no existe."
            });
        }

        // Paso 2: Crear la Tarea principal (la "plantilla" de la asignación)
        const nuevaTarea = new Tarea({
            idgrupo: salon._id,
            nombre: nombre,
            descripcion: descripcion,
            doctarea: doctarea
        });
        await nuevaTarea.save(); // Guardamos la tarea principal

        // Paso 3: Buscar a todos los estudiantes inscritos en ese salón
        const estudiantesDelSalon = await SalonEstudiante.find({ idgrupo: salon._id });

        // Si no hay estudiantes, terminamos aquí. La tarea está creada pero no asignada.
        if (estudiantesDelSalon.length === 0) {
            return response.status(201).json({
                success: true,
                message: "Tarea creada exitosamente, pero el salón no tiene estudiantes para asignarla."
            });
        }

        // Paso 4: Preparar las asignaciones individuales para cada estudiante
        const asignaciones = estudiantesDelSalon.map(estudianteEnSalon => ({
            idtarea: nuevaTarea._id, // El ID de la tarea que acabamos de crear
            idestudiante: estudianteEnSalon.idestudiante // El ID del estudiante
            // Los campos nota, docentrega, etc., quedan vacíos por defecto
        }));

        // Paso 5: Insertar todas las asignaciones en la base de datos de una sola vez (muy eficiente)
        await TareaEstudiante.insertMany(asignaciones);

        // ¡Éxito!
        return response.status(201).json({
            success: true,
            message: `Tarea creada y asignada a ${asignaciones.length} estudiante(s).`
        });

    } catch (error) {
        console.error("Error al crear y asignar la tarea:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor al procesar la solicitud."
        });
    }
};
// En tu controlador NewTarea.js
const { Salon, Tarea, SalonEstudiante, TareaEstudiante } = require("../models/Models.js");

module.exports = async function NewTarea(request, response) {
    // 1. OBTENEMOS EL NUEVO CAMPO DEL BODY
    const { nombre, descripcion, doctarea, fechavencimiento } = request.body;
    const { id: idgrupo } = request.query;

    // 2. AÑADIMOS LA VALIDACIÓN PARA EL NUEVO CAMPO
    if (!nombre || !descripcion || !doctarea || !fechavencimiento) {
        return response.status(400).json({
            success: false,
            message: "Faltan campos requeridos: nombre, descripción, documento o fecha de vencimiento."
        });
    }

    try {
        const salon = await Salon.findById(idgrupo);
        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "Este grupo no existe."
            });
        }

        const nuevaTarea = new Tarea({
            idgrupo: salon._id,
            nombre: nombre,
            descripcion: descripcion,
            doctarea: doctarea,
            fechavencimiento: fechavencimiento // 3. GUARDAMOS EL NUEVO CAMPO
        });
        await nuevaTarea.save();

        const estudiantesDelSalon = await SalonEstudiante.find({ idgrupo: salon._id });

        if (estudiantesDelSalon.length > 0) {
            const asignaciones = estudiantesDelSalon.map(estudianteEnSalon => ({
                idtarea: nuevaTarea._id,
                idestudiante: estudianteEnSalon.idestudiante
            }));
            await TareaEstudiante.insertMany(asignaciones);
        }

        return response.status(201).json({
            success: true,
            message: `Tarea creada y asignada a ${estudiantesDelSalon.length} estudiante(s).`
        });

    } catch (error) {
        console.error("Error al crear y asignar la tarea:", error);
        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor al procesar la solicitud."
        });
    }
};
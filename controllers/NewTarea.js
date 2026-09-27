const {
    Salon,
    Tarea,
    SalonEstudiante,
    TareaEstudiante
} = require("../models/Models.js");

module.exports = async function NewTarea(request, response) {
    const {
        tema,
        nombre,
        descripcion,
        doctarea,
        fechavencimiento
    } = request.body;

    const { id: idgrupo } = request.query;

    if (!idgrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
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

    try {
        const salon = await Salon.findById(idgrupo);

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "Este salón no existe."
            });
        }

        const nuevaTarea = new Tarea({
            idgrupo: salon._id,
            tema: temaNormalizado,
            nombre: nombreNormalizado,
            descripcion: descripcionNormalizada,
            doctarea: documentoNormalizado,
            fecha: new Date(),
            fechavencimiento: fechaVencimiento
        });

        await nuevaTarea.save();

        const estudiantesDelSalon = await SalonEstudiante.find({
            idgrupo: salon._id
        });

        if (estudiantesDelSalon.length > 0) {
            const asignaciones = estudiantesDelSalon.map(
                function (estudianteEnSalon) {
                    return {
                        idtarea: nuevaTarea._id,
                        idestudiante: estudianteEnSalon.idestudiante
                    };
                }
            );

            await TareaEstudiante.insertMany(asignaciones);
        }

        return response.status(201).json({
            success: true,
            message:
                `Tarea creada en el tema "${temaNormalizado}" y asignada a ` +
                `${estudiantesDelSalon.length} estudiante(s).`,
            tarea: nuevaTarea
        });
    } catch (error) {
        console.error(
            "Error al crear y asignar la tarea:",
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
            message:
                "Ocurrió un error en el servidor al procesar la solicitud."
        });
    }
};
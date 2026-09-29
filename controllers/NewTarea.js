const {
    Salon,
    Tarea,
    SalonEstudiante,
    TareaEstudiante
} = require("../models/Models.js");
const {
    guardarVariosArchivosGridFS,
    eliminarVariosArchivosGridFS
} = require("../Frontend/middleware/archivosTareas.js");

function textoLimpio(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

module.exports = async function NewTarea(request, response) {
    const {
        tema,
        nombre,
        descripcion,
        doctarea,
        fechavencimiento
    } = request.body;
    const { id: idgrupo } = request.query;

    const temaNormalizado = textoLimpio(tema);
    const nombreNormalizado = textoLimpio(nombre);
    const descripcionNormalizada = textoLimpio(descripcion);
    const documentoNormalizado = textoLimpio(doctarea);
    const archivosRecibidos = Array.isArray(request.files) ? request.files : [];

    if (!idgrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
        });
    }

    if (
        !temaNormalizado ||
        !nombreNormalizado ||
        !descripcionNormalizada ||
        !fechavencimiento
    ) {
        return response.status(400).json({
            success: false,
            message: "Faltan campos requeridos: tema, nombre, descripción o fecha de vencimiento."
        });
    }

    if (!documentoNormalizado && archivosRecibidos.length === 0) {
        return response.status(400).json({
            success: false,
            message: "Debes proporcionar un enlace de referencia, al menos un archivo o ambos."
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
            message: "La fecha de vencimiento debe ser posterior a la fecha y hora actuales."
        });
    }

    let nuevaTarea = null;
    let archivosGuardados = [];

    try {
        const salon = await Salon.findById(idgrupo);

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "Este salón no existe."
            });
        }

        // Primero creamos la tarea para disponer de un ID que quedará en los
        // metadatos de GridFS. Si la carga falla, la tarea se elimina.
        nuevaTarea = await Tarea.create({
            idgrupo: salon._id,
            tema: temaNormalizado,
            nombre: nombreNormalizado,
            descripcion: descripcionNormalizada,
            doctarea: documentoNormalizado || null,
            archivos: [],
            fecha: new Date(),
            fechavencimiento: fechaVencimiento
        });

        if (archivosRecibidos.length > 0) {
            archivosGuardados = await guardarVariosArchivosGridFS(
                archivosRecibidos,
                {
                    categoria: "material_tarea",
                    idTarea: nuevaTarea._id,
                    idSalon: salon._id,
                    idProfesor: salon.idprofe
                }
            );

            nuevaTarea.archivos = archivosGuardados;
            await nuevaTarea.save();
        }

        const estudiantesDelSalon = await SalonEstudiante.find({
            idgrupo: salon._id,
            status: { $ne: "Retirado" }
        }).select("idestudiante");

        if (estudiantesDelSalon.length > 0) {
            const asignaciones = estudiantesDelSalon.map(
                (estudianteEnSalon) => ({
                    idtarea: nuevaTarea._id,
                    idestudiante: estudianteEnSalon.idestudiante
                })
            );

            await TareaEstudiante.insertMany(asignaciones, {
                ordered: false
            });
        }

        return response.status(201).json({
            success: true,
            message:
                `Tarea creada en el tema "${temaNormalizado}" y asignada a ` +
                `${estudiantesDelSalon.length} estudiante(s).`,
            tarea: nuevaTarea
        });
    } catch (error) {
        console.error("Error al crear y asignar la tarea:", error);

        if (archivosGuardados.length > 0) {
            await eliminarVariosArchivosGridFS(
                archivosGuardados.map((archivo) => archivo.archivoId)
            );
        }

        if (nuevaTarea?._id) {
            await Promise.allSettled([
                TareaEstudiante.deleteMany({ idtarea: nuevaTarea._id }),
                Tarea.deleteOne({ _id: nuevaTarea._id })
            ]);
        }

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message: "El ID del salón no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor al procesar la solicitud."
        });
    }
};

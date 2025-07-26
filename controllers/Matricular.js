// controllers/Matricular.js
const { Salon, SalonEstudiante } = require("../models/Models.js");

module.exports = async function Matricular(request, response) {
    // Recibimos el nombre del salón y la clave desde el formulario
    const { nombre, clave } = request.body;
    const { idEstudiante } = request.query;

    if (!nombre || !clave || !idEstudiante) {
        return response.status(400).json({ success: false, message: "Faltan datos para la matrícula (nombre, clave o ID de estudiante)." });
    }

    try {
        // --- CAMBIO PRINCIPAL: Buscamos el salón por su NOMBRE ---
        const salon = await Salon.findOne({ nombre: nombre });

        if (!salon) {
            return response.status(404).json({ success: false, message: "El nombre del salón no existe." });
        }

        if (salon.clave !== clave) {
            return response.status(400).json({ success: false, message: "Clave incorrecta." });
        }

        if (salon.cupo <= 0) {
            return response.status(400).json({ success: false, message: "No hay cupo en este salón." });
        }

        const yaExiste = await SalonEstudiante.findOne({
            idgrupo: salon._id,
            idestudiante: idEstudiante
        });

        if (yaExiste) {
            return response.status(400).json({ success: false, message: "Ya estás matriculado en esta materia." });
        }

        const nuevaMatricula = await SalonEstudiante.create({
            idgrupo: salon._id,
            idestudiante: idEstudiante,
            status: "Matriculado",
            fecha: new Date(),
            notafinal: "0"
        });

        salon.cupo -= 1;
        await salon.save();

        return response.status(201).json({
            success: true,
            message: "¡Matrícula exitosa!",
            matricula: nuevaMatricula
        });

    } catch (error) {
        console.error("Error en el proceso de matrícula:", error);
        return response.status(500).json({ success: false, message: "Ocurrió un error en el servidor." });
    }
};
const { SalonEstudiante, Salon } = require("../models/Models.js");

module.exports = async function getSalonesEstudiante(request, response) {
    const { idestudiante } = request.query;

    if (!idestudiante) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del estudiante.",
        });
    }

    console.log(`\n--- Iniciando búsqueda para estudiante: ${idestudiante} ---`);

    try {
        // PASO 1: Buscar en SalonEstudiante todos los salones a los que pertenece el estudiante.
        const matriculas = await SalonEstudiante.find({ idestudiante: idestudiante }).lean();
        
        console.log("Paso 1: Matrículas encontradas:", matriculas);

        // Si no se encuentra ninguna matrícula, detenemos el proceso aquí.
        if (!matriculas || matriculas.length === 0) {
            console.log("--> Conclusión: No se encontraron matrículas. El proceso termina aquí.");
            return response.json({ success: true, salones: [] });
        }

        // PASO 2: Con el ID de grupo de esas matrículas...
        // Extraemos solo los IDs de los grupos en un nuevo arreglo.
        const idGrupos = matriculas.map(m => m.idgrupo);
        
        console.log("Paso 2: IDs de grupo extraídos:", idGrupos);

        // PASO 3: ...busque dentro de la tabla salonesEscuela la información de los salones específicos.
        const salones = await Salon.find({
            '_id': { $in: idGrupos }
        });

        console.log("Paso 3: Detalles de salones encontrados:", salones);
        console.log("--- Búsqueda finalizada. ---\n");

        // PASO 4: Devolver esa información.
        return response.status(200).json({
            success: true,
            salones: salones
        });

    } catch (error) {
        console.error("Error al obtener los salones del estudiante:", error);
        return response.status(500).json({
            success: false,
            message: "Error en el servidor."
        });
    }
};
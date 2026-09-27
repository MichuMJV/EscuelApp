const {
    Salon
} = require("../models/Models.js");

module.exports = async function ReturnAllSalons(
    request,
    response
) {
    try {
        const SalonData = await Salon.find()
            .sort({
                nombre: 1,
                materia: 1
            })
            .lean();

        return response.status(200).json({
            success: true,
            SalonData
        });
    } catch (error) {
        console.error(
            "Error al consultar los salones:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "No fue posible consultar los salones."
        });
    }
};
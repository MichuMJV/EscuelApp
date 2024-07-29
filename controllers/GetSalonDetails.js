const { Salon } = require("../models/Models.js");

module.exports = async function GetSalonDetails(request, response) {
    if (!request.query.id) {
        return response.json({ success: false, err: "No se envió el ID del salón" });
    }
    
    try {
        const salon = await Salon.findById(request.query.id);
        if (!salon) {
            return response.json({ success: false, message: "Salón no encontrado" });
        }
        return response.json(salon);
    } catch (error) {
        return response.json({ success: false, message: error.message });
    }
};

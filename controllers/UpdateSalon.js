const { Salon } = require("../models/Models.js");
const { Usuario } = require("../models/Models.js");

function validarContraseña(clave, clave2) {
    // Verificamos que los campos no estén vacíos
    if (clave === "" || clave2 === "") {
        return { success: false, message: "no puede dejar contraseñas vacías" };
    }
    
    // Verificamos que las contraseñas coincidan
    if (clave !== clave2) {
        return { success: false, message: "Las contraseñas no coinciden" };
    }

    // La contraseña es válida
    return { success: true };
}

const materiasAvaliables = ["Matematicas", "Español", "Ingles",
    "Ciencias", "Arte", "Educacion Fisica", "Musica", "Tecnologia",
    "Religion", "Filosofia", "Geografia", "Historia", "Quimica",
    "Fisica", "Biologia", "Economia", "Administracion", "Programacion",
    "Dibujo", "Literatura", "Comunicacion"];

function isValidMateria(materia) {
    return materiasAvaliables.includes(materia);
}

async function isThisProfesorExist(profesor) {
    let data = await Usuario.findById(profesor);
    return data.length !== 0;
}

module.exports = async function UpdateSalon(request, response) {
    let body = request.body;

    if (!validarContraseña(body.clave, body.clave2).success)
        return response.json({ success: false, message: validarContraseña(body.clave, body.clave2).message });

    if (!isValidMateria(body.materia))
        return response.json({ success: false, message: "La materia no es válida" });

    if (!await isThisProfesorExist(body.idprofesor))
        return response.json({ success: false, message: "El profesor no existe" });

    if (!body.salonId)
        return response.json({ success: false, message: "No se ha proporcionado el ID del salón" });

    try {
        let salon = await Salon.findById(body.salonId);
        if (!salon) {
            return response.json({ success: false, message: "El salón no existe" });
        }

        salon.idprofe = body.idprofesor;
        salon.grado = body.grado;
        salon.materia = body.materia;
        salon.clave = body.clave;
        salon.logo = body.logo;
        salon.cupo = body.cupo;

        await salon.save();
        return response.json({ success: true, message: "Salón actualizado" });
    } catch (error) {
        return response.json({ success: false, message: error.message });
    }
}

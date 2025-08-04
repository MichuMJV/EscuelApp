const { Usuario } = require("../models/Models.js");
const bcrypt = require("bcrypt");

module.exports = async function register(request, response) {
    const { rol, nombre, cedula, contrasena } = request.body;

    // 1. Validación de campos al inicio para ser más eficiente.
    if (!rol || !nombre || !cedula || !contrasena) {
        return response.status(400).json({ success: false, message: "No debe dejar vacío ningún campo." });
    }

    try {
        // 2. Se mantiene tu lógica para buscar si la cédula ya existe.
        const usuarioExistente = await Usuario.findOne({ cedula: cedula });

        if (usuarioExistente) {
            return response.status(400).json({ success: false, message: "Este usuario ya existe." });
        }

        // 3. (EL CAMBIO MÁS IMPORTANTE) Se encripta la contraseña antes de guardarla.
        const salt = await bcrypt.genSalt(10);
        const contrasenaHasheada = await bcrypt.hash(contrasena, salt);

        // 4. Se crea el nuevo usuario con la contraseña ya encriptada (hasheada).
        const nuevoUsuario = new Usuario({
            rol: rol,
            nombre: nombre,
            cedula: cedula,
            contrasena: contrasenaHasheada // Se guarda el hash, no la contraseña original.
        });

        await nuevoUsuario.save();

        // 5. Se envía una respuesta segura sin devolver información sensible.
        return response.status(201).json({ 
            success: true, 
            message: "Usuario registrado exitosamente." 
        });

    } catch (error) {
        console.error("Error en el registro:", error);
        return response.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};
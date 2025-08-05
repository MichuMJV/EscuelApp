const { Usuario } = require("../models/Models.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async function startSesion(request, response) {
    const { cedula, contrasena } = request.body;

    if (!cedula || !contrasena) {
        return response.status(400).json({ success: false, message: "Se requiere cédula y contraseña." });
    }

    try {
        // 1. BUSCAR AL USUARIO POR CÉDULA (es un identificador único, mejor que el nombre)
        const user = await Usuario.findOne({ cedula: cedula });

        // 2. USAR UN MENSAJE DE ERROR GENÉRICO para no revelar si el usuario existe o no
        if (!user) {
            return response.status(401).json({ success: false, message: "Credenciales inválidas." });
        }

        // 3. COMPARAR LA CONTRASEÑA USANDO BCRYPT
        // bcrypt.compare toma la contraseña que envía el usuario y la compara de forma segura con el hash guardado en la DB.
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);

        if (!isMatch) {
            return response.status(401).json({ success: false, message: "Credenciales inválidas." });
        }

        // 4. SI TODO ES CORRECTO, CREAR UN JSON WEB TOKEN (JWT)
        // El token contiene información no sensible (ID y rol) y está firmado digitalmente.
        const payload = {
            _id: user._id,
            rol: user.rol,
            nombre: user.nombre
        };

        // 'process.env.JWT_SECRET' debería ser una clave secreta guardada en un archivo .env
        // Por ahora, usaremos un texto de ejemplo. ¡Cámbialo en producción!
        const secretKey = "ESTA_ES_UNA_CLAVE_SECRETA_DE_EJEMPLO_CAMBIALA";
        const token = jwt.sign(payload, secretKey, { expiresIn: '8h' }); // El token expira en 8 horas

        // 5. ENVIAR SOLO EL TOKEN Y LA RUTA DE REDIRECCIÓN (NUNCA LA CONTRASEÑA)
        let redirectUrl = "";
        if (user.rol === 1) redirectUrl = "screens/homeAdmin.html";
        if (user.rol === 2) redirectUrl = "screens/homeProfesor.html";
        if (user.rol === 3) redirectUrl = "screens/homeEstudiante.html";
        
        return response.json({
            success: true,
            message: "Inicio de sesión exitoso.",
            token: token,
            redirect: redirectUrl
        });

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        return response.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};
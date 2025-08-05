const { Usuario } = require("../models/Models.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async function startSesion(request, response) {
    const { cedula, contrasena } = request.body;

    if (!cedula || !contrasena) {
        return response.status(400).json({ success: false, message: "Se requiere cédula y contraseña." });
    }

    try {
        // 1. Buscar al usuario por cédula
        const user = await Usuario.findOne({ cedula: cedula });

        // 2. Usar un mensaje de error genérico
        if (!user) {
            return response.status(401).json({ success: false, message: "Credenciales inválidas." });
        }

        // 3. Comparar la contraseña de forma segura usando bcrypt
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);

        if (!isMatch) {
            return response.status(401).json({ success: false, message: "Credenciales inválidas." });
        }

        // 4. Crear el payload para el token JWT
        const payload = {
            _id: user._id,
            rol: user.rol,
            nombre: user.nombre
        };

        // --- CAMBIO CLAVE: Leemos la clave secreta desde el entorno ---
        const secretKey = process.env.JWT_SECRET;

        // Verificación de seguridad: nos aseguramos de que la clave exista en .env
        if (!secretKey) {
            console.error("Error crítico: La clave secreta JWT_SECRET no está definida en el archivo .env");
            return response.status(500).json({ success: false, message: "Error de configuración del servidor." });
        }

        // 5. Firmar y crear el token
        const token = jwt.sign(payload, secretKey, { expiresIn: '8h' });

        // 6. Enviar el token y la ruta de redirección
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
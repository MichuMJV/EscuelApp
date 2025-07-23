const { Usuario } = require("../models/Models.js");

module.exports = async function NewSesion(request, response) {
    let body = request.body;
    try {
        // Busca al usuario en la base de datos
        request.user = await Usuario.find({ nombre: body.nombre });

        // Comprueba si el usuario existe
        if (request.user === null || request.user === undefined || request.user.length === 0) {
            return response.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        // Comprueba si la contraseña es correcta
        if (request.user[0].contrasena != body.contrasena) {
            return response.status(401).json({ success: false, message: "Contraseña incorrecta" });
        }

        // Redirige según el rol del usuario
        // --- CORRECCIÓN: Se ha eliminado "Frontend/" de las rutas de redirección ---
        if (request.user[0].rol === 1) {
            return response.json({ success: true, rol: "admin", redirect: "screens/homeAdmin.html", User: request.user });
        }

        if (request.user[0].rol === 2) {
            return response.json({ success: true, rol: "profesor", redirect: "screens/homeProfesor.html", User: request.user });
        }

        if (request.user[0].rol === 3) {
            return response.json({ success: true, rol: "alumno", redirect: "screens/homeEstudiante.html", User: request.user });
        }

        // Si el usuario no tiene un rol válido
        return response.status(403).json({ success: false, message: "Rol de usuario no válido" });

    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        // Devuelve un error genérico del servidor
        return response.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};
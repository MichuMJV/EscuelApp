const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    Usuario
} = require("../models/Models.js");

module.exports = async function startSesion(request, response) {
    const {
        cedula,
        contrasena
    } = request.body;

    const cedulaNormalizada = normalizarCedula(cedula);

    const contrasenaIngresada =
        typeof contrasena === "string"
            ? contrasena
            : "";

    if (!cedulaNormalizada || !contrasenaIngresada) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere la cédula y la contraseña."
        });
    }

    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
        console.error(
            "Error crítico: JWT_SECRET no está definido en el archivo .env."
        );

        return response.status(500).json({
            success: false,
            message:
                "Existe un error en la configuración del servidor."
        });
    }

    try {
        const usuario = await Usuario.findOne({
            cedula: cedulaNormalizada
        });

        if (!usuario) {
            return response.status(401).json({
                success: false,
                message: "Credenciales inválidas."
            });
        }

        const contrasenaCoincide = await bcrypt.compare(
            contrasenaIngresada,
            usuario.contrasena
        );

        if (!contrasenaCoincide) {
            return response.status(401).json({
                success: false,
                message: "Credenciales inválidas."
            });
        }

        const debeCambiarContrasena =
            usuario.debeCambiarContrasena === true;

        const payload = {
            _id: usuario._id,
            rol: usuario.rol,
            nombre: usuario.nombre,
            cedula: usuario.cedula,
            debeCambiarContrasena
        };

        const token = jwt.sign(
            payload,
            secretKey,
            {
                expiresIn: "8h"
            }
        );

        let redirectUrl;

        if (debeCambiarContrasena) {
            redirectUrl =
                "screens/Cambiar_contrasena.html";
        } else {
            redirectUrl = obtenerRutaSegunRol(
                usuario.rol
            );
        }

        if (!redirectUrl) {
            return response.status(403).json({
                success: false,
                message:
                    "El usuario no tiene un rol válido para ingresar al sistema."
            });
        }

        return response.status(200).json({
            success: true,
            message: debeCambiarContrasena
                ? "Debes establecer una nueva contraseña antes de continuar."
                : "Inicio de sesión exitoso.",
            token,
            redirect: redirectUrl,
            debeCambiarContrasena,
            usuario: {
                _id: usuario._id,
                rol: usuario.rol,
                nombre: usuario.nombre,
                cedula: usuario.cedula,
                debeCambiarContrasena
            }
        });
    } catch (error) {
        console.error(
            "Error en el inicio de sesión:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error interno durante el inicio de sesión."
        });
    }
};

function obtenerRutaSegunRol(rol) {
    switch (Number(rol)) {
        case 1:
            return "screens/homeAdmin.html";

        case 2:
            return "screens/homeProfesor.html";

        case 3:
            return "screens/homeEstudiante.html";

        default:
            return null;
    }
}

function normalizarCedula(valor) {
    if (
        typeof valor !== "string" &&
        typeof valor !== "number"
    ) {
        return "";
    }

    return String(valor)
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}
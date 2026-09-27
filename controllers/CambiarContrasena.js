const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    Usuario
} = require("../models/Models.js");

module.exports = async function CambiarContrasena(
    request,
    response
) {
    const {
        contrasenaActual,
        nuevaContrasena,
        confirmarContrasena
    } = request.body;

    if (
        !contrasenaActual ||
        !nuevaContrasena ||
        !confirmarContrasena
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Debes completar todos los campos."
        });
    }

    if (
        typeof contrasenaActual !== "string" ||
        typeof nuevaContrasena !== "string" ||
        typeof confirmarContrasena !== "string"
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Los datos de la contraseña no son válidos."
        });
    }

    if (
        nuevaContrasena !== confirmarContrasena
    ) {
        return response.status(400).json({
            success: false,
            message:
                "La nueva contraseña y su confirmación no coinciden."
        });
    }

    if (nuevaContrasena.length < 8) {
        return response.status(400).json({
            success: false,
            message:
                "La nueva contraseña debe tener al menos 8 caracteres."
        });
    }

    if (nuevaContrasena.length > 128) {
        return response.status(400).json({
            success: false,
            message:
                "La nueva contraseña no puede exceder los 128 caracteres."
        });
    }

    if (
        !/[a-z]/.test(nuevaContrasena) ||
        !/[A-Z]/.test(nuevaContrasena) ||
        !/[0-9]/.test(nuevaContrasena)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "La nueva contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un número."
        });
    }

    const token = obtenerToken(request);

    if (!token) {
        return response.status(401).json({
            success: false,
            message:
                "No se encontró una sesión válida. Inicia sesión nuevamente."
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
        const sesion = jwt.verify(
            token,
            secretKey
        );

        if (!sesion || !sesion._id) {
            return response.status(401).json({
                success: false,
                message:
                    "La sesión no contiene un usuario válido."
            });
        }

        const usuario = await Usuario.findById(
            sesion._id
        );

        if (!usuario) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario de la sesión no fue encontrado."
            });
        }

        const contrasenaActualCorrecta =
            await bcrypt.compare(
                contrasenaActual,
                usuario.contrasena
            );

        if (!contrasenaActualCorrecta) {
            return response.status(401).json({
                success: false,
                message:
                    "La contraseña temporal actual es incorrecta."
            });
        }

        const nuevaEsIgualALaActual =
            await bcrypt.compare(
                nuevaContrasena,
                usuario.contrasena
            );

        if (nuevaEsIgualALaActual) {
            return response.status(400).json({
                success: false,
                message:
                    "La nueva contraseña debe ser diferente de la contraseña temporal."
            });
        }

        const nuevaContrasenaHasheada =
            await bcrypt.hash(
                nuevaContrasena,
                10
            );

        usuario.contrasena =
            nuevaContrasenaHasheada;

        usuario.debeCambiarContrasena = false;
        usuario.fechaCambioContrasena =
            new Date();

        await usuario.save();

        const nuevoPayload = {
            _id: usuario._id,
            rol: usuario.rol,
            nombre: usuario.nombre,
            cedula: usuario.cedula,
            debeCambiarContrasena: false
        };

        const nuevoToken = jwt.sign(
            nuevoPayload,
            secretKey,
            {
                expiresIn: "8h"
            }
        );

        const redirectUrl =
            obtenerRutaSegunRol(usuario.rol);

        if (!redirectUrl) {
            return response.status(403).json({
                success: false,
                message:
                    "El usuario no tiene un rol válido para continuar."
            });
        }

        return response.status(200).json({
            success: true,
            message:
                "La contraseña fue actualizada correctamente.",
            token: nuevoToken,
            redirect: redirectUrl,
            usuario: {
                _id: usuario._id,
                rol: usuario.rol,
                nombre: usuario.nombre,
                cedula: usuario.cedula,
                debeCambiarContrasena: false
            }
        });
    } catch (error) {
        console.error(
            "Error al cambiar la contraseña:",
            error
        );

        if (
            error.name === "TokenExpiredError"
        ) {
            return response.status(401).json({
                success: false,
                message:
                    "La sesión expiró. Inicia sesión nuevamente."
            });
        }

        if (
            error.name === "JsonWebTokenError"
        ) {
            return response.status(401).json({
                success: false,
                message:
                    "La sesión no es válida. Inicia sesión nuevamente."
            });
        }

        if (
            error.name === "CastError"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "El identificador del usuario no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error interno al cambiar la contraseña."
        });
    }
};

function obtenerToken(request) {
    const encabezadoAutorizacion =
        request.headers.authorization;

    if (
        encabezadoAutorizacion &&
        encabezadoAutorizacion.startsWith(
            "Bearer "
        )
    ) {
        return encabezadoAutorizacion
            .slice(7)
            .trim();
    }

    if (
        request.body &&
        typeof request.body.token === "string"
    ) {
        return request.body.token.trim();
    }

    return null;
}

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
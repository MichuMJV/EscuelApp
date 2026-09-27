const bcrypt = require("bcrypt");

const {
    Usuario
} = require("../models/Models.js");

module.exports = async function register(request, response) {
    const {
        rol,
        nombre,
        cedula,
        contrasena
    } = request.body;

    const rolNormalizado = Number(rol);
    const nombreNormalizado = normalizarTexto(nombre);
    const cedulaNormalizada = normalizarCedula(cedula);

    const contrasenaNormalizada =
        typeof contrasena === "string"
            ? contrasena.trim()
            : "";

    if (
        !rolNormalizado ||
        !nombreNormalizado ||
        !cedulaNormalizada ||
        !contrasenaNormalizada
    ) {
        return response.status(400).json({
            success: false,
            message:
                "No debe dejar vacío ningún campo."
        });
    }

    if (
        !Number.isInteger(rolNormalizado) ||
        ![1, 2, 3].includes(rolNormalizado)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El rol proporcionado no es válido."
        });
    }

    if (nombreNormalizado.length < 2) {
        return response.status(400).json({
            success: false,
            message:
                "El nombre debe tener al menos 2 caracteres."
        });
    }

    if (nombreNormalizado.length > 120) {
        return response.status(400).json({
            success: false,
            message:
                "El nombre no puede exceder los 120 caracteres."
        });
    }

    if (cedulaNormalizada.length < 3) {
        return response.status(400).json({
            success: false,
            message:
                "La cédula proporcionada no es válida."
        });
    }

    if (cedulaNormalizada.length > 40) {
        return response.status(400).json({
            success: false,
            message:
                "La cédula no puede exceder los 40 caracteres."
        });
    }

    if (contrasenaNormalizada.length < 8) {
        return response.status(400).json({
            success: false,
            message:
                "La contraseña debe tener al menos 8 caracteres."
        });
    }

    if (contrasenaNormalizada.length > 128) {
        return response.status(400).json({
            success: false,
            message:
                "La contraseña no puede exceder los 128 caracteres."
        });
    }

    try {
        const usuarioExistente = await Usuario.findOne({
            cedula: cedulaNormalizada
        })
            .select("_id cedula")
            .lean();

        if (usuarioExistente) {
            return response.status(409).json({
                success: false,
                message:
                    "Ya existe un usuario registrado con esta cédula."
            });
        }

        const contrasenaHasheada = await bcrypt.hash(
            contrasenaNormalizada,
            10
        );

        const nuevoUsuario = await Usuario.create({
            rol: rolNormalizado,
            nombre: nombreNormalizado,
            cedula: cedulaNormalizada,
            contrasena: contrasenaHasheada,
            debeCambiarContrasena: false,
            fechaCambioContrasena: null,
            fechaCreacion: new Date()
        });

        return response.status(201).json({
            success: true,
            message:
                "Usuario registrado exitosamente.",

            usuario: {
                _id: nuevoUsuario._id,
                rol: nuevoUsuario.rol,
                nombre: nuevoUsuario.nombre,
                cedula: nuevoUsuario.cedula,
                debeCambiarContrasena:
                    nuevoUsuario.debeCambiarContrasena
            }
        });
    } catch (error) {
        console.error(
            "Error en el registro del usuario:",
            error
        );

        if (
            error &&
            error.code === 11000
        ) {
            return response.status(409).json({
                success: false,
                message:
                    "Ya existe un usuario registrado con esta cédula."
            });
        }

        if (
            error &&
            error.name === "ValidationError"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Los datos proporcionados para el usuario no son válidos."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error interno al registrar el usuario."
        });
    }
};

function normalizarTexto(valor) {
    if (typeof valor !== "string") {
        return "";
    }

    return valor
        .trim()
        .replace(/\s+/g, " ");
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
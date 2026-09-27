const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const {
    Usuario
} = require("../models/Models.js");

module.exports = async function UpdateUsers(
    request,
    response
) {
    const {
        id,
        fieldName,
        value
    } = request.body;

    if (!id || !fieldName) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del usuario y el campo que se desea actualizar."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del usuario no es válido."
        });
    }

    const camposPermitidos = [
        "nombre",
        "cedula",
        "contrasena"
    ];

    if (!camposPermitidos.includes(fieldName)) {
        return response.status(400).json({
            success: false,
            message:
                "El campo que intentas actualizar no está permitido."
        });
    }

    try {
        const usuario = await Usuario.findById(id);

        if (!usuario) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario no fue encontrado."
            });
        }

        if (fieldName === "nombre") {
            const nombreNormalizado =
                normalizarTexto(value);

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

            usuario.nombre = nombreNormalizado;
        }

        if (fieldName === "cedula") {
            const cedulaNormalizada =
                normalizarCedula(value);

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

            const usuarioConCedula =
                await Usuario.findOne({
                    cedula: cedulaNormalizada,
                    _id: {
                        $ne: usuario._id
                    }
                })
                    .select("_id")
                    .lean();

            if (usuarioConCedula) {
                return response.status(409).json({
                    success: false,
                    message:
                        "Ya existe otro usuario registrado con esta cédula."
                });
            }

            usuario.cedula = cedulaNormalizada;
        }

        if (fieldName === "contrasena") {
            const nuevaContrasena =
                typeof value === "string"
                    ? value
                    : "";

            if (nuevaContrasena.length < 8) {
                return response.status(400).json({
                    success: false,
                    message:
                        "La contraseña debe tener al menos 8 caracteres."
                });
            }

            if (nuevaContrasena.length > 128) {
                return response.status(400).json({
                    success: false,
                    message:
                        "La contraseña no puede exceder los 128 caracteres."
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
                        "La contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un número."
                });
            }

            const contrasenaHasheada =
                await bcrypt.hash(
                    nuevaContrasena,
                    10
                );

            usuario.contrasena =
                contrasenaHasheada;

            usuario.debeCambiarContrasena = false;

            usuario.fechaCambioContrasena =
                new Date();
        }

        const usuarioActualizado =
            await usuario.save();

        return response.status(200).json({
            success: true,
            message:
                "El usuario fue actualizado correctamente.",

            usuario: {
                _id: usuarioActualizado._id,
                rol: usuarioActualizado.rol,
                nombre:
                    usuarioActualizado.nombre,
                cedula:
                    usuarioActualizado.cedula,
                debeCambiarContrasena:
                    usuarioActualizado
                        .debeCambiarContrasena,
                fechaCambioContrasena:
                    usuarioActualizado
                        .fechaCambioContrasena
            }
        });
    } catch (error) {
        console.error(
            "Error al actualizar el usuario:",
            error
        );

        if (error.code === 11000) {
            return response.status(409).json({
                success: false,
                message:
                    "Ya existe otro usuario registrado con esta cédula."
            });
        }

        if (error.name === "ValidationError") {
            return response.status(400).json({
                success: false,
                message:
                    "Los datos proporcionados no son válidos."
            });
        }

        if (error.name === "CastError") {
            return response.status(400).json({
                success: false,
                message:
                    "El identificador del usuario no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error interno al actualizar el usuario."
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
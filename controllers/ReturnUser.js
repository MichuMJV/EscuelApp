const { Usuario } = require("../models/Models.js");

module.exports = async function retornoUsers(request, response) {
    const {
        rol,
        buscar
    } = request.query;

    const filtro = {};

    if (
        rol !== undefined &&
        rol !== null &&
        String(rol).trim() !== ""
    ) {
        const numeroRol = Number(rol);

        if (
            !Number.isInteger(numeroRol) ||
            ![1, 2, 3].includes(numeroRol)
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "El rol proporcionado no es válido."
            });
        }

        filtro.rol = numeroRol;
    }

    if (
        typeof buscar === "string" &&
        buscar.trim() !== ""
    ) {
        const textoBusqueda = escaparExpresionRegular(
            buscar.trim()
        );

        filtro.$or = [
            {
                nombre: {
                    $regex: textoBusqueda,
                    $options: "i"
                }
            },
            {
                cedula: {
                    $regex: textoBusqueda,
                    $options: "i"
                }
            }
        ];
    }

    try {
        const usuarios = await Usuario.find(filtro)
            .select("_id nombre cedula rol")
            .sort({
                nombre: 1
            })
            .lean();

        const data = usuarios.map(function (usuario) {
            return {
                _id: usuario._id,
                nombre:
                    usuario.nombre ||
                    "Usuario sin nombre",
                cedula:
                    usuario.cedula ||
                    "Sin cédula",
                rol: usuario.rol
            };
        });

        return response.status(200).json(data);
    } catch (error) {
        console.error(
            "Error al consultar los usuarios:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "Hubo problemas al consultar los usuarios."
        });
    }
};

function escaparExpresionRegular(valor) {
    return valor.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}
const mongoose = require("mongoose");

const {
    Tarea,
    Salon,
    SalonEstudiante,
    Usuario
} = require("../models/Models.js");

const {
    obtenerBucket,
    buscarArchivoGridFS
} = require("../Frontend/middleware/archivosTareas.js");


function idsIguales(primerId, segundoId) {
    return Boolean(
        primerId &&
        segundoId &&
        String(primerId) === String(segundoId)
    );
}


async function usuarioPuedeDescargar(
    usuario,
    archivo
) {
    const metadata = archivo.metadata || {};
    const rolUsuario = Number(usuario.rol);

    /*
     * Rol 1: administrador.
     */
    if (rolUsuario === 1) {
        return true;
    }

    /*
     * Material publicado por el profesor.
     */
    if (metadata.categoria === "material_tarea") {
        if (
            !metadata.idTarea ||
            !metadata.idSalon
        ) {
            return false;
        }

        const tarea = await Tarea
            .findById(metadata.idTarea)
            .select("_id idgrupo")
            .lean();

        if (!tarea) {
            return false;
        }

        if (
            !idsIguales(
                tarea.idgrupo,
                metadata.idSalon
            )
        ) {
            return false;
        }

        const salon = await Salon
            .findById(metadata.idSalon)
            .select("_id idprofe")
            .lean();

        if (!salon) {
            return false;
        }

        /*
         * Rol 2: profesor.
         * Solo puede descargar archivos de sus salones.
         */
        if (rolUsuario === 2) {
            return idsIguales(
                salon.idprofe,
                usuario._id
            );
        }

        /*
         * Rol 3: estudiante.
         * Solo puede descargar archivos de salones donde
         * tenga una matrícula activa.
         */
        if (rolUsuario === 3) {
            const matriculaActiva =
                await SalonEstudiante.exists({
                    idgrupo: salon._id,
                    idestudiante: usuario._id,
                    status: {
                        $ne: "Retirado"
                    }
                });

            return Boolean(matriculaActiva);
        }

        return false;
    }

    /*
     * Archivo entregado por un estudiante.
     */
    if (
        metadata.categoria ===
        "entrega_estudiante"
    ) {
        /*
         * El estudiante solamente puede descargar
         * su propia entrega.
         */
        if (rolUsuario === 3) {
            return idsIguales(
                metadata.idEstudiante,
                usuario._id
            );
        }

        /*
         * El profesor solamente puede descargar
         * entregas pertenecientes a sus salones.
         */
        if (
            rolUsuario === 2 &&
            metadata.idTarea
        ) {
            const tarea = await Tarea
                .findById(metadata.idTarea)
                .select("_id idgrupo")
                .lean();

            if (!tarea) {
                return false;
            }

            const salon = await Salon
                .findById(tarea.idgrupo)
                .select("_id idprofe")
                .lean();

            return Boolean(
                salon &&
                idsIguales(
                    salon.idprofe,
                    usuario._id
                )
            );
        }

        return false;
    }

    /*
     * Se rechazan archivos sin una categoría reconocida.
     */
    return false;
}


function normalizarNombreDescarga(
    nombreArchivo
) {
    return String(
        nombreArchivo || "archivo"
    )
        .replace(/[\r\n"]/g, "_")
        .trim() || "archivo";
}


module.exports = async function DescargarArchivo(
    request,
    response
) {
    const idArchivo =
        request.params.idarchivo ||
        request.query.idarchivo;

    const idUsuario =
        request.query.idusuario;

    if (
        !idArchivo ||
        !idUsuario
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Se requieren el ID del archivo y el ID del usuario."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            idArchivo
        ) ||
        !mongoose.Types.ObjectId.isValid(
            idUsuario
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del archivo o del usuario no es válido."
        });
    }

    try {
        const [
            usuario,
            archivo
        ] = await Promise.all([
            Usuario
                .findById(idUsuario)
                .select("_id rol")
                .lean(),

            buscarArchivoGridFS(
                idArchivo
            )
        ]);

        if (!usuario) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario no fue encontrado."
            });
        }

        if (!archivo) {
            return response.status(404).json({
                success: false,
                message:
                    "El archivo no fue encontrado."
            });
        }

        const tienePermiso =
            await usuarioPuedeDescargar(
                usuario,
                archivo
            );

        if (!tienePermiso) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para descargar este archivo."
            });
        }

        const nombreOriginal =
            normalizarNombreDescarga(
                archivo.metadata
                    ?.nombreOriginal ||
                archivo.filename
            );

        const tipoContenido =
            archivo.contentType ||
            archivo.metadata
                ?.tipoContenido ||
            "application/octet-stream";

        response.setHeader(
            "Content-Type",
            tipoContenido
        );

        if (
            Number.isFinite(
                Number(archivo.length)
            )
        ) {
            response.setHeader(
                "Content-Length",
                archivo.length
            );
        }

        response.setHeader(
            "Content-Disposition",
            `attachment; filename="${nombreOriginal}"; ` +
            `filename*=UTF-8''${encodeURIComponent(
                nombreOriginal
            )}`
        );

        response.setHeader(
            "X-Content-Type-Options",
            "nosniff"
        );

        response.setHeader(
            "Cache-Control",
            "private, no-store"
        );

        const streamDescarga =
            obtenerBucket()
                .openDownloadStream(
                    archivo._id
                );

        streamDescarga.on(
            "error",
            function (error) {
                console.error(
                    "Error al transmitir el archivo:",
                    error
                );

                if (!response.headersSent) {
                    return response
                        .status(500)
                        .json({
                            success: false,
                            message:
                                "No fue posible descargar el archivo."
                        });
                }

                response.destroy(error);
            }
        );

        streamDescarga.pipe(response);
    } catch (error) {
        console.error(
            "Error al descargar el archivo:",
            error
        );

        if (response.headersSent) {
            return response.destroy(error);
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al descargar el archivo."
        });
    }
};
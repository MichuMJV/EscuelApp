const mongoose = require("mongoose");

const {
    Tarea,
    TareaEstudiante,
    Salon,
    Usuario
} = require("../models/Models.js");

const {
    obtenerIdsArchivos,
    eliminarVariosArchivosGridFS
} = require("../Frontend/middleware/archivosTareas.js");


function idsIguales(
    primerId,
    segundoId
) {
    return Boolean(
        primerId &&
        segundoId &&
        String(primerId) ===
            String(segundoId)
    );
}


function obtenerIdTarea(request) {
    return (
        request.params.id ||
        request.query.id ||
        request.body?.id ||
        request.body?.idTarea ||
        null
    );
}


function obtenerIdUsuario(request) {
    return (
        request.query.idUsuario ||
        request.query.idusuario ||
        request.body?.idUsuario ||
        request.body?.idusuario ||
        null
    );
}


module.exports = async function DeleteTarea(
    request,
    response
) {
    const idTarea =
        obtenerIdTarea(request);

    const idUsuario =
        obtenerIdUsuario(request);

    if (
        !idTarea ||
        !idUsuario
    ) {
        return response.status(400).json({
            success: false,
            message:
                "Se requieren el ID de la tarea y el ID del usuario."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            idTarea
        ) ||
        !mongoose.Types.ObjectId.isValid(
            idUsuario
        )
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID de la tarea o del usuario no es válido."
        });
    }

    try {
        const [
            tarea,
            usuario
        ] = await Promise.all([
            Tarea.findById(idTarea),

            Usuario
                .findById(idUsuario)
                .select("_id rol nombre")
                .lean()
        ]);

        if (!tarea) {
            return response.status(404).json({
                success: false,
                message:
                    "La tarea no fue encontrada."
            });
        }

        if (!usuario) {
            return response.status(404).json({
                success: false,
                message:
                    "El usuario no fue encontrado."
            });
        }

        const salon = await Salon
            .findById(tarea.idgrupo)
            .select(
                "_id idprofe nombre materia"
            )
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón relacionado con la tarea no fue encontrado."
            });
        }

        const rolUsuario =
            Number(usuario.rol);

        const esAdministrador =
            rolUsuario === 1;

        const esProfesorPropietario =
            rolUsuario === 2 &&
            idsIguales(
                salon.idprofe,
                usuario._id
            );

        if (
            !esAdministrador &&
            !esProfesorPropietario
        ) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para eliminar esta tarea."
            });
        }

        /*
         * Consultamos todas las entregas antes de eliminarlas
         * para localizar los archivos almacenados en GridFS.
         */
        const entregas =
            await TareaEstudiante
                .find({
                    idtarea: tarea._id
                })
                .select(
                    "_id archivoEntrega archivos"
                )
                .lean();

        const idsArchivosTarea =
            obtenerIdsArchivos(tarea);

        const idsArchivosEntregas =
            entregas.flatMap(
                function (entrega) {
                    return obtenerIdsArchivos(
                        entrega
                    );
                }
            );

        const idsArchivosTotales = [
            ...idsArchivosTarea,
            ...idsArchivosEntregas
        ];

        /*
         * Eliminamos primero las entregas y después la tarea.
         *
         * Esta secuencia evita que permanezcan asignaciones
         * visibles relacionadas con una tarea inexistente.
         */
        const resultadoEntregas =
            await TareaEstudiante.deleteMany({
                idtarea: tarea._id
            });

        const resultadoTarea =
            await Tarea.deleteOne({
                _id: tarea._id
            });

        if (
            !resultadoTarea ||
            resultadoTarea.deletedCount !== 1
        ) {
            return response.status(500).json({
                success: false,
                message:
                    "No fue posible eliminar la tarea."
            });
        }

        /*
         * La eliminación de GridFS se realiza después de
         * retirar las referencias de negocio.
         *
         * eliminarVariosArchivosGridFS utiliza Promise.allSettled,
         * por lo que un archivo faltante no impide procesar
         * los demás.
         */
        const resultadosArchivos =
            await eliminarVariosArchivosGridFS(
                idsArchivosTotales
            );

        const archivosEliminados =
            resultadosArchivos.filter(
                function (resultado) {
                    return (
                        resultado.status ===
                        "fulfilled"
                    );
                }
            ).length;

        const archivosConError =
            resultadosArchivos.filter(
                function (resultado) {
                    return (
                        resultado.status ===
                        "rejected"
                    );
                }
            ).length;

        if (archivosConError > 0) {
            console.warn(
                "La tarea fue eliminada, pero algunos archivos " +
                "de GridFS no pudieron eliminarse.",
                {
                    idTarea:
                        String(tarea._id),
                    archivosConError
                }
            );
        }

        return response.status(200).json({
            success: true,
            message:
                archivosConError > 0
                    ? (
                        "La tarea y sus entregas fueron eliminadas. " +
                        "Algunos archivos necesitarán limpieza posterior."
                    )
                    : (
                        "La tarea, sus entregas y sus archivos " +
                        "fueron eliminados correctamente."
                    ),
            data: {
                idTarea:
                    String(tarea._id),

                nombreTarea:
                    tarea.nombre,

                idSalon:
                    String(salon._id),

                entregasEliminadas:
                    resultadoEntregas
                        ?.deletedCount ||
                    entregas.length,

                archivosEncontrados:
                    idsArchivosTotales.length,

                archivosEliminados,

                archivosConError
            }
        });
    } catch (error) {
        console.error(
            "Error al eliminar la tarea:",
            error
        );

        if (
            error.name === "CastError"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Uno de los identificadores proporcionados no es válido."
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al eliminar la tarea."
        });
    }
};
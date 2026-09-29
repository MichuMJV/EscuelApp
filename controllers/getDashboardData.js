const mongoose = require("mongoose");

const {
    Salon,
    SalonEstudiante,
    Usuario,
    Tarea,
    TareaEstudiante
} = require("../models/Models.js");

module.exports = async function getDashboardData(request, response) {
    const { idgrupo, idusuario } = request.query;

    if (!idgrupo || !idusuario) {
        return response.status(400).json({
            success: false,
            message: "Se requieren el ID del salón y el ID del usuario."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idgrupo) ||
        !mongoose.Types.ObjectId.isValid(idusuario)
    ) {
        return response.status(400).json({
            success: false,
            message: "El ID del salón o del usuario no es válido."
        });
    }

    try {
        const [salon, usuarioSolicitante] = await Promise.all([
            Salon.findById(idgrupo)
                .select("_id nombre materia grado clave cupo idprofe")
                .lean(),
            Usuario.findById(idusuario)
                .select("_id rol")
                .lean()
        ]);

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "El salón especificado no fue encontrado."
            });
        }

        if (!usuarioSolicitante) {
            return response.status(404).json({
                success: false,
                message: "El usuario no fue encontrado."
            });
        }

        const rol = Number(usuarioSolicitante.rol);
        const esAdministrador = rol === 1;
        const esProfesorPropietario =
            rol === 2 &&
            salon.idprofe &&
            String(salon.idprofe) === String(usuarioSolicitante._id);

        if (!esAdministrador && !esProfesorPropietario) {
            return response.status(403).json({
                success: false,
                message: "No tienes permiso para consultar este dashboard."
            });
        }

        const estadosActivos = [
            "Matriculado",
            "Aprobado",
            "Reprobado"
        ];

        const [matriculas, tareasEncontradas] = await Promise.all([
            SalonEstudiante.find({
                idgrupo: salon._id,
                status: { $in: estadosActivos }
            })
                .sort({ fecha: 1 })
                .lean(),
            Tarea.find({ idgrupo: salon._id })
                .sort({ tema: 1, fechavencimiento: 1 })
                .lean()
        ]);

        const tareas = tareasEncontradas.map(function (tarea) {
            return {
                ...tarea,
                tema: normalizarTema(tarea.tema)
            };
        });

        const idsEstudiantes = matriculas.map(
            matricula => matricula.idestudiante
        );
        const idsTareas = tareas.map(tarea => tarea._id);

        const [estudiantes, asignaciones] = await Promise.all([
            idsEstudiantes.length > 0
                ? Usuario.find({
                    _id: { $in: idsEstudiantes },
                    rol: 3
                })
                    .select("_id nombre cedula rol")
                    .lean()
                : Promise.resolve([]),
            idsEstudiantes.length > 0 && idsTareas.length > 0
                ? TareaEstudiante.find({
                    idestudiante: { $in: idsEstudiantes },
                    idtarea: { $in: idsTareas }
                })
                    .select(
                        "_id idestudiante idtarea docentrega archivoEntrega fechaentrega nota"
                    )
                    .lean()
                : Promise.resolve([])
        ]);

        const estudiantesPorId = new Map();
        estudiantes.forEach(function (estudiante) {
            estudiantesPorId.set(String(estudiante._id), estudiante);
        });

        const asignacionesPorEstudianteYTarea = new Map();
        asignaciones.forEach(function (asignacion) {
            const clave = crearClaveAsignacion(
                asignacion.idestudiante,
                asignacion.idtarea
            );
            asignacionesPorEstudianteYTarea.set(clave, asignacion);
        });

        const data = [];

        matriculas.forEach(function (matricula) {
            const estudiante = estudiantesPorId.get(
                String(matricula.idestudiante)
            );

            if (!estudiante) {
                return;
            }

            if (tareas.length === 0) {
                data.push(crearRegistroSinTareas(salon, matricula, estudiante));
                return;
            }

            tareas.forEach(function (tarea) {
                const clave = crearClaveAsignacion(
                    estudiante._id,
                    tarea._id
                );
                const asignacion =
                    asignacionesPorEstudianteYTarea.get(clave) || null;

                data.push(
                    crearRegistroDashboard(
                        salon,
                        matricula,
                        estudiante,
                        tarea,
                        asignacion,
                        usuarioSolicitante._id
                    )
                );
            });
        });

        data.sort(function (registroA, registroB) {
            const comparacionEstudiantes =
                registroA.nombreEstudiante.localeCompare(
                    registroB.nombreEstudiante,
                    "es",
                    { sensitivity: "base" }
                );

            if (comparacionEstudiantes !== 0) {
                return comparacionEstudiantes;
            }

            const comparacionTemas = registroA.tema.localeCompare(
                registroB.tema,
                "es",
                { sensitivity: "base" }
            );

            if (comparacionTemas !== 0) {
                return comparacionTemas;
            }

            return registroA.nombreTarea.localeCompare(
                registroB.nombreTarea,
                "es",
                { sensitivity: "base" }
            );
        });

        const entregasRealizadas = data.filter(
            registro => registro.estadoEntrega === "Entregada"
        ).length;
        const entregasPendientes = data.filter(
            registro => registro.estadoEntrega === "Sin entregar"
        ).length;
        const entregasCalificadas = data.filter(
            registro => registro.estadoEntrega === "Calificada"
        ).length;

        return response.status(200).json({
            success: true,
            salon: {
                _id: salon._id,
                nombre: salon.nombre || "",
                materia: salon.materia || "",
                grado: salon.grado,
                clave: salon.clave || "",
                cupo: salon.cupo,
                idprofe: salon.idprofe
            },
            resumen: {
                estudiantesMatriculados: matriculas.length,
                totalTareas: tareas.length,
                entregasRealizadas:
                    entregasRealizadas + entregasCalificadas,
                entregasCalificadas,
                entregasPendientes
            },
            data
        });
    } catch (error) {
        console.error("Error al obtener los datos del dashboard:", error);

        return response.status(500).json({
            success: false,
            message: "Ocurrió un error en el servidor al cargar el dashboard."
        });
    }
};

function crearRegistroDashboard(
    salon,
    matricula,
    estudiante,
    tarea,
    asignacion,
    idUsuarioSolicitante
) {
    const documentoEntregado =
        asignacion && typeof asignacion.docentrega === "string"
            ? asignacion.docentrega.trim()
            : "";

    const archivoEntrega = normalizarArchivoEntrega(
        asignacion?.archivoEntrega,
        idUsuarioSolicitante
    );

    const tieneArchivoEntrega = Boolean(archivoEntrega?.archivoId);
    const tieneEntrega = Boolean(documentoEntregado || tieneArchivoEntrega);
    const tieneNota = Boolean(
        asignacion &&
        asignacion.nota !== undefined &&
        asignacion.nota !== null &&
        String(asignacion.nota).trim() !== ""
    );

    let estadoEntrega = "Sin entregar";

    if (tieneEntrega && tieneNota) {
        estadoEntrega = "Calificada";
    } else if (tieneEntrega) {
        estadoEntrega = "Entregada";
    }

    return {
        idMatricula: matricula._id,
        idEstudiante: estudiante._id,
        nombreEstudiante: estudiante.nombre || "Estudiante sin nombre",
        cedulaEstudiante: estudiante.cedula || "Sin cédula",
        estadoMatricula: matricula.status || "Matriculado",
        notaFinal: matricula.notafinal || "0",

        idSalon: salon._id,
        nombreSalon: salon.nombre || "",
        materia: salon.materia || "",

        idTarea: tarea._id,
        tema: normalizarTema(tarea.tema),
        nombreTarea: tarea.nombre || "Tarea sin nombre",
        fechaVencimiento: tarea.fechavencimiento || null,

        idEntrega: asignacion ? asignacion._id : null,
        estadoEntrega,
        tieneArchivoEntrega,
        docentrega: documentoEntregado || null,
        archivoEntrega,
        fechaentrega:
            asignacion && asignacion.fechaentrega
                ? asignacion.fechaentrega
                : null,
        nota: tieneNota ? String(asignacion.nota) : null
    };
}

function normalizarArchivoEntrega(archivo, idUsuarioSolicitante) {
    if (!archivo || !archivo.archivoId) {
        return null;
    }

    const archivoId = String(archivo.archivoId);

    return {
        archivoId,
        nombre:
            archivo.nombre ||
            archivo.nombreOriginal ||
            "Archivo entregado",
        tipo:
            archivo.tipo ||
            archivo.tipoContenido ||
            "application/octet-stream",
        tamano: Number(archivo.tamano || archivo.size || 0),
        urlDescarga:
            `/Escuelapp/DescargarArchivo/${encodeURIComponent(archivoId)}` +
            `?idusuario=${encodeURIComponent(String(idUsuarioSolicitante))}`
    };
}

function crearRegistroSinTareas(salon, matricula, estudiante) {
    return {
        idMatricula: matricula._id,
        idEstudiante: estudiante._id,
        nombreEstudiante: estudiante.nombre || "Estudiante sin nombre",
        cedulaEstudiante: estudiante.cedula || "Sin cédula",
        estadoMatricula: matricula.status || "Matriculado",
        notaFinal: matricula.notafinal || "0",

        idSalon: salon._id,
        nombreSalon: salon.nombre || "",
        materia: salon.materia || "",

        idTarea: null,
        tema: "Sin tema",
        nombreTarea: "Sin tareas disponibles",
        fechaVencimiento: null,

        idEntrega: null,
        estadoEntrega: "Sin tareas",
        tieneArchivoEntrega: false,
        docentrega: null,
        archivoEntrega: null,
        fechaentrega: null,
        nota: null
    };
}

function crearClaveAsignacion(idEstudiante, idTarea) {
    return `${idEstudiante.toString()}:${idTarea.toString()}`;
}

function normalizarTema(tema) {
    if (typeof tema !== "string") {
        return "Sin tema";
    }

    const temaNormalizado = tema.trim().replace(/\s+/g, " ");
    return temaNormalizado || "Sin tema";
}

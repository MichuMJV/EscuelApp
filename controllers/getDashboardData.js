const mongoose = require("mongoose");

const {
    Salon,
    SalonEstudiante,
    Usuario,
    Tarea,
    TareaEstudiante
} = require("../models/Models.js");

module.exports = async function getDashboardData(request, response) {
    const { idgrupo } = request.query;

    if (!idgrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(idgrupo)) {
        return response.status(400).json({
            success: false,
            message: "El ID del salón no es válido."
        });
    }

    try {
        const salon = await Salon.findById(idgrupo)
            .select(
                "_id nombre materia grado clave cupo idprofe"
            )
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "El salón especificado no fue encontrado."
            });
        }

        const estadosActivos = [
            "Matriculado",
            "Aprobado",
            "Reprobado"
        ];

        const matriculas = await SalonEstudiante.find({
            idgrupo: salon._id,
            status: {
                $in: estadosActivos
            }
        })
            .sort({
                fecha: 1
            })
            .lean();

        const tareasEncontradas = await Tarea.find({
            idgrupo: salon._id
        })
            .sort({
                tema: 1,
                fechavencimiento: 1
            })
            .lean();

        const tareas = tareasEncontradas.map(function (tarea) {
            return {
                ...tarea,
                tema: normalizarTema(tarea.tema)
            };
        });

        const idsEstudiantes = matriculas.map(function (matricula) {
            return matricula.idestudiante;
        });

        const idsTareas = tareas.map(function (tarea) {
            return tarea._id;
        });

        const [estudiantes, asignaciones] = await Promise.all([
            idsEstudiantes.length > 0
                ? Usuario.find({
                    _id: {
                        $in: idsEstudiantes
                    },
                    rol: 3
                })
                    .select("_id nombre cedula rol")
                    .lean()
                : Promise.resolve([]),

            idsEstudiantes.length > 0 && idsTareas.length > 0
                ? TareaEstudiante.find({
                    idestudiante: {
                        $in: idsEstudiantes
                    },
                    idtarea: {
                        $in: idsTareas
                    }
                }).lean()
                : Promise.resolve([])
        ]);

        const estudiantesPorId = new Map();

        estudiantes.forEach(function (estudiante) {
            estudiantesPorId.set(
                estudiante._id.toString(),
                estudiante
            );
        });

        const asignacionesPorEstudianteYTarea = new Map();

        asignaciones.forEach(function (asignacion) {
            const clave = crearClaveAsignacion(
                asignacion.idestudiante,
                asignacion.idtarea
            );

            asignacionesPorEstudianteYTarea.set(
                clave,
                asignacion
            );
        });

        const data = [];

        matriculas.forEach(function (matricula) {
            const idEstudiante =
                matricula.idestudiante.toString();

            const estudiante =
                estudiantesPorId.get(idEstudiante);

            if (!estudiante) {
                return;
            }

            if (tareas.length === 0) {
                data.push(
                    crearRegistroSinTareas(
                        salon,
                        matricula,
                        estudiante
                    )
                );

                return;
            }

            tareas.forEach(function (tarea) {
                const claveAsignacion =
                    crearClaveAsignacion(
                        estudiante._id,
                        tarea._id
                    );

                const asignacion =
                    asignacionesPorEstudianteYTarea.get(
                        claveAsignacion
                    ) || null;

                data.push(
                    crearRegistroDashboard(
                        salon,
                        matricula,
                        estudiante,
                        tarea,
                        asignacion
                    )
                );
            });
        });

        data.sort(function (registroA, registroB) {
            const comparacionEstudiantes =
                registroA.nombreEstudiante.localeCompare(
                    registroB.nombreEstudiante,
                    "es",
                    {
                        sensitivity: "base"
                    }
                );

            if (comparacionEstudiantes !== 0) {
                return comparacionEstudiantes;
            }

            const comparacionTemas =
                registroA.tema.localeCompare(
                    registroB.tema,
                    "es",
                    {
                        sensitivity: "base"
                    }
                );

            if (comparacionTemas !== 0) {
                return comparacionTemas;
            }

            return registroA.nombreTarea.localeCompare(
                registroB.nombreTarea,
                "es",
                {
                    sensitivity: "base"
                }
            );
        });

        const entregasRealizadas = data.filter(
            function (registro) {
                return registro.estadoEntrega === "Entregada";
            }
        ).length;

        const entregasPendientes = data.filter(
            function (registro) {
                return registro.estadoEntrega === "Sin entregar";
            }
        ).length;

        const entregasCalificadas = data.filter(
            function (registro) {
                return registro.estadoEntrega === "Calificada";
            }
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
        console.error(
            "Error al obtener los datos del dashboard:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error en el servidor al cargar el dashboard."
        });
    }
};

function crearRegistroDashboard(
    salon,
    matricula,
    estudiante,
    tarea,
    asignacion
) {
    const documentoEntregado =
        asignacion &&
        typeof asignacion.docentrega === "string"
            ? asignacion.docentrega.trim()
            : "";

    const tieneEntrega = Boolean(documentoEntregado);

    const tieneNota =
        asignacion &&
        asignacion.nota !== undefined &&
        asignacion.nota !== null &&
        String(asignacion.nota).trim() !== "";

    let estadoEntrega = "Sin entregar";

    if (tieneEntrega && tieneNota) {
        estadoEntrega = "Calificada";
    } else if (tieneEntrega) {
        estadoEntrega = "Entregada";
    }

    return {
        idMatricula: matricula._id,
        idEstudiante: estudiante._id,
        nombreEstudiante:
            estudiante.nombre || "Estudiante sin nombre",
        cedulaEstudiante:
            estudiante.cedula || "Sin cédula",
        estadoMatricula:
            matricula.status || "Matriculado",
        notaFinal:
            matricula.notafinal || "0",

        idSalon: salon._id,
        nombreSalon: salon.nombre || "",
        materia: salon.materia || "",

        idTarea: tarea._id,
        tema: normalizarTema(tarea.tema),
        nombreTarea:
            tarea.nombre || "Tarea sin nombre",
        fechaVencimiento:
            tarea.fechavencimiento || null,

        idEntrega: asignacion
            ? asignacion._id
            : null,
        estadoEntrega,
        docentrega: documentoEntregado || null,
        fechaentrega:
            asignacion && asignacion.fechaentrega
                ? asignacion.fechaentrega
                : null,
        nota: tieneNota
            ? String(asignacion.nota)
            : null
    };
}

function crearRegistroSinTareas(
    salon,
    matricula,
    estudiante
) {
    return {
        idMatricula: matricula._id,
        idEstudiante: estudiante._id,
        nombreEstudiante:
            estudiante.nombre || "Estudiante sin nombre",
        cedulaEstudiante:
            estudiante.cedula || "Sin cédula",
        estadoMatricula:
            matricula.status || "Matriculado",
        notaFinal:
            matricula.notafinal || "0",

        idSalon: salon._id,
        nombreSalon: salon.nombre || "",
        materia: salon.materia || "",

        idTarea: null,
        tema: "Sin tema",
        nombreTarea: "Sin tareas disponibles",
        fechaVencimiento: null,

        idEntrega: null,
        estadoEntrega: "Sin tareas",
        docentrega: null,
        fechaentrega: null,
        nota: null
    };
}

function crearClaveAsignacion(
    idEstudiante,
    idTarea
) {
    return `${idEstudiante.toString()}:${idTarea.toString()}`;
}

function normalizarTema(tema) {
    if (typeof tema !== "string") {
        return "Sin tema";
    }

    const temaNormalizado = tema
        .trim()
        .replace(/\s+/g, " ");

    return temaNormalizado || "Sin tema";
}
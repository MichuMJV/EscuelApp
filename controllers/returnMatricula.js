const mongoose = require("mongoose");

const {
    Salon,
    SalonEstudiante,
    Usuario
} = require("../models/Models.js");

module.exports = async function estudiantesDeMateria(
    request,
    response
) {
    const idGrupo =
        request.query.idGrupo ||
        request.query.idgrupo ||
        request.query.id;

    const incluirRetirados =
        request.query.incluirRetirados === "true";

    if (!idGrupo) {
        return response.status(400).json({
            success: false,
            message: "Se requiere el ID del salón."
        });
    }

    if (!mongoose.Types.ObjectId.isValid(idGrupo)) {
        return response.status(400).json({
            success: false,
            message: "El ID del salón no es válido."
        });
    }

    try {
        const salon = await Salon.findById(idGrupo)
            .select(
                "_id nombre materia grado clave cupo idprofe"
            )
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message: "El salón especificado no existe."
            });
        }

        const filtroMatriculas = {
            idgrupo: salon._id
        };

        if (!incluirRetirados) {
            filtroMatriculas.status = {
                $in: [
                    "Matriculado",
                    "Aprobado",
                    "Reprobado"
                ]
            };
        }

        const matriculas = await SalonEstudiante.find(
            filtroMatriculas
        )
            .sort({
                fecha: 1
            })
            .lean();

        if (matriculas.length === 0) {
            return response.status(200).json({
                success: true,
                salon: {
                    _id: salon._id,
                    nombre: salon.nombre || "",
                    materia: salon.materia || "",
                    grado: salon.grado,
                    clave: salon.clave || "",
                    cupo: salon.cupo
                },
                total: 0,
                data: []
            });
        }

        const idsEstudiantes = matriculas.map(
            function (matricula) {
                return matricula.idestudiante;
            }
        );

        const estudiantes = await Usuario.find({
            _id: {
                $in: idsEstudiantes
            },
            rol: 3
        })
            .select("_id nombre cedula rol")
            .lean();

        const estudiantesPorId = new Map();

        estudiantes.forEach(function (estudiante) {
            estudiantesPorId.set(
                estudiante._id.toString(),
                estudiante
            );
        });

        const data = matriculas
            .map(function (matricula) {
                const estudiante =
                    estudiantesPorId.get(
                        matricula.idestudiante.toString()
                    );

                if (!estudiante) {
                    return null;
                }

                return {
                    _id: matricula._id,
                    idMatricula: matricula._id,
                    idgrupo: matricula.idgrupo,
                    idestudiante: estudiante._id,
                    status:
                        matricula.status || "Matriculado",
                    notafinal:
                        matricula.notafinal || "0",
                    fecha: matricula.fecha || null,

                    estudiante: {
                        _id: estudiante._id,
                        nombre:
                            estudiante.nombre ||
                            "Estudiante sin nombre",
                        cedula:
                            estudiante.cedula ||
                            "Sin cédula",
                        rol: estudiante.rol
                    },

                    nombreEstudiante:
                        estudiante.nombre ||
                        "Estudiante sin nombre",

                    cedulaEstudiante:
                        estudiante.cedula ||
                        "Sin cédula"
                };
            })
            .filter(function (registro) {
                return registro !== null;
            })
            .sort(function (registroA, registroB) {
                return registroA.nombreEstudiante.localeCompare(
                    registroB.nombreEstudiante,
                    "es",
                    {
                        sensitivity: "base"
                    }
                );
            });

        return response.status(200).json({
            success: true,

            salon: {
                _id: salon._id,
                nombre: salon.nombre || "",
                materia: salon.materia || "",
                grado: salon.grado,
                clave: salon.clave || "",
                cupo: salon.cupo
            },

            total: data.length,
            data
        });
    } catch (error) {
        console.error(
            "Error al obtener los estudiantes matriculados:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al obtener los estudiantes matriculados."
        });
    }
};
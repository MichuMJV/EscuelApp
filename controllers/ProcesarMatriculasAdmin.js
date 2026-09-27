const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const {
    Usuario,
    Salon,
    Tarea,
    TareaEstudiante,
    SalonEstudiante
} = require("../models/Models.js");

const ACCIONES_VALIDAS = [
    "MATRICULAR",
    "RETIRAR"
];

const ESTADOS_ACTIVOS = [
    "Matriculado",
    "Aprobado",
    "Reprobado"
];

const MAXIMO_FILAS = 1000;

module.exports = async function ProcesarMatriculasAdmin(
    request,
    response
) {
    const {
        idSalon,
        idAdmin
    } = request.body;

    if (!idSalon || !idAdmin) {
        return response.status(400).json({
            success: false,
            message:
                "Se requiere el ID del salón y el ID del administrador."
        });
    }

    if (
        !mongoose.Types.ObjectId.isValid(idSalon) ||
        !mongoose.Types.ObjectId.isValid(idAdmin)
    ) {
        return response.status(400).json({
            success: false,
            message:
                "El ID del salón o del administrador no es válido."
        });
    }

    if (!request.file || !request.file.buffer) {
        return response.status(400).json({
            success: false,
            message:
                "Debes seleccionar un archivo Excel para procesar."
        });
    }

    try {
        const administrador = await Usuario.findById(idAdmin)
            .select("_id nombre rol")
            .lean();

        if (!administrador) {
            return response.status(404).json({
                success: false,
                message:
                    "El administrador no fue encontrado."
            });
        }

        if (Number(administrador.rol) !== 1) {
            return response.status(403).json({
                success: false,
                message:
                    "No tienes permiso para procesar matrículas administrativas."
            });
        }

        const salon = await Salon.findById(idSalon);

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón seleccionado no fue encontrado."
            });
        }

        const filas = leerFilasExcel(
            request.file.buffer
        );

        if (filas.length === 0) {
            return response.status(400).json({
                success: false,
                message:
                    "El archivo Excel no contiene registros para procesar."
            });
        }

        if (filas.length > MAXIMO_FILAS) {
            return response.status(400).json({
                success: false,
                message:
                    `El archivo contiene más de ${MAXIMO_FILAS} registros. ` +
                    "Divide la carga en varios archivos."
            });
        }

        const resultados = [];
        const cedulasProcesadas = new Set();

        for (
            let indice = 0;
            indice < filas.length;
            indice += 1
        ) {
            const numeroFilaExcel = indice + 2;
            const fila = filas[indice];

            const resultado = await procesarFila({
                fila,
                numeroFilaExcel,
                salon,
                cedulasProcesadas
            });

            resultados.push(resultado);
        }

        const resumen = crearResumen(
            resultados,
            salon
        );

        const archivoResultado = crearExcelResultados(
            resultados,
            resumen
        );

        const nombreArchivo = crearNombreArchivo(
            salon.nombre
        );

        response.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        response.setHeader(
            "Content-Disposition",
            `attachment; filename="${nombreArchivo}"`
        );

        response.setHeader(
            "Content-Length",
            archivoResultado.length
        );

        return response.status(200).send(
            archivoResultado
        );
    } catch (error) {
        console.error(
            "Error al procesar el archivo de matrículas:",
            error
        );

        if (
            error &&
            error.message &&
            error.message.startsWith(
                "FORMATO_EXCEL:"
            )
        ) {
            return response.status(400).json({
                success: false,
                message: error.message.replace(
                    "FORMATO_EXCEL:",
                    ""
                ).trim()
            });
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error en el servidor al procesar el archivo."
        });
    }
};

function leerFilasExcel(bufferArchivo) {
    let libro;

    try {
        libro = XLSX.read(
            bufferArchivo,
            {
                type: "buffer",
                cellDates: false,
                raw: false
            }
        );
    } catch (error) {
        throw new Error(
            "FORMATO_EXCEL: El archivo no pudo ser interpretado como un documento Excel válido."
        );
    }

    if (
        !libro.SheetNames ||
        libro.SheetNames.length === 0
    ) {
        throw new Error(
            "FORMATO_EXCEL: El archivo no contiene hojas de cálculo."
        );
    }

    const nombrePrimeraHoja =
        libro.SheetNames[0];

    const hoja =
        libro.Sheets[nombrePrimeraHoja];

    const filasOriginales =
        XLSX.utils.sheet_to_json(
            hoja,
            {
                defval: "",
                raw: false
            }
        );

    if (filasOriginales.length === 0) {
        return [];
    }

    const encabezadosDisponibles =
        Object.keys(filasOriginales[0]).map(
            normalizarEncabezado
        );

    const encabezadosRequeridos = [
        "nombre",
        "cedula",
        "accion"
    ];

    const encabezadosFaltantes =
        encabezadosRequeridos.filter(
            function (encabezado) {
                return !encabezadosDisponibles.includes(
                    encabezado
                );
            }
        );

    if (encabezadosFaltantes.length > 0) {
        throw new Error(
            "FORMATO_EXCEL: Faltan las columnas obligatorias: " +
            encabezadosFaltantes.join(", ") +
            "."
        );
    }

    return filasOriginales.map(
        normalizarFilaExcel
    );
}

function normalizarFilaExcel(filaOriginal) {
    const filaNormalizada = {};

    Object.entries(filaOriginal).forEach(
        function ([encabezado, valor]) {
            filaNormalizada[
                normalizarEncabezado(encabezado)
            ] = valor;
        }
    );

    return {
        nombre: normalizarNombre(
            filaNormalizada.nombre
        ),

        cedula: normalizarCedula(
            filaNormalizada.cedula
        ),

        accion: normalizarAccion(
            filaNormalizada.accion
        )
    };
}

async function procesarFila({
    fila,
    numeroFilaExcel,
    salon,
    cedulasProcesadas
}) {
    const resultadoBase = {
        fila: numeroFilaExcel,
        nombre: fila.nombre,
        cedula: fila.cedula,
        accion: fila.accion,
        resultado: "ERROR",
        usuario_creado: "NO",
        contrasena_temporal: "",
        detalle: ""
    };

    if (
        !fila.nombre &&
        !fila.cedula &&
        !fila.accion
    ) {
        return {
            ...resultadoBase,
            detalle: "La fila está completamente vacía."
        };
    }

    if (!fila.cedula) {
        return {
            ...resultadoBase,
            detalle:
                "La cédula es obligatoria."
        };
    }

    if (!fila.accion) {
        return {
            ...resultadoBase,
            detalle:
                "La acción es obligatoria."
        };
    }

    if (
        !ACCIONES_VALIDAS.includes(
            fila.accion
        )
    ) {
        return {
            ...resultadoBase,
            detalle:
                "La acción debe ser MATRICULAR o RETIRAR."
        };
    }

    if (
        cedulasProcesadas.has(fila.cedula)
    ) {
        return {
            ...resultadoBase,
            resultado: "ADVERTENCIA",
            detalle:
                "La cédula está repetida dentro del mismo archivo. Solo se procesó su primera aparición."
        };
    }

    cedulasProcesadas.add(fila.cedula);

    try {
        if (fila.accion === "MATRICULAR") {
            return await procesarMatricula({
                fila,
                numeroFilaExcel,
                salon,
                resultadoBase
            });
        }

        return await procesarRetiro({
            fila,
            resultadoBase,
            salon
        });
    } catch (error) {
        console.error(
            `Error al procesar la fila ${numeroFilaExcel}:`,
            error
        );

        return {
            ...resultadoBase,
            detalle:
                obtenerMensajeSeguro(error)
        };
    }
}

async function procesarMatricula({
    fila,
    salon,
    resultadoBase
}) {
    let usuario = await Usuario.findOne({
        cedula: fila.cedula
    });

    const usuarioYaExistia = Boolean(usuario);

    if (
        usuario &&
        Number(usuario.rol) !== 3
    ) {
        return {
            ...resultadoBase,
            nombre:
                usuario.nombre ||
                fila.nombre,
            detalle:
                "La cédula pertenece a una cuenta que no tiene el rol de estudiante."
        };
    }

    const matriculaExistente = usuario
        ? await SalonEstudiante.findOne({
            idgrupo: salon._id,
            idestudiante: usuario._id
        })
        : null;

    if (
        matriculaExistente &&
        ESTADOS_ACTIVOS.includes(
            matriculaExistente.status
        )
    ) {
        return {
            ...resultadoBase,
            nombre:
                usuario.nombre ||
                fila.nombre,
            resultado: "ADVERTENCIA",
            detalle:
                "El estudiante ya tiene una matrícula activa en este salón."
        };
    }

    const cupoDisponible = Number(
        salon.cupo
    );

    if (
        !Number.isFinite(cupoDisponible) ||
        cupoDisponible <= 0
    ) {
        return {
            ...resultadoBase,
            nombre:
                usuario
                    ? usuario.nombre
                    : fila.nombre,
            detalle:
                "El salón no tiene cupos disponibles."
        };
    }

    if (!usuario && !fila.nombre) {
        return {
            ...resultadoBase,
            detalle:
                "El nombre es obligatorio para crear una cuenta nueva."
        };
    }

    let contrasenaTemporal = "";
    let usuarioCreadoEnEstaFila = false;

    try {
        if (!usuario) {
            contrasenaTemporal =
                generarContrasenaTemporal();

            const contrasenaHasheada =
                await bcrypt.hash(
                    contrasenaTemporal,
                    10
                );

            usuario = await Usuario.create({
                rol: 3,
                nombre: fila.nombre,
                cedula: fila.cedula,
                contrasena:
                    contrasenaHasheada,
                debeCambiarContrasena: true,
                fechaCambioContrasena: null,
                fechaCreacion: new Date()
            });

            usuarioCreadoEnEstaFila = true;
        }

        let matricula;

        if (
            matriculaExistente &&
            matriculaExistente.status ===
                "Retirado"
        ) {
            matriculaExistente.status =
                "Matriculado";

            matriculaExistente.notafinal =
                "0";

            matriculaExistente.fecha =
                new Date();

            matricula =
                await matriculaExistente.save();
        } else {
            matricula =
                await SalonEstudiante.create({
                    idgrupo: salon._id,
                    idestudiante: usuario._id,
                    status: "Matriculado",
                    notafinal: "0",
                    fecha: new Date()
                });
        }

        await crearAsignacionesFaltantes(
            salon._id,
            usuario._id
        );

        salon.cupo =
            cupoDisponible - 1;

        await salon.save();

        return {
            ...resultadoBase,
            nombre:
                usuario.nombre || fila.nombre,
            resultado: "PROCESADO",
            usuario_creado:
                usuarioCreadoEnEstaFila
                    ? "SÍ"
                    : "NO",
            contrasena_temporal:
                contrasenaTemporal,
            detalle:
                matriculaExistente &&
                matriculaExistente.status ===
                    "Matriculado"
                    ? "La matrícula fue reactivada correctamente."
                    : "El estudiante fue matriculado correctamente."
        };
    } catch (error) {
        if (usuarioCreadoEnEstaFila && usuario) {
            await revertirUsuarioNuevo(
                usuario._id
            );
        }

        throw error;
    }
}

async function procesarRetiro({
    fila,
    resultadoBase,
    salon
}) {
    const usuario = await Usuario.findOne({
        cedula: fila.cedula
    });

    if (!usuario) {
        return {
            ...resultadoBase,
            detalle:
                "No existe un usuario registrado con esta cédula."
        };
    }

    if (Number(usuario.rol) !== 3) {
        return {
            ...resultadoBase,
            nombre:
                usuario.nombre || fila.nombre,
            detalle:
                "La cédula pertenece a una cuenta que no tiene el rol de estudiante."
        };
    }

    const matricula =
        await SalonEstudiante.findOne({
            idgrupo: salon._id,
            idestudiante: usuario._id
        });

    if (!matricula) {
        return {
            ...resultadoBase,
            nombre:
                usuario.nombre || fila.nombre,
            detalle:
                "El estudiante no tiene una matrícula en este salón."
        };
    }

    if (matricula.status === "Retirado") {
        return {
            ...resultadoBase,
            nombre:
                usuario.nombre || fila.nombre,
            resultado: "ADVERTENCIA",
            detalle:
                "El estudiante ya estaba retirado de este salón."
        };
    }

    matricula.status = "Retirado";

    await matricula.save();

    const cupoActual = Number(salon.cupo);

    salon.cupo =
        Number.isFinite(cupoActual)
            ? cupoActual + 1
            : 1;

    await salon.save();

    return {
        ...resultadoBase,
        nombre:
            usuario.nombre || fila.nombre,
        resultado: "PROCESADO",
        detalle:
            "El estudiante fue retirado correctamente."
    };
}

async function crearAsignacionesFaltantes(
    idSalon,
    idEstudiante
) {
    const tareas = await Tarea.find({
        idgrupo: idSalon
    })
        .select("_id")
        .lean();

    if (tareas.length === 0) {
        return;
    }

    const operaciones = tareas.map(
        function (tarea) {
            return {
                updateOne: {
                    filter: {
                        idtarea: tarea._id,
                        idestudiante:
                            idEstudiante
                    },

                    update: {
                        $setOnInsert: {
                            idtarea: tarea._id,
                            idestudiante:
                                idEstudiante
                        }
                    },

                    upsert: true
                }
            };
        }
    );

    await TareaEstudiante.bulkWrite(
        operaciones,
        {
            ordered: false
        }
    );
}

async function revertirUsuarioNuevo(
    idUsuario
) {
    try {
        await Promise.all([
            SalonEstudiante.deleteMany({
                idestudiante: idUsuario
            }),

            TareaEstudiante.deleteMany({
                idestudiante: idUsuario
            })
        ]);

        await Usuario.findByIdAndDelete(
            idUsuario
        );
    } catch (error) {
        console.error(
            "No fue posible revertir por completo al usuario nuevo:",
            error
        );
    }
}

function crearResumen(
    resultados,
    salon
) {
    const procesados = resultados.filter(
        function (resultado) {
            return resultado.resultado ===
                "PROCESADO";
        }
    ).length;

    const advertencias = resultados.filter(
        function (resultado) {
            return resultado.resultado ===
                "ADVERTENCIA";
        }
    ).length;

    const errores = resultados.filter(
        function (resultado) {
            return resultado.resultado ===
                "ERROR";
        }
    ).length;

    const usuariosCreados =
        resultados.filter(
            function (resultado) {
                return (
                    resultado.usuario_creado ===
                    "SÍ"
                );
            }
        ).length;

    return [
        {
            concepto: "Salón",
            valor:
                salon.nombre ||
                "Salón sin nombre"
        },
        {
            concepto: "Materia",
            valor:
                salon.materia ||
                "Sin especificar"
        },
        {
            concepto:
                "Total de filas procesadas",
            valor: resultados.length
        },
        {
            concepto:
                "Registros procesados",
            valor: procesados
        },
        {
            concepto: "Advertencias",
            valor: advertencias
        },
        {
            concepto: "Errores",
            valor: errores
        },
        {
            concepto:
                "Usuarios nuevos creados",
            valor: usuariosCreados
        },
        {
            concepto:
                "Cupos disponibles después del proceso",
            valor: salon.cupo
        }
    ];
}

function crearExcelResultados(
    resultados,
    resumen
) {
    const libro = XLSX.utils.book_new();

    const hojaResultados =
        XLSX.utils.json_to_sheet(
            resultados,
            {
                header: [
                    "fila",
                    "nombre",
                    "cedula",
                    "accion",
                    "resultado",
                    "usuario_creado",
                    "contrasena_temporal",
                    "detalle"
                ]
            }
        );

    const hojaResumen =
        XLSX.utils.json_to_sheet(
            resumen,
            {
                header: [
                    "concepto",
                    "valor"
                ]
            }
        );

    hojaResultados["!cols"] = [
        { wch: 8 },
        { wch: 28 },
        { wch: 18 },
        { wch: 14 },
        { wch: 16 },
        { wch: 17 },
        { wch: 23 },
        { wch: 55 }
    ];

    hojaResumen["!cols"] = [
        { wch: 42 },
        { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(
        libro,
        hojaResultados,
        "Resultados"
    );

    XLSX.utils.book_append_sheet(
        libro,
        hojaResumen,
        "Resumen"
    );

    const buffer = XLSX.write(
        libro,
        {
            type: "buffer",
            bookType: "xlsx",
            compression: true
        }
    );

    return buffer;
}

function generarContrasenaTemporal() {
    const mayusculas =
        "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const minusculas =
        "abcdefghijkmnopqrstuvwxyz";

    const numeros =
        "23456789";

    const simbolos = "@#$%";

    const caracteresDisponibles =
        mayusculas +
        minusculas +
        numeros +
        simbolos;

    const caracteresObligatorios = [
        obtenerCaracterSeguro(mayusculas),
        obtenerCaracterSeguro(minusculas),
        obtenerCaracterSeguro(numeros),
        obtenerCaracterSeguro(simbolos)
    ];

    while (
        caracteresObligatorios.length < 12
    ) {
        caracteresObligatorios.push(
            obtenerCaracterSeguro(
                caracteresDisponibles
            )
        );
    }

    return mezclarCaracteres(
        caracteresObligatorios
    ).join("");
}

function obtenerCaracterSeguro(
    caracteres
) {
    const indice = crypto.randomInt(
        0,
        caracteres.length
    );

    return caracteres[indice];
}

function mezclarCaracteres(caracteres) {
    const resultado = [...caracteres];

    for (
        let indice = resultado.length - 1;
        indice > 0;
        indice -= 1
    ) {
        const indiceAleatorio =
            crypto.randomInt(
                0,
                indice + 1
            );

        [
            resultado[indice],
            resultado[indiceAleatorio]
        ] = [
            resultado[indiceAleatorio],
            resultado[indice]
        ];
    }

    return resultado;
}

function normalizarEncabezado(valor) {
    return String(valor || "")
        .trim()
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(/\s+/g, "_");
}

function normalizarNombre(valor) {
    return String(valor || "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizarCedula(valor) {
    return String(valor || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}

function normalizarAccion(valor) {
    return String(valor || "")
        .trim()
        .toLocaleUpperCase("es")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}

function obtenerMensajeSeguro(error) {
    if (
        error &&
        error.code === 11000
    ) {
        return (
            "El registro produjo un duplicado en la base de datos."
        );
    }

    if (
        error &&
        error.name === "ValidationError"
    ) {
        return (
            "Los datos de la fila no cumplen las validaciones del sistema."
        );
    }

    return (
        "Ocurrió un error inesperado al procesar esta fila."
    );
}

function crearNombreArchivo(
    nombreSalon
) {
    const nombreNormalizado =
        String(
            nombreSalon ||
            "salon"
        )
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "_"
            )
            .replace(
                /^_+|_+$/g,
                ""
            )
            .slice(0, 40) ||
        "salon";

    const ahora = new Date();

    const ano = ahora.getFullYear();

    const mes = String(
        ahora.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        ahora.getDate()
    ).padStart(2, "0");

    return (
        `resultado_matriculas_${nombreNormalizado}_` +
        `${ano}-${mes}-${dia}.xlsx`
    );
}
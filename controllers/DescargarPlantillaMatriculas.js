const mongoose = require("mongoose");
const XLSX = require("xlsx");

const {
    Usuario,
    Salon
} = require("../models/Models.js");

module.exports = async function DescargarPlantillaMatriculas(
    request,
    response
) {
    const {
        idSalon,
        idAdmin
    } = request.query;

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

    try {
        const administrador = await Usuario.findById(
            idAdmin
        )
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
                    "No tienes permiso para descargar esta plantilla."
            });
        }

        const salon = await Salon.findById(
            idSalon
        )
            .select(
                "_id nombre materia grado clave cupo"
            )
            .lean();

        if (!salon) {
            return response.status(404).json({
                success: false,
                message:
                    "El salón seleccionado no fue encontrado."
            });
        }

        const archivo = crearPlantillaExcel(
            salon
        );

        const nombreArchivo =
            crearNombreArchivo(salon.nombre);

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
            archivo.length
        );

        return response.status(200).send(
            archivo
        );
    } catch (error) {
        console.error(
            "Error al generar la plantilla de matrículas:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error al generar la plantilla de matrículas."
        });
    }
};

function crearPlantillaExcel(salon) {
    const libro = XLSX.utils.book_new();

    const datosPlantilla = [
        {
            nombre: "Ana Pérez",
            cedula: "8-123-456",
            accion: "MATRICULAR"
        },
        {
            nombre: "Luis Gómez",
            cedula: "8-234-567",
            accion: "RETIRAR"
        }
    ];

    const instrucciones = [
        {
            campo: "Salón seleccionado",
            descripcion:
                salon.nombre ||
                "Salón sin nombre"
        },
        {
            campo: "Materia",
            descripcion:
                salon.materia ||
                "Materia sin especificar"
        },
        {
            campo: "Grado",
            descripcion:
                salon.grado !== undefined &&
                salon.grado !== null
                    ? String(salon.grado)
                    : "No especificado"
        },
        {
            campo: "Cupos disponibles",
            descripcion:
                salon.cupo !== undefined &&
                salon.cupo !== null
                    ? String(salon.cupo)
                    : "No disponible"
        },
        {
            campo: "nombre",
            descripcion:
                "Nombre completo del estudiante. Es obligatorio cuando la cédula no corresponde a una cuenta existente."
        },
        {
            campo: "cedula",
            descripcion:
                "Cédula del estudiante. Es obligatoria y se utiliza para localizar o crear la cuenta."
        },
        {
            campo: "accion",
            descripcion:
                "Solo se permite MATRICULAR o RETIRAR."
        },
        {
            campo: "MATRICULAR",
            descripcion:
                "Matricula al estudiante. Si la cuenta no existe, el sistema crea una cuenta con contraseña temporal."
        },
        {
            campo: "RETIRAR",
            descripcion:
                "Retira al estudiante del salón. La cuenta del usuario, las entregas y las notas no se eliminan."
        },
        {
            campo: "Contraseñas temporales",
            descripcion:
                "Las contraseñas de las cuentas nuevas aparecerán únicamente en el archivo de resultados."
        },
        {
            campo: "Importante",
            descripcion:
                "No cambies los nombres de las columnas nombre, cedula y accion."
        }
    ];

    const hojaPlantilla =
        XLSX.utils.json_to_sheet(
            datosPlantilla,
            {
                header: [
                    "nombre",
                    "cedula",
                    "accion"
                ]
            }
        );

    const hojaInstrucciones =
        XLSX.utils.json_to_sheet(
            instrucciones,
            {
                header: [
                    "campo",
                    "descripcion"
                ]
            }
        );

    hojaPlantilla["!cols"] = [
        {
            wch: 32
        },
        {
            wch: 20
        },
        {
            wch: 18
        }
    ];

    hojaInstrucciones["!cols"] = [
        {
            wch: 28
        },
        {
            wch: 95
        }
    ];

    hojaPlantilla["!autofilter"] = {
        ref: "A1:C3"
    };

    hojaPlantilla["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activePane: "bottomLeft",
        state: "frozen"
    };

    hojaInstrucciones["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activePane: "bottomLeft",
        state: "frozen"
    };

    aplicarFormatoEncabezado(
        hojaPlantilla,
        [
            "A1",
            "B1",
            "C1"
        ]
    );

    aplicarFormatoEncabezado(
        hojaInstrucciones,
        [
            "A1",
            "B1"
        ]
    );

    aplicarFormatoEjemplos(
        hojaPlantilla
    );

    aplicarFormatoInstrucciones(
        hojaInstrucciones
    );

    XLSX.utils.book_append_sheet(
        libro,
        hojaPlantilla,
        "Matriculas"
    );

    XLSX.utils.book_append_sheet(
        libro,
        hojaInstrucciones,
        "Instrucciones"
    );

    libro.Workbook = {
        Views: [
            {
                RTL: false
            }
        ]
    };

    return XLSX.write(
        libro,
        {
            type: "buffer",
            bookType: "xlsx",
            compression: true
        }
    );
}

function aplicarFormatoEncabezado(
    hoja,
    celdas
) {
    celdas.forEach(function (referencia) {
        if (!hoja[referencia]) {
            return;
        }

        hoja[referencia].s = {
            font: {
                bold: true,
                color: {
                    rgb: "FFFFFF"
                }
            },
            fill: {
                patternType: "solid",
                fgColor: {
                    rgb: "2878D0"
                }
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };
    });
}

function aplicarFormatoEjemplos(hoja) {
    const rango = XLSX.utils.decode_range(
        hoja["!ref"]
    );

    for (
        let fila = 1;
        fila <= rango.e.r;
        fila += 1
    ) {
        for (
            let columna = 0;
            columna <= rango.e.c;
            columna += 1
        ) {
            const referencia =
                XLSX.utils.encode_cell({
                    r: fila,
                    c: columna
                });

            if (!hoja[referencia]) {
                continue;
            }

            hoja[referencia].s = {
                font: {
                    color: {
                        rgb: "008000"
                    }
                },
                alignment: {
                    vertical: "center"
                }
            };
        }
    }
}

function aplicarFormatoInstrucciones(hoja) {
    const rango = XLSX.utils.decode_range(
        hoja["!ref"]
    );

    for (
        let fila = 1;
        fila <= rango.e.r;
        fila += 1
    ) {
        const celdaCampo =
            XLSX.utils.encode_cell({
                r: fila,
                c: 0
            });

        const celdaDescripcion =
            XLSX.utils.encode_cell({
                r: fila,
                c: 1
            });

        if (hoja[celdaCampo]) {
            hoja[celdaCampo].s = {
                font: {
                    bold: true,
                    color: {
                        rgb: "666666"
                    }
                },
                alignment: {
                    vertical: "top"
                }
            };
        }

        if (hoja[celdaDescripcion]) {
            hoja[celdaDescripcion].s = {
                font: {
                    color: {
                        rgb: "666666"
                    }
                },
                alignment: {
                    vertical: "top",
                    wrapText: true
                }
            };
        }
    }
}

function crearNombreArchivo(
    nombreSalon
) {
    const nombreNormalizado =
        normalizarNombreArchivo(
            nombreSalon
        );

    const fechaActual = new Date();

    const ano =
        fechaActual.getFullYear();

    const mes = String(
        fechaActual.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fechaActual.getDate()
    ).padStart(2, "0");

    return (
        `plantilla_matriculas_${nombreNormalizado}_` +
        `${ano}-${mes}-${dia}.xlsx`
    );
}

function normalizarNombreArchivo(valor) {
    const nombre = String(
        valor || "salon"
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
        .slice(0, 40);

    return nombre || "salon";
}
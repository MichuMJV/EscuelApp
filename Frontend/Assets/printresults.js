document.addEventListener("DOMContentLoaded", function () {
    const botonDescargar = document.getElementById(
        "download-button"
    );

    if (!botonDescargar) {
        return;
    }

    botonDescargar.addEventListener(
        "click",
        descargarResultadosDashboard
    );
});

function descargarResultadosDashboard() {
    const datosParaExportar =
        obtenerDatosDashboardParaExportar();

    if (datosParaExportar.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const encabezados = [
        "Estudiante",
        "Cédula",
        "Estado de matrícula",
        "Salón",
        "Materia",
        "Tema",
        "Tarea",
        "Estado de entrega",
        "Documento entregado",
        "Fecha de entrega",
        "Calificación"
    ];

    const filas = datosParaExportar.map(
        function (registro) {
            return [
                registro.nombreEstudiante ||
                    "Estudiante sin nombre",

                registro.cedulaEstudiante ||
                    "Sin cédula",

                registro.estadoMatricula ||
                    "Matriculado",

                registro.nombreSalon ||
                    "Salón sin nombre",

                registro.materia ||
                    "Materia sin especificar",

                registro.tema ||
                    "Sin tema",

                registro.nombreTarea ||
                    "Sin tareas disponibles",

                registro.estadoEntrega ||
                    "Sin entregar",

                obtenerDocumentoExportacion(
                    registro
                ),

                obtenerFechaExportacion(
                    registro.fechaentrega
                ),

                obtenerNotaExportacion(
                    registro
                )
            ];
        }
    );

    const contenidoCSV = construirContenidoCSV(
        encabezados,
        filas
    );

    descargarArchivoCSV(
        contenidoCSV,
        crearNombreArchivo()
    );
}

function obtenerDatosDashboardParaExportar() {
    if (
        !Array.isArray(
            window.currentDashboardData
        )
    ) {
        return [];
    }

    return window.currentDashboardData;
}

function obtenerDocumentoExportacion(
    registro
) {
    if (
        registro.estadoEntrega ===
        "Sin tareas"
    ) {
        return "No aplica";
    }

    if (
        typeof registro.docentrega ===
            "string" &&
        registro.docentrega.trim()
    ) {
        return registro.docentrega.trim();
    }

    return "Sin entregar";
}

function obtenerFechaExportacion(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    const fechaEntrega = new Date(fecha);

    if (
        Number.isNaN(
            fechaEntrega.getTime()
        )
    ) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat(
        "es-PA",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(fechaEntrega);
}

function obtenerNotaExportacion(registro) {
    if (
        registro.estadoEntrega ===
        "Sin tareas"
    ) {
        return "No aplica";
    }

    if (
        registro.nota !== undefined &&
        registro.nota !== null &&
        String(registro.nota).trim() !== ""
    ) {
        return String(registro.nota);
    }

    return "Sin calificar";
}

function construirContenidoCSV(
    encabezados,
    filas
) {
    const marcaUnicode = "\uFEFF";

    const lineas = [
        encabezados.map(
            escaparValorCSV
        ).join(",")
    ];

    filas.forEach(function (fila) {
        lineas.push(
            fila.map(
                escaparValorCSV
            ).join(",")
        );
    });

    return (
        marcaUnicode +
        lineas.join("\r\n")
    );
}

function escaparValorCSV(valor) {
    const texto = String(
        valor === undefined ||
        valor === null
            ? ""
            : valor
    );

    const textoEscapado =
        texto.replace(/"/g, '""');

    return `"${textoEscapado}"`;
}

function descargarArchivoCSV(
    contenido,
    nombreArchivo
) {
    const archivo = new Blob(
        [contenido],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );

    const urlArchivo =
        URL.createObjectURL(archivo);

    const enlace =
        document.createElement("a");

    enlace.href = urlArchivo;
    enlace.download = nombreArchivo;
    enlace.style.display = "none";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function () {
        URL.revokeObjectURL(
            urlArchivo
        );
    }, 1000);
}

function crearNombreArchivo() {
    const informacionSalon =
        document.getElementById(
            "dashboard-salon-info"
        );

    const nombreSalon =
        informacionSalon &&
        informacionSalon.textContent
            ? informacionSalon.textContent
            : "dashboard";

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
        `calificaciones_${nombreNormalizado}_` +
        `${ano}-${mes}-${dia}.csv`
    );
}

function normalizarNombreArchivo(valor) {
    const resultado = String(
        valor || "dashboard"
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
        .slice(0, 60);

    return resultado || "dashboard";
}
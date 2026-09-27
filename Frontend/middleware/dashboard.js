document.addEventListener("DOMContentLoaded", function () {
    inicializarDashboard();
});

let datosDashboardCompletos = [];
let datosDashboardFiltrados = [];
let estudiantesDisponibles = [];
let matriculasDelSalon = [];
let salonDashboard = null;
let idSalonDashboard = null;
let usuarioActualDashboard = null;

async function inicializarDashboard() {
    const parametrosURL = new URLSearchParams(
        window.location.search
    );

    idSalonDashboard = parametrosURL.get("id");
    usuarioActualDashboard = obtenerUsuarioSesion();

    if (!idSalonDashboard) {
        mostrarErrorInicial(
            "No se encontró el ID del salón."
        );

        return;
    }

    if (
        !usuarioActualDashboard ||
        !usuarioActualDashboard._id
    ) {
        mostrarErrorInicial(
            "No se encontró una sesión de usuario válida."
        );

        return;
    }

    configurarFiltros();
    configurarTabla();
    configurarModalMatricula();

    await cargarDashboard();
}

function obtenerUsuarioSesion() {
    const datosSesion = localStorage.getItem(
        "sesionEscuelApp"
    );

    if (!datosSesion) {
        return null;
    }

    try {
        return JSON.parse(datosSesion);
    } catch (error) {
        console.error(
            "No fue posible interpretar la sesión:",
            error
        );

        return null;
    }
}

async function cargarDashboard() {
    mostrarMensajeDashboard(
        "Cargando información del salón...",
        "informacion"
    );

    establecerFilaMensaje(
        "Cargando estudiantes y tareas..."
    );

    try {
        const response = await fetch(
            `/Escuelapp/dashboard-data?idgrupo=${encodeURIComponent(
                idSalonDashboard
            )}`
        );

        const resultado = await response.json();

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible cargar el dashboard."
            );
        }

        salonDashboard = resultado.salon || null;

        datosDashboardCompletos = Array.isArray(
            resultado.data
        )
            ? resultado.data
            : [];

        datosDashboardFiltrados = [
            ...datosDashboardCompletos
        ];

        actualizarInformacionSalon(
            salonDashboard
        );

        actualizarResumen(
            resultado.resumen || {}
        );

        aplicarFiltros();
        ocultarMensajeDashboard();
    } catch (error) {
        console.error(
            "Error al cargar el dashboard:",
            error
        );

        datosDashboardCompletos = [];
        datosDashboardFiltrados = [];

        mostrarMensajeDashboard(
            error.message ||
            "Ocurrió un error al cargar el dashboard.",
            "error"
        );

        establecerFilaMensaje(
            "No fue posible cargar los datos."
        );
    }
}

function actualizarInformacionSalon(salon) {
    const elementoInformacion = document.getElementById(
        "dashboard-salon-info"
    );

    if (!elementoInformacion) {
        return;
    }

    if (!salon) {
        elementoInformacion.textContent =
            "No se pudo cargar la información del salón.";

        return;
    }

    const nombre =
        salon.nombre || "Salón sin nombre";

    const materia =
        salon.materia || "Materia sin especificar";

    const cupo =
        salon.cupo !== undefined &&
        salon.cupo !== null
            ? salon.cupo
            : "No disponible";

    elementoInformacion.textContent =
        `${nombre} · ${materia} · ` +
        `Cupos disponibles: ${cupo}`;
}

function actualizarResumen(resumen) {
    establecerTexto(
        "summary-students",
        resumen.estudiantesMatriculados || 0
    );

    establecerTexto(
        "summary-tasks",
        resumen.totalTareas || 0
    );

    establecerTexto(
        "summary-delivered",
        resumen.entregasRealizadas || 0
    );

    establecerTexto(
        "summary-pending",
        resumen.entregasPendientes || 0
    );
}

function establecerTexto(idElemento, valor) {
    const elemento = document.getElementById(
        idElemento
    );

    if (elemento) {
        elemento.textContent = String(valor);
    }
}

function configurarFiltros() {
    const filtroEstudiante =
        document.getElementById(
            "filter-student"
        );

    const filtroTarea =
        document.getElementById(
            "filter-task"
        );

    const filtroEstado =
        document.getElementById(
            "filter-status"
        );

    if (filtroEstudiante) {
        filtroEstudiante.addEventListener(
            "input",
            aplicarFiltros
        );
    }

    if (filtroTarea) {
        filtroTarea.addEventListener(
            "input",
            aplicarFiltros
        );
    }

    if (filtroEstado) {
        filtroEstado.addEventListener(
            "change",
            aplicarFiltros
        );
    }
}

function aplicarFiltros() {
    const valorEstudiante = normalizarBusqueda(
        obtenerValorElemento(
            "filter-student"
        )
    );

    const valorTarea = normalizarBusqueda(
        obtenerValorElemento(
            "filter-task"
        )
    );

    const valorEstado = obtenerValorElemento(
        "filter-status"
    );

    datosDashboardFiltrados =
        datosDashboardCompletos.filter(
            function (registro) {
                const contenidoEstudiante =
                    normalizarBusqueda(
                        `${registro.nombreEstudiante || ""} ` +
                        `${registro.cedulaEstudiante || ""}`
                    );

                const contenidoTarea =
                    normalizarBusqueda(
                        `${registro.nombreTarea || ""} ` +
                        `${registro.tema || ""}`
                    );

                const coincideEstudiante =
                    !valorEstudiante ||
                    contenidoEstudiante.includes(
                        valorEstudiante
                    );

                const coincideTarea =
                    !valorTarea ||
                    contenidoTarea.includes(
                        valorTarea
                    );

                const coincideEstado =
                    !valorEstado ||
                    registro.estadoEntrega ===
                        valorEstado;

                return (
                    coincideEstudiante &&
                    coincideTarea &&
                    coincideEstado
                );
            }
        );

    renderizarTabla(
        datosDashboardFiltrados
    );

    window.currentDashboardData = [
        ...datosDashboardFiltrados
    ];
}

function obtenerValorElemento(idElemento) {
    const elemento = document.getElementById(
        idElemento
    );

    return elemento
        ? elemento.value
        : "";
}

function normalizarBusqueda(valor) {
    return String(valor || "")
        .trim()
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function renderizarTabla(datos) {
    const cuerpoTabla = document.getElementById(
        "dashboard-body"
    );

    if (!cuerpoTabla) {
        return;
    }

    cuerpoTabla.replaceChildren();

    if (!Array.isArray(datos) || datos.length === 0) {
        const fila = crearFilaMensaje(
            datosDashboardCompletos.length === 0
                ? "No hay estudiantes matriculados en este salón."
                : "No hay resultados que coincidan con los filtros."
        );

        cuerpoTabla.appendChild(fila);
        return;
    }

    datos.forEach(function (registro) {
        cuerpoTabla.appendChild(
            crearFilaDashboard(registro)
        );
    });
}

function crearFilaDashboard(registro) {
    const fila = document.createElement("tr");

    fila.dataset.idEstudiante =
        registro.idEstudiante || "";

    fila.dataset.idTarea =
        registro.idTarea || "";

    fila.appendChild(
        crearCeldaEstudiante(registro)
    );

    fila.appendChild(
        crearCeldaTexto(
            registro.tema || "Sin tema",
            "celda-tema"
        )
    );

    fila.appendChild(
        crearCeldaTexto(
            registro.nombreTarea ||
            "Sin tareas disponibles",
            "celda-tarea"
        )
    );

    fila.appendChild(
        crearCeldaEstado(
            registro.estadoEntrega
        )
    );

    fila.appendChild(
        crearCeldaDocumento(registro)
    );

    fila.appendChild(
        crearCeldaTexto(
            formatearFechaEntrega(
                registro.fechaentrega
            ),
            "celda-fecha"
        )
    );

    fila.appendChild(
        crearCeldaCalificacion(registro)
    );

    fila.appendChild(
        crearCeldaAccion(registro)
    );

    return fila;
}

function crearCeldaEstudiante(registro) {
    const celda = document.createElement("td");
    const contenedor = document.createElement("div");
    const nombre = document.createElement("strong");
    const cedula = document.createElement("span");
    const estadoMatricula =
        document.createElement("span");

    contenedor.className =
        "student-cell-content";

    nombre.textContent =
        registro.nombreEstudiante ||
        "Estudiante sin nombre";

    cedula.textContent =
        registro.cedulaEstudiante ||
        "Sin cédula";

    cedula.className = "student-id";

    estadoMatricula.textContent =
        registro.estadoMatricula ||
        "Matriculado";

    estadoMatricula.className =
        "enrollment-status";

    contenedor.appendChild(nombre);
    contenedor.appendChild(cedula);
    contenedor.appendChild(
        estadoMatricula
    );

    celda.appendChild(contenedor);

    return celda;
}

function crearCeldaTexto(texto, claseCSS) {
    const celda = document.createElement("td");

    celda.textContent =
        texto !== undefined &&
        texto !== null &&
        String(texto).trim() !== ""
            ? String(texto)
            : "No disponible";

    if (claseCSS) {
        celda.className = claseCSS;
    }

    return celda;
}

function crearCeldaEstado(estado) {
    const celda = document.createElement("td");
    const indicador = document.createElement("span");

    const estadoNormalizado =
        estado || "Sin entregar";

    indicador.textContent =
        estadoNormalizado;

    indicador.className =
        `delivery-status ${obtenerClaseEstado(
            estadoNormalizado
        )}`;

    celda.appendChild(indicador);

    return celda;
}

function obtenerClaseEstado(estado) {
    switch (estado) {
        case "Calificada":
            return "status-graded";

        case "Entregada":
            return "status-delivered";

        case "Sin tareas":
            return "status-no-tasks";

        default:
            return "status-pending";
    }
}

function crearCeldaDocumento(registro) {
    const celda = document.createElement("td");

    if (
        registro.docentrega &&
        esURLValida(registro.docentrega)
    ) {
        const enlace = document.createElement("a");

        enlace.href = registro.docentrega;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.textContent = "Ver entrega";
        enlace.className = "submission-link";

        celda.appendChild(enlace);
        return celda;
    }

    const texto = document.createElement("span");

    texto.textContent =
        registro.estadoEntrega === "Sin tareas"
            ? "No aplica"
            : "No disponible";

    texto.className = "empty-value";

    celda.appendChild(texto);

    return celda;
}

function crearCeldaCalificacion(registro) {
    const celda = document.createElement("td");

    if (!registro.idEntrega) {
        celda.appendChild(
            crearTextoNoDisponible(
                registro.estadoEntrega ===
                    "Sin tareas"
                    ? "No aplica"
                    : "Sin calificar"
            )
        );

        return celda;
    }

    const input = document.createElement("input");

    input.type = "number";
    input.className = "nota-input";
    input.min = "0";
    input.max = "100";
    input.step = "1";
    input.value =
        registro.nota !== null &&
        registro.nota !== undefined
            ? registro.nota
            : "";

    input.placeholder = "0-100";
    input.dataset.id =
        registro.idEntrega;

    const puedeCalificar =
        Boolean(registro.docentrega);

    input.disabled = !puedeCalificar;

    input.setAttribute(
        "aria-label",
        `Calificación de ${
            registro.nombreEstudiante
        } en ${registro.nombreTarea}`
    );

    celda.appendChild(input);

    return celda;
}

function crearCeldaAccion(registro) {
    const celda = document.createElement("td");

    if (
        !registro.idEntrega ||
        !registro.docentrega
    ) {
        celda.appendChild(
            crearTextoNoDisponible("No disponible")
        );

        return celda;
    }

    const boton = document.createElement("button");

    boton.type = "button";
    boton.className =
        "save-grade-button";

    boton.textContent = "Guardar";
    boton.dataset.id =
        registro.idEntrega;

    boton.setAttribute(
        "aria-label",
        `Guardar calificación de ${
            registro.nombreEstudiante
        }`
    );

    celda.appendChild(boton);

    return celda;
}

function crearTextoNoDisponible(texto) {
    const elemento =
        document.createElement("span");

    elemento.textContent = texto;
    elemento.className = "empty-value";

    return elemento;
}

function configurarTabla() {
    const cuerpoTabla = document.getElementById(
        "dashboard-body"
    );

    if (!cuerpoTabla) {
        return;
    }

    cuerpoTabla.addEventListener(
        "click",
        async function (event) {
            const boton = event.target.closest(
                ".save-grade-button"
            );

            if (!boton) {
                return;
            }

            await guardarCalificacion(boton);
        }
    );
}

async function guardarCalificacion(boton) {
    const idEntrega = boton.dataset.id;

    const input = document.querySelector(
        `.nota-input[data-id="${escaparSelectorCSS(
            idEntrega
        )}"]`
    );

    if (!input) {
        alert(
            "No se encontró el campo de calificación."
        );

        return;
    }

    const valorNota = input.value.trim();

    if (valorNota === "") {
        alert(
            "Escribe una calificación antes de guardar."
        );

        input.focus();
        return;
    }

    const notaNumerica = Number(valorNota);

    if (
        !Number.isFinite(notaNumerica) ||
        notaNumerica < 0 ||
        notaNumerica > 100
    ) {
        alert(
            "La calificación debe estar entre 0 y 100."
        );

        input.focus();
        return;
    }

    boton.disabled = true;
    boton.textContent = "Guardando...";

    try {
        const response = await fetch(
            "/Escuelapp/update-nota",
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    idEntrega,
                    nuevaNota: notaNumerica,
                    idCalificador:
                        usuarioActualDashboard._id
                })
            }
        );

        const resultado = await response.json();

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible guardar la calificación."
            );
        }

        actualizarRegistroLocal(
            idEntrega,
            notaNumerica
        );

        input.value = String(notaNumerica);
        boton.textContent = "Guardado ✓";

        mostrarMensajeDashboard(
            resultado.message ||
            "Calificación guardada correctamente.",
            "exito"
        );

        setTimeout(function () {
            boton.textContent = "Guardar";
            boton.disabled = false;
        }, 1600);

        setTimeout(function () {
            ocultarMensajeDashboard();
        }, 3000);
    } catch (error) {
        console.error(
            "Error al guardar la calificación:",
            error
        );

        boton.disabled = false;
        boton.textContent = "Guardar";

        alert(
            `No se pudo guardar la calificación. ${error.message}`
        );
    }
}

function actualizarRegistroLocal(
    idEntrega,
    nota
) {
    datosDashboardCompletos.forEach(
        function (registro) {
            if (
                String(registro.idEntrega) ===
                String(idEntrega)
            ) {
                registro.nota = String(nota);
                registro.estadoEntrega =
                    "Calificada";
            }
        }
    );

    aplicarFiltros();

    const entregasCalificadas =
        datosDashboardCompletos.filter(
            function (registro) {
                return registro.estadoEntrega ===
                    "Calificada";
            }
        ).length;

    const entregasConDocumento =
        datosDashboardCompletos.filter(
            function (registro) {
                return Boolean(
                    registro.docentrega
                );
            }
        ).length;

    establecerTexto(
        "summary-delivered",
        entregasConDocumento
    );

    const pendientes =
        datosDashboardCompletos.filter(
            function (registro) {
                return registro.estadoEntrega ===
                    "Sin entregar";
            }
        ).length;

    establecerTexto(
        "summary-pending",
        pendientes
    );

    return entregasCalificadas;
}

function configurarModalMatricula() {
    const botonAbrir = document.getElementById(
        "open-enrollment-button"
    );

    const botonCerrar = document.getElementById(
        "close-enrollment-dialog"
    );

    const botonCancelar =
        document.getElementById(
            "cancel-enrollment-button"
        );

    const dialogo = document.getElementById(
        "enrollment-dialog"
    );

    const campoBusqueda =
        document.getElementById(
            "enrollment-student-search"
        );

    if (botonAbrir) {
        botonAbrir.addEventListener(
            "click",
            abrirModalMatricula
        );
    }

    if (botonCerrar) {
        botonCerrar.addEventListener(
            "click",
            cerrarModalMatricula
        );
    }

    if (botonCancelar) {
        botonCancelar.addEventListener(
            "click",
            cerrarModalMatricula
        );
    }

    if (campoBusqueda) {
        campoBusqueda.addEventListener(
            "input",
            renderizarEstudiantesMatricula
        );
    }

    if (dialogo) {
        dialogo.addEventListener(
            "click",
            function (event) {
                if (event.target === dialogo) {
                    cerrarModalMatricula();
                }
            }
        );
    }

    const listaEstudiantes =
        document.getElementById(
            "enrollment-student-list"
        );

    if (listaEstudiantes) {
        listaEstudiantes.addEventListener(
            "click",
            async function (event) {
                const botonMatricular =
                    event.target.closest(
                        ".student-enroll-button"
                    );

                if (!botonMatricular) {
                    return;
                }

                await matricularEstudiante(
                    botonMatricular
                );
            }
        );
    }
}

async function abrirModalMatricula() {
    const dialogo = document.getElementById(
        "enrollment-dialog"
    );

    if (!dialogo) {
        return;
    }

    limpiarMensajeMatricula();

    const campoBusqueda =
        document.getElementById(
            "enrollment-student-search"
        );

    if (campoBusqueda) {
        campoBusqueda.value = "";
    }

    dialogo.showModal();

    await cargarDatosMatricula();

    if (campoBusqueda) {
        campoBusqueda.focus();
    }
}

function cerrarModalMatricula() {
    const dialogo = document.getElementById(
        "enrollment-dialog"
    );

    if (dialogo && dialogo.open) {
        dialogo.close();
    }
}

async function cargarDatosMatricula() {
    const lista = document.getElementById(
        "enrollment-student-list"
    );

    if (lista) {
        lista.innerHTML =
            '<p class="empty-student-list">Cargando estudiantes...</p>';
    }

    try {
        const [
            respuestaUsuarios,
            respuestaMatriculas
        ] = await Promise.all([
            fetch("/Escuelapp/returnUser?rol=3"),

            fetch(
                `/Escuelapp/returnEstudiantesDeGrupo` +
                `?idGrupo=${encodeURIComponent(
                    idSalonDashboard
                )}` +
                "&incluirRetirados=true"
            )
        ]);

        const usuarios =
            await respuestaUsuarios.json();

        const resultadoMatriculas =
            await respuestaMatriculas.json();

        if (!respuestaUsuarios.ok) {
            throw new Error(
                usuarios.message ||
                "No fue posible consultar los estudiantes."
            );
        }

        if (
            !respuestaMatriculas.ok ||
            !resultadoMatriculas.success
        ) {
            throw new Error(
                resultadoMatriculas.message ||
                "No fue posible consultar las matrículas."
            );
        }

        estudiantesDisponibles =
            Array.isArray(usuarios)
                ? usuarios
                : [];

        matriculasDelSalon =
            Array.isArray(
                resultadoMatriculas.data
            )
                ? resultadoMatriculas.data
                : [];

        renderizarEstudiantesMatricula();
    } catch (error) {
        console.error(
            "Error al cargar estudiantes para matrícula:",
            error
        );

        mostrarMensajeMatricula(
            error.message ||
            "No se pudieron cargar los estudiantes.",
            "error"
        );

        if (lista) {
            lista.innerHTML =
                '<p class="empty-student-list">No fue posible cargar la lista.</p>';
        }
    }
}

function renderizarEstudiantesMatricula() {
    const lista = document.getElementById(
        "enrollment-student-list"
    );

    if (!lista) {
        return;
    }

    const termino = normalizarBusqueda(
        obtenerValorElemento(
            "enrollment-student-search"
        )
    );

    const estudiantesFiltrados =
        estudiantesDisponibles.filter(
            function (estudiante) {
                const contenido =
                    normalizarBusqueda(
                        `${estudiante.nombre || ""} ` +
                        `${estudiante.cedula || ""}`
                    );

                return (
                    !termino ||
                    contenido.includes(termino)
                );
            }
        );

    lista.replaceChildren();

    if (estudiantesFiltrados.length === 0) {
        const mensaje =
            document.createElement("p");

        mensaje.className =
            "empty-student-list";

        mensaje.textContent =
            "No se encontraron estudiantes.";

        lista.appendChild(mensaje);
        return;
    }

    estudiantesFiltrados.forEach(
        function (estudiante) {
            lista.appendChild(
                crearTarjetaEstudianteMatricula(
                    estudiante
                )
            );
        }
    );
}

function crearTarjetaEstudianteMatricula(
    estudiante
) {
    const tarjeta = document.createElement("article");
    const informacion = document.createElement("div");
    const nombre = document.createElement("strong");
    const cedula = document.createElement("span");
    const boton = document.createElement("button");

    tarjeta.className =
        "enrollment-student-card";

    informacion.className =
        "enrollment-student-info";

    nombre.textContent =
        estudiante.nombre ||
        "Estudiante sin nombre";

    cedula.textContent =
        `Cédula: ${
            estudiante.cedula ||
            "No disponible"
        }`;

    const matricula =
        buscarMatriculaEstudiante(
            estudiante._id
        );

    boton.type = "button";
    boton.dataset.studentId =
        estudiante._id;

    if (
        matricula &&
        matricula.status !== "Retirado"
    ) {
        boton.textContent = "Ya matriculado";
        boton.className =
            "student-enroll-button already-enrolled";
        boton.disabled = true;
    } else if (
        matricula &&
        matricula.status === "Retirado"
    ) {
        boton.textContent =
            "Reactivar matrícula";

        boton.className =
            "student-enroll-button reactivate";
    } else {
        boton.textContent = "Matricular";
        boton.className =
            "student-enroll-button";
    }

    informacion.appendChild(nombre);
    informacion.appendChild(cedula);

    tarjeta.appendChild(informacion);
    tarjeta.appendChild(boton);

    return tarjeta;
}

function buscarMatriculaEstudiante(
    idEstudiante
) {
    return matriculasDelSalon.find(
        function (matricula) {
            return String(
                matricula.idestudiante
            ) === String(idEstudiante);
        }
    );
}

async function matricularEstudiante(boton) {
    const idEstudiante =
        boton.dataset.studentId;

    if (!idEstudiante) {
        return;
    }

    boton.disabled = true;
    boton.textContent = "Procesando...";

    limpiarMensajeMatricula();

    try {
        const response = await fetch(
            "/Escuelapp/Matricular",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    idgrupo: idSalonDashboard,
                    idEstudiante,
                    idProfesor:
                        usuarioActualDashboard._id
                })
            }
        );

        const resultado = await response.json();

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible matricular al estudiante."
            );
        }

        mostrarMensajeMatricula(
            resultado.message ||
            "Estudiante matriculado correctamente.",
            "exito"
        );

        await cargarDashboard();
        await cargarDatosMatricula();
    } catch (error) {
        console.error(
            "Error al matricular estudiante:",
            error
        );

        boton.disabled = false;
        boton.textContent = "Matricular";

        mostrarMensajeMatricula(
            error.message ||
            "No se pudo completar la matrícula.",
            "error"
        );
    }
}

function formatearFechaEntrega(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    const fechaEntrega = new Date(fecha);

    if (
        Number.isNaN(fechaEntrega.getTime())
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

function esURLValida(valor) {
    if (
        typeof valor !== "string" ||
        !valor.trim()
    ) {
        return false;
    }

    try {
        const url = new URL(valor.trim());

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );
    } catch (error) {
        return false;
    }
}

function escaparSelectorCSS(valor) {
    if (
        window.CSS &&
        typeof window.CSS.escape === "function"
    ) {
        return window.CSS.escape(
            String(valor)
        );
    }

    return String(valor).replace(
        /["\\]/g,
        "\\$&"
    );
}

function crearFilaMensaje(texto) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 8;
    celda.className = "table-message";
    celda.textContent = texto;

    fila.appendChild(celda);

    return fila;
}

function establecerFilaMensaje(texto) {
    const cuerpoTabla = document.getElementById(
        "dashboard-body"
    );

    if (!cuerpoTabla) {
        return;
    }

    cuerpoTabla.replaceChildren(
        crearFilaMensaje(texto)
    );
}

function mostrarErrorInicial(mensaje) {
    mostrarMensajeDashboard(
        mensaje,
        "error"
    );

    establecerFilaMensaje(mensaje);

    alert(mensaje);
}

function mostrarMensajeDashboard(
    mensaje,
    tipo
) {
    const elemento = document.getElementById(
        "dashboard-message"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = false;
    elemento.textContent = mensaje;
    elemento.className =
        `dashboard-message message-${tipo}`;
}

function ocultarMensajeDashboard() {
    const elemento = document.getElementById(
        "dashboard-message"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = true;
    elemento.textContent = "";
}

function mostrarMensajeMatricula(
    mensaje,
    tipo
) {
    const elemento = document.getElementById(
        "enrollment-message"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = false;
    elemento.textContent = mensaje;
    elemento.className =
        `enrollment-message message-${tipo}`;
}

function limpiarMensajeMatricula() {
    const elemento = document.getElementById(
        "enrollment-message"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = true;
    elemento.textContent = "";
}
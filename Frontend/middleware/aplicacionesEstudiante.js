document.addEventListener("DOMContentLoaded", function () {
    inicializarAplicacionesEstudiante();
});

let aplicacionesSalonEstudiante = [];

async function inicializarAplicacionesEstudiante() {
    const botonAplicaciones = document.getElementById(
        "my-button"
    );

    const panelAplicaciones = document.getElementById(
        "my-list"
    );

    const botonCerrar = document.getElementById(
        "cerrar-panel-apps"
    );

    if (!botonAplicaciones || !panelAplicaciones) {
        console.error(
            "No se encontró la estructura de aplicaciones del salón."
        );

        return;
    }

    botonAplicaciones.addEventListener(
        "click",
        alternarPanelAplicaciones
    );

    if (botonCerrar) {
        botonCerrar.addEventListener(
            "click",
            cerrarPanelAplicaciones
        );
    }

    document.addEventListener(
        "click",
        cerrarPanelAlPulsarFuera
    );

    document.addEventListener(
        "keydown",
        cerrarPanelConEscape
    );

    const idSalon = obtenerIdSalonActual();
    const sesion = obtenerSesionLocal();

    if (!idSalon) {
        mostrarMensajePanelAplicaciones(
            "No fue posible identificar el salón actual.",
            "error"
        );

        botonAplicaciones.disabled = true;
        return;
    }

    if (!sesion || !sesion._id) {
        mostrarMensajePanelAplicaciones(
            "No se encontró una sesión válida.",
            "error"
        );

        botonAplicaciones.disabled = true;
        return;
    }

    await cargarAplicacionesDelSalon(
        idSalon,
        sesion._id
    );
}

async function cargarAplicacionesDelSalon(
    idSalon,
    idUsuario
) {
    mostrarMensajePanelAplicaciones(
        "Cargando aplicaciones...",
        "informacion"
    );

    try {
        const url =
            "/Escuelapp/GetAplicacionesSalon" +
            `?idgrupo=${encodeURIComponent(idSalon)}` +
            `&idusuario=${encodeURIComponent(idUsuario)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible consultar las aplicaciones del salón."
            );
        }

        aplicacionesSalonEstudiante = Array.isArray(
            resultado.aplicaciones
        )
            ? resultado.aplicaciones
            : [];

        renderizarAplicacionesDelSalon(
            aplicacionesSalonEstudiante
        );

        actualizarEstadoBotonAplicaciones(
            aplicacionesSalonEstudiante.length
        );
    } catch (error) {
        console.error(
            "Error al cargar las aplicaciones del salón:",
            error
        );

        aplicacionesSalonEstudiante = [];

        mostrarMensajePanelAplicaciones(
            error.message ||
            "No fue posible cargar las aplicaciones del salón.",
            "error"
        );

        actualizarEstadoBotonAplicaciones(0);
    }
}

function renderizarAplicacionesDelSalon(
    aplicaciones
) {
    const lista = document.getElementById(
        "lista-aplicaciones-salon-estudiante"
    );

    if (!lista) {
        return;
    }

    lista.replaceChildren();

    if (aplicaciones.length === 0) {
        const mensaje = document.createElement("p");

        mensaje.className = "mensaje-panel-apps";
        mensaje.textContent =
            "Este salón no tiene aplicaciones asignadas.";

        lista.appendChild(mensaje);
        return;
    }

    aplicaciones.forEach(function (aplicacion) {
        lista.appendChild(
            crearAplicacionFlotante(aplicacion)
        );
    });
}

function crearAplicacionFlotante(aplicacion) {
    const enlaceNormalizado = normalizarEnlace(
        aplicacion.link
    );

    const nombreAplicacion =
        aplicacion.nombre ||
        "Aplicación sin nombre";

    const enlace = document.createElement("a");

    enlace.className = "app-flotante-item";
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.title = `Abrir ${nombreAplicacion}`;

    enlace.setAttribute(
        "aria-label",
        `Abrir ${nombreAplicacion} en una pestaña nueva`
    );

    if (enlaceNormalizado) {
        enlace.href = enlaceNormalizado;
    } else {
        enlace.href = "#";
        enlace.classList.add("app-flotante-sin-enlace");
        enlace.setAttribute("aria-disabled", "true");

        enlace.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
            }
        );
    }

    const imagen = document.createElement("img");

    imagen.className = "imagen-app-flotante";
    imagen.src =
        aplicacion.imagen ||
        "../Assets/materia.png";
    imagen.alt = `Imagen de ${nombreAplicacion}`;
    imagen.loading = "lazy";

    imagen.addEventListener(
        "error",
        function () {
            imagen.src = "../Assets/materia.png";
        },
        {
            once: true
        }
    );

    const informacion = document.createElement("span");

    informacion.className = "informacion-app-flotante";

    const nombre = document.createElement("strong");

    nombre.className = "nombre-app-flotante";
    nombre.textContent = nombreAplicacion;

    const dominio = document.createElement("small");

    dominio.className = "dominio-app-flotante";
    dominio.textContent = obtenerDominio(
        enlaceNormalizado
    );

    informacion.appendChild(nombre);
    informacion.appendChild(dominio);

    const indicador = document.createElement("span");

    indicador.className = "indicador-app-flotante";
    indicador.textContent = enlaceNormalizado
        ? "Abrir"
        : "Sin enlace";
    indicador.setAttribute("aria-hidden", "true");

    enlace.appendChild(imagen);
    enlace.appendChild(informacion);
    enlace.appendChild(indicador);

    return enlace;
}

function alternarPanelAplicaciones(event) {
    event.stopPropagation();

    const boton = document.getElementById(
        "my-button"
    );

    const panel = document.getElementById(
        "my-list"
    );

    if (!boton || !panel) {
        return;
    }

    const estaAbierto = !panel.hidden;

    if (estaAbierto) {
        cerrarPanelAplicaciones();
    } else {
        abrirPanelAplicaciones();
    }
}

function abrirPanelAplicaciones() {
    const boton = document.getElementById(
        "my-button"
    );

    const panel = document.getElementById(
        "my-list"
    );

    if (!boton || !panel) {
        return;
    }

    panel.hidden = false;
    boton.setAttribute("aria-expanded", "true");
    boton.setAttribute(
        "aria-label",
        "Ocultar aplicaciones del salón"
    );
}

function cerrarPanelAplicaciones() {
    const boton = document.getElementById(
        "my-button"
    );

    const panel = document.getElementById(
        "my-list"
    );

    if (!boton || !panel) {
        return;
    }

    panel.hidden = true;
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute(
        "aria-label",
        "Mostrar aplicaciones del salón"
    );
}

function cerrarPanelAlPulsarFuera(event) {
    const contenedor = document.querySelector(
        ".contenedor-apps-salon"
    );

    const panel = document.getElementById(
        "my-list"
    );

    if (
        !contenedor ||
        !panel ||
        panel.hidden
    ) {
        return;
    }

    if (!contenedor.contains(event.target)) {
        cerrarPanelAplicaciones();
    }
}

function cerrarPanelConEscape(event) {
    if (event.key !== "Escape") {
        return;
    }

    const panel = document.getElementById(
        "my-list"
    );

    if (panel && !panel.hidden) {
        cerrarPanelAplicaciones();

        document.getElementById(
            "my-button"
        )?.focus();
    }
}

function mostrarMensajePanelAplicaciones(
    mensaje,
    tipo
) {
    const lista = document.getElementById(
        "lista-aplicaciones-salon-estudiante"
    );

    if (!lista) {
        return;
    }

    const elemento = document.createElement("p");

    elemento.className =
        `mensaje-panel-apps mensaje-panel-${tipo}`;
    elemento.textContent = mensaje;

    lista.replaceChildren(elemento);
}

function actualizarEstadoBotonAplicaciones(
    cantidad
) {
    const boton = document.getElementById(
        "my-button"
    );

    if (!boton) {
        return;
    }

    boton.dataset.cantidad = String(cantidad);
    boton.title = cantidad === 1
        ? "1 aplicación disponible"
        : `${cantidad} aplicaciones disponibles`;

    boton.setAttribute(
        "aria-description",
        cantidad === 1
            ? "Hay 1 aplicación asignada a este salón."
            : `Hay ${cantidad} aplicaciones asignadas a este salón.`
    );
}

function obtenerIdSalonActual() {
    const parametros = new URLSearchParams(
        window.location.search
    );

    return (
        parametros.get("id") ||
        parametros.get("idgrupo") ||
        parametros.get("idGrupo") ||
        null
    );
}

function obtenerSesionLocal() {
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

async function leerRespuestaJSON(response) {
    const tipoContenido =
        response.headers.get("content-type") || "";

    if (!tipoContenido.includes("application/json")) {
        throw new Error(
            "El servidor devolvió una respuesta inesperada."
        );
    }

    return response.json();
}

function normalizarEnlace(valor) {
    if (
        typeof valor !== "string" ||
        !valor.trim()
    ) {
        return "";
    }

    const enlace = valor.trim();

    if (
        enlace.startsWith("http://") ||
        enlace.startsWith("https://")
    ) {
        return enlace;
    }

    return `https://${enlace}`;
}

function obtenerDominio(enlace) {
    if (!enlace) {
        return "Enlace no disponible";
    }

    try {
        const url = new URL(enlace);

        return url.hostname.replace(
            /^www\./,
            ""
        );
    } catch (error) {
        return "Recurso digital";
    }
}

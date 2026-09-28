document.addEventListener("DOMContentLoaded", function () {
    inicializarAplicacionesSalon();
});

async function inicializarAplicacionesSalon() {
    const seccionAplicaciones = document.getElementById(
        "aplicaciones-salon"
    );

    const listaAplicaciones = document.getElementById(
        "lista-aplicaciones-salon"
    );

    if (!seccionAplicaciones || !listaAplicaciones) {
        return;
    }

    const idSalon = obtenerIdSalonActual();
    const usuario = obtenerSesionAplicaciones();

    configurarBotonAlternarAplicaciones();
    configurarBotonGestionarAplicaciones(idSalon);

    if (!idSalon) {
        mostrarMensajeAplicaciones(
            "No fue posible identificar el salón."
        );

        return;
    }

    if (!usuario || !usuario._id) {
        mostrarMensajeAplicaciones(
            "No se encontró una sesión válida."
        );

        return;
    }

    await cargarAplicacionesAsignadas(
        idSalon,
        usuario._id
    );
}

async function cargarAplicacionesAsignadas(
    idSalon,
    idUsuario
) {
    mostrarMensajeAplicaciones(
        "Cargando aplicaciones..."
    );

    try {
        const url =
            "/Escuelapp/GetAplicacionesSalon" +
            `?idgrupo=${encodeURIComponent(idSalon)}` +
            `&idusuario=${encodeURIComponent(idUsuario)}`;

        const response = await fetch(url);

        const resultado = await leerRespuestaAplicaciones(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible cargar las aplicaciones."
            );
        }

        const aplicaciones = Array.isArray(
            resultado.aplicaciones
        )
            ? resultado.aplicaciones
            : [];

        renderizarAplicacionesSalon(
            aplicaciones
        );
    } catch (error) {
        console.error(
            "Error al cargar las aplicaciones del salón:",
            error
        );

        mostrarMensajeAplicaciones(
            error.message ||
            "No fue posible cargar las aplicaciones del salón."
        );
    }
}

function renderizarAplicacionesSalon(aplicaciones) {
    const listaAplicaciones = document.getElementById(
        "lista-aplicaciones-salon"
    );

    if (!listaAplicaciones) {
        return;
    }

    listaAplicaciones.replaceChildren();

    if (aplicaciones.length === 0) {
        mostrarMensajeAplicaciones(
            "Este salón no tiene aplicaciones asignadas."
        );

        return;
    }

    aplicaciones.forEach(function (aplicacion) {
        const tarjeta = crearTarjetaAplicacionSalon(
            aplicacion
        );

        listaAplicaciones.appendChild(tarjeta);
    });
}

function crearTarjetaAplicacionSalon(aplicacion) {
    const enlace = document.createElement("a");

    enlace.className = "tarjeta-aplicacion-salon";
    enlace.href = normalizarEnlaceAplicacion(
        aplicacion.link
    );
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";

    const nombreAplicacion =
        aplicacion.nombre ||
        "Aplicación sin nombre";

    enlace.setAttribute(
        "aria-label",
        `Abrir ${nombreAplicacion} en una pestaña nueva`
    );

    enlace.title =
        `Abrir ${nombreAplicacion}`;

    if (!enlace.href || enlace.href.endsWith("#")) {
        enlace.href = "#";
        enlace.classList.add(
            "aplicacion-sin-enlace"
        );

        enlace.setAttribute(
            "aria-disabled",
            "true"
        );

        enlace.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
            }
        );
    }

    const contenedorImagen =
        document.createElement("span");

    contenedorImagen.className =
        "contenedor-imagen-aplicacion-salon";

    const imagen = document.createElement("img");

    imagen.className =
        "imagen-aplicacion-salon";

    imagen.src =
        aplicacion.imagen ||
        "../Assets/materia.png";

    imagen.alt =
        `Imagen de ${nombreAplicacion}`;

    imagen.loading = "lazy";

    imagen.addEventListener(
        "error",
        function () {
            imagen.src =
                "../Assets/materia.png";
        },
        {
            once: true
        }
    );

    contenedorImagen.appendChild(imagen);

    const informacion =
        document.createElement("span");

    informacion.className =
        "informacion-aplicacion-salon";

    const nombre = document.createElement("strong");

    nombre.className =
        "nombre-aplicacion-salon";

    nombre.textContent =
        nombreAplicacion;

    const dominio = document.createElement("span");

    dominio.className =
        "dominio-aplicacion-salon";

    dominio.textContent =
        obtenerDominioAplicacion(
            aplicacion.link
        );

    informacion.appendChild(nombre);
    informacion.appendChild(dominio);

    const indicadorAbrir =
        document.createElement("span");

    indicadorAbrir.className =
        "indicador-abrir-aplicacion";

    indicadorAbrir.textContent = "Abrir";

    indicadorAbrir.setAttribute(
        "aria-hidden",
        "true"
    );

    enlace.appendChild(contenedorImagen);
    enlace.appendChild(informacion);
    enlace.appendChild(indicadorAbrir);

    return enlace;
}

function configurarBotonAlternarAplicaciones() {
    const botonAlternar = document.getElementById(
        "alternar-aplicaciones-salon"
    );

    const listaAplicaciones = document.getElementById(
        "lista-aplicaciones-salon"
    );

    if (!botonAlternar || !listaAplicaciones) {
        return;
    }

    botonAlternar.addEventListener(
        "click",
        function () {
            const estaExpandida =
                botonAlternar.getAttribute(
                    "aria-expanded"
                ) === "true";

            const nuevaExpansion =
                !estaExpandida;

            botonAlternar.setAttribute(
                "aria-expanded",
                String(nuevaExpansion)
            );

            listaAplicaciones.hidden =
                !nuevaExpansion;

            botonAlternar.textContent =
                nuevaExpansion
                    ? "Ocultar"
                    : "Mostrar";
        }
    );
}

function configurarBotonGestionarAplicaciones(
    idSalon
) {
    const botonGestionar = document.getElementById(
        "gestionar-aplicaciones-salon"
    );

    if (!botonGestionar) {
        return;
    }

    if (!idSalon) {
        botonGestionar.disabled = true;
        return;
    }

    botonGestionar.addEventListener(
        "click",
        function () {
            window.location.href =
                "./Gestionar_aplicaciones_salon.html" +
                `?id=${encodeURIComponent(idSalon)}`;
        }
    );
}

function obtenerIdSalonActual() {
    const parametros = new URLSearchParams(
        window.location.search
    );

    const idSalonURL =
        parametros.get("id") ||
        parametros.get("idgrupo") ||
        parametros.get("idGrupo");

    if (idSalonURL) {
        return idSalonURL;
    }

    const salonGuardado = localStorage.getItem(
        "salonelegido"
    );

    if (!salonGuardado) {
        return null;
    }

    try {
        const salon = JSON.parse(
            salonGuardado
        );

        if (
            salon &&
            typeof salon === "object"
        ) {
            return (
                salon._id ||
                salon.id ||
                salon.idgrupo ||
                null
            );
        }

        if (typeof salon === "string") {
            return salon;
        }
    } catch (error) {
        return salonGuardado;
    }

    return null;
}

function obtenerSesionAplicaciones() {
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

function mostrarMensajeAplicaciones(mensaje) {
    const listaAplicaciones = document.getElementById(
        "lista-aplicaciones-salon"
    );

    if (!listaAplicaciones) {
        return;
    }

    const elementoMensaje =
        document.createElement("p");

    elementoMensaje.className =
        "mensaje-aplicaciones-salon";

    elementoMensaje.textContent =
        mensaje;

    listaAplicaciones.replaceChildren(
        elementoMensaje
    );
}

async function leerRespuestaAplicaciones(response) {
    const tipoContenido =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        !tipoContenido.includes(
            "application/json"
        )
    ) {
        throw new Error(
            "El servidor devolvió una respuesta inesperada."
        );
    }

    return response.json();
}

function normalizarEnlaceAplicacion(valor) {
    if (
        typeof valor !== "string" ||
        !valor.trim()
    ) {
        return "#";
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

function obtenerDominioAplicacion(valor) {
    const enlace = normalizarEnlaceAplicacion(
        valor
    );

    if (enlace === "#") {
        return "Enlace no disponible";
    }

    try {
        const url = new URL(enlace);

        return url.hostname.replace(
            /^www\./,
            ""
        );
    } catch (error) {
        return "Abrir recurso digital";
    }
}
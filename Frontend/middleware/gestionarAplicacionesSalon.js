document.addEventListener("DOMContentLoaded", function () {
    inicializarGestionAplicaciones();
});

let sesionProfesor = null;
let salonesProfesor = [];
let salonSeleccionado = null;
let aplicacionesAsignadas = [];
let aplicacionesDisponibles = [];

async function inicializarGestionAplicaciones() {
    sesionProfesor = obtenerSesionLocal();

    if (
        !sesionProfesor ||
        !sesionProfesor._id
    ) {
        cerrarSesionYRedirigir(
            "No se encontró una sesión válida."
        );

        return;
    }

    if (Number(sesionProfesor.rol) !== 2) {
        alert(
            "Esta pantalla es exclusiva para profesores."
        );

        redirigirSegunRol(
            sesionProfesor.rol
        );

        return;
    }

    mostrarNombreUsuario(
        sesionProfesor.nombre
    );

    configurarSelectorSalon();
    configurarFiltros();
    configurarListasAplicaciones();
    configurarVistaPrevia();
    configurarBotonesGenerales();

    await cargarSalonesProfesor();
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
            "No fue posible interpretar los datos de la sesión:",
            error
        );

        return null;
    }
}

function mostrarNombreUsuario(nombre) {
    const elementoNombre = document.getElementById(
        "username"
    );

    if (!elementoNombre) {
        return;
    }

    elementoNombre.textContent =
        nombre || "Profesor";
}

function configurarSelectorSalon() {
    const selector = document.getElementById(
        "selector-salon-aplicaciones"
    );

    if (!selector) {
        return;
    }

    selector.addEventListener(
        "change",
        async function () {
            const idSalon = selector.value;

            salonSeleccionado =
                salonesProfesor.find(
                    function (salon) {
                        return (
                            String(salon._id) ===
                            String(idSalon)
                        );
                    }
                ) || null;

            limpiarAplicaciones();

            if (!salonSeleccionado) {
                ocultarResumenSalon();
                deshabilitarControles(true);

                mostrarMensajeListasIniciales(
                    "Selecciona un salón para consultar sus aplicaciones."
                );

                return;
            }

            actualizarResumenSalon();
            deshabilitarControles(false);

            await cargarAplicacionesSalon();
        }
    );
}

async function cargarSalonesProfesor() {
    const selector = document.getElementById(
        "selector-salon-aplicaciones"
    );

    if (!selector) {
        return;
    }

    selector.disabled = true;

    selector.innerHTML =
        '<option value="">Cargando salones...</option>';

    try {
        const response = await fetch(
            "/Escuelapp/ReturnSalonsByProfessor" +
            `?idprofesor=${encodeURIComponent(
                sesionProfesor._id
            )}`
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible consultar los salones."
            );
        }

        salonesProfesor = Array.isArray(
            resultado.SalonData
        )
            ? resultado.SalonData
            : [];

        renderizarOpcionesSalones();
    } catch (error) {
        console.error(
            "Error al cargar los salones del profesor:",
            error
        );

        salonesProfesor = [];

        selector.innerHTML =
            '<option value="">No fue posible cargar los salones</option>';

        mostrarMensajeGestion(
            error.message ||
            "No fue posible cargar los salones.",
            "error"
        );
    } finally {
        selector.disabled = false;
    }
}

function renderizarOpcionesSalones() {
    const selector = document.getElementById(
        "selector-salon-aplicaciones"
    );

    if (!selector) {
        return;
    }

    selector.replaceChildren();

    const opcionInicial =
        document.createElement("option");

    opcionInicial.value = "";

    opcionInicial.textContent =
        salonesProfesor.length > 0
            ? "Selecciona un salón"
            : "No tienes salones registrados";

    selector.appendChild(opcionInicial);

    salonesProfesor.forEach(
        function (salon) {
            const opcion =
                document.createElement("option");

            opcion.value = salon._id;

            const nombre =
                salon.nombre ||
                "Salón sin nombre";

            const materia =
                salon.materia ||
                "Materia sin especificar";

            opcion.textContent =
                `${nombre} · ${materia}`;

            selector.appendChild(opcion);
        }
    );
}

async function cargarAplicacionesSalon() {
    if (!salonSeleccionado) {
        return;
    }

    mostrarMensajeGestion(
        "Cargando aplicaciones del salón...",
        "informacion"
    );

    establecerMensajeLista(
        "lista-aplicaciones-asignadas",
        "Cargando aplicaciones asignadas..."
    );

    establecerMensajeLista(
        "lista-aplicaciones-disponibles",
        "Cargando catálogo de aplicaciones..."
    );

    try {
        const url =
            "/Escuelapp/GetAplicacionesSalon" +
            `?idgrupo=${encodeURIComponent(
                salonSeleccionado._id
            )}` +
            `&idusuario=${encodeURIComponent(
                sesionProfesor._id
            )}` +
            "&incluirDisponibles=true";

        const response = await fetch(url);

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible cargar las aplicaciones."
            );
        }

        aplicacionesAsignadas =
            Array.isArray(resultado.aplicaciones)
                ? resultado.aplicaciones
                : [];

        aplicacionesDisponibles =
            Array.isArray(resultado.disponibles)
                ? resultado.disponibles
                : [];

        if (resultado.salon) {
            salonSeleccionado = {
                ...salonSeleccionado,
                ...resultado.salon
            };
        }

        actualizarResumenSalon();
        aplicarFiltrosAplicaciones();
        ocultarMensajeGestion();
    } catch (error) {
        console.error(
            "Error al cargar las aplicaciones del salón:",
            error
        );

        aplicacionesAsignadas = [];
        aplicacionesDisponibles = [];

        mostrarMensajeGestion(
            error.message ||
            "No fue posible cargar las aplicaciones.",
            "error"
        );

        establecerMensajeLista(
            "lista-aplicaciones-asignadas",
            "No fue posible cargar las aplicaciones asignadas."
        );

        establecerMensajeLista(
            "lista-aplicaciones-disponibles",
            "No fue posible cargar las aplicaciones disponibles."
        );

        actualizarContadores();
    }
}

function actualizarResumenSalon() {
    const resumen = document.getElementById(
        "resumen-salon-aplicaciones"
    );

    if (!salonSeleccionado) {
        ocultarResumenSalon();
        return;
    }

    establecerTexto(
        "resumen-nombre-salon",
        salonSeleccionado.nombre ||
        "Salón sin nombre"
    );

    establecerTexto(
        "resumen-materia-salon",
        salonSeleccionado.materia ||
        "Materia sin especificar"
    );

    establecerTexto(
        "resumen-grado-salon",
        salonSeleccionado.grado !== undefined &&
        salonSeleccionado.grado !== null
            ? salonSeleccionado.grado
            : "No disponible"
    );

    establecerTexto(
        "resumen-total-asignadas",
        aplicacionesAsignadas.length
    );

    if (resumen) {
        resumen.hidden = false;
    }
}

function ocultarResumenSalon() {
    const resumen = document.getElementById(
        "resumen-salon-aplicaciones"
    );

    if (resumen) {
        resumen.hidden = true;
    }
}

function configurarFiltros() {
    const buscador = document.getElementById(
        "buscador-aplicaciones"
    );

    const filtro = document.getElementById(
        "filtro-aplicaciones"
    );

    if (buscador) {
        buscador.addEventListener(
            "input",
            aplicarFiltrosAplicaciones
        );
    }

    if (filtro) {
        filtro.addEventListener(
            "change",
            aplicarFiltrosAplicaciones
        );
    }
}

function aplicarFiltrosAplicaciones() {
    const buscador = document.getElementById(
        "buscador-aplicaciones"
    );

    const filtro = document.getElementById(
        "filtro-aplicaciones"
    );

    const termino = normalizarBusqueda(
        buscador ? buscador.value : ""
    );

    const tipoFiltro = filtro
        ? filtro.value
        : "todas";

    const asignadasFiltradas =
        aplicacionesAsignadas.filter(
            function (aplicacion) {
                return coincideBusqueda(
                    aplicacion,
                    termino
                );
            }
        );

    const disponiblesFiltradas =
        aplicacionesDisponibles.filter(
            function (aplicacion) {
                return coincideBusqueda(
                    aplicacion,
                    termino
                );
            }
        );

    const seccionAsignadas =
        document.getElementById(
            "seccion-aplicaciones-asignadas"
        );

    const seccionDisponibles =
        document.getElementById(
            "seccion-aplicaciones-disponibles"
        );

    if (seccionAsignadas) {
        seccionAsignadas.hidden =
            tipoFiltro === "disponibles";
    }

    if (seccionDisponibles) {
        seccionDisponibles.hidden =
            tipoFiltro === "asignadas";
    }

    renderizarAplicacionesAsignadas(
        asignadasFiltradas
    );

    renderizarAplicacionesDisponibles(
        disponiblesFiltradas
    );

    actualizarContadores();
}

function coincideBusqueda(
    aplicacion,
    termino
) {
    if (!termino) {
        return true;
    }

    const contenido = normalizarBusqueda(
        `${aplicacion.nombre || ""} ` +
        `${aplicacion.link || ""}`
    );

    return contenido.includes(termino);
}

function renderizarAplicacionesAsignadas(
    aplicaciones
) {
    const contenedor = document.getElementById(
        "lista-aplicaciones-asignadas"
    );

    if (!contenedor) {
        return;
    }

    contenedor.replaceChildren();

    if (aplicaciones.length === 0) {
        const mensaje =
            document.createElement("p");

        mensaje.className =
            "mensaje-lista-vacia";

        mensaje.textContent =
            aplicacionesAsignadas.length === 0
                ? "Este salón todavía no tiene aplicaciones asignadas."
                : "No hay aplicaciones asignadas que coincidan con la búsqueda.";

        contenedor.appendChild(mensaje);
        return;
    }

    aplicaciones.forEach(
        function (aplicacion) {
            contenedor.appendChild(
                crearTarjetaAplicacion(
                    aplicacion,
                    "asignada"
                )
            );
        }
    );
}

function renderizarAplicacionesDisponibles(
    aplicaciones
) {
    const contenedor = document.getElementById(
        "lista-aplicaciones-disponibles"
    );

    if (!contenedor) {
        return;
    }

    contenedor.replaceChildren();

    if (aplicaciones.length === 0) {
        const mensaje =
            document.createElement("p");

        mensaje.className =
            "mensaje-lista-vacia";

        mensaje.textContent =
            aplicacionesDisponibles.length === 0
                ? "No hay más aplicaciones disponibles para agregar."
                : "No hay aplicaciones disponibles que coincidan con la búsqueda.";

        contenedor.appendChild(mensaje);
        return;
    }

    aplicaciones.forEach(
        function (aplicacion) {
            contenedor.appendChild(
                crearTarjetaAplicacion(
                    aplicacion,
                    "disponible"
                )
            );
        }
    );
}

function crearTarjetaAplicacion(
    aplicacion,
    tipo
) {
    const tarjeta = document.createElement(
        "article"
    );

    tarjeta.className =
        `tarjeta-aplicacion tarjeta-${tipo}`;

    tarjeta.dataset.applicationId =
        aplicacion._id;

    const imagen = document.createElement("img");

    imagen.src =
        aplicacion.imagen ||
        "../Assets/materia.png";

    imagen.alt =
        aplicacion.nombre
            ? `Imagen de ${aplicacion.nombre}`
            : "Imagen de la aplicación";

    imagen.className =
        "imagen-tarjeta-aplicacion";

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

    const informacion =
        document.createElement("div");

    informacion.className =
        "informacion-tarjeta-aplicacion";

    const nombre = document.createElement("h4");

    nombre.textContent =
        aplicacion.nombre ||
        "Aplicación sin nombre";

    const enlace = document.createElement("p");

    enlace.textContent =
        obtenerDominioAplicacion(
            aplicacion.link
        );

    informacion.appendChild(nombre);
    informacion.appendChild(enlace);

    const acciones =
        document.createElement("div");

    acciones.className =
        "acciones-tarjeta-aplicacion";

    const botonVista =
        document.createElement("button");

    botonVista.type = "button";

    botonVista.className =
        "boton-vista-aplicacion";

    botonVista.textContent = "Ver";

    botonVista.dataset.applicationId =
        aplicacion._id;

    botonVista.dataset.applicationType =
        tipo;

    acciones.appendChild(botonVista);

    const botonGestion =
        document.createElement("button");

    botonGestion.type = "button";

    botonGestion.dataset.applicationId =
        aplicacion._id;

    if (tipo === "asignada") {
        botonGestion.className =
            "boton-retirar-aplicacion";

        botonGestion.textContent =
            "Retirar";
    } else {
        botonGestion.className =
            "boton-agregar-aplicacion";

        botonGestion.textContent =
            "Agregar";
    }

    acciones.appendChild(botonGestion);

    tarjeta.appendChild(imagen);
    tarjeta.appendChild(informacion);
    tarjeta.appendChild(acciones);

    return tarjeta;
}

function configurarListasAplicaciones() {
    const columnas = document.querySelector(
        ".columnas-aplicaciones"
    );

    if (!columnas) {
        return;
    }

    columnas.addEventListener(
        "click",
        async function (event) {
            const botonVista =
                event.target.closest(
                    ".boton-vista-aplicacion"
                );

            if (botonVista) {
                abrirVistaPrevia(
                    botonVista.dataset.applicationId,
                    botonVista.dataset.applicationType
                );

                return;
            }

            const botonAgregar =
                event.target.closest(
                    ".boton-agregar-aplicacion"
                );

            if (botonAgregar) {
                await agregarAplicacionSalon(
                    botonAgregar
                );

                return;
            }

            const botonRetirar =
                event.target.closest(
                    ".boton-retirar-aplicacion"
                );

            if (botonRetirar) {
                await retirarAplicacionSalon(
                    botonRetirar
                );
            }
        }
    );
}

async function agregarAplicacionSalon(
    boton
) {
    if (!salonSeleccionado) {
        return;
    }

    const idAplicacion =
        boton.dataset.applicationId;

    if (!idAplicacion) {
        return;
    }

    boton.disabled = true;
    boton.textContent = "Agregando...";

    mostrarMensajeGestion(
        "Agregando la aplicación al salón...",
        "informacion"
    );

    try {
        const response = await fetch(
            "/Escuelapp/AgregarAplicacionSalon",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    idgrupo:
                        salonSeleccionado._id,
                    idaplicacion:
                        idAplicacion,
                    idusuario:
                        sesionProfesor._id
                })
            }
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible agregar la aplicación."
            );
        }

        mostrarMensajeGestion(
            resultado.message ||
            "La aplicación fue agregada correctamente.",
            "exito"
        );

        await cargarAplicacionesSalon();
    } catch (error) {
        console.error(
            "Error al agregar la aplicación:",
            error
        );

        boton.disabled = false;
        boton.textContent = "Agregar";

        mostrarMensajeGestion(
            error.message ||
            "No fue posible agregar la aplicación.",
            "error"
        );
    }
}

async function retirarAplicacionSalon(
    boton
) {
    if (!salonSeleccionado) {
        return;
    }

    const idAplicacion =
        boton.dataset.applicationId;

    if (!idAplicacion) {
        return;
    }

    const aplicacion =
        aplicacionesAsignadas.find(
            function (registro) {
                return (
                    String(registro._id) ===
                    String(idAplicacion)
                );
            }
        );

    const nombreAplicacion =
        aplicacion
            ? aplicacion.nombre
            : "esta aplicación";

    const confirmarRetiro = window.confirm(
        `¿Deseas retirar ${nombreAplicacion} de este salón?`
    );

    if (!confirmarRetiro) {
        return;
    }

    boton.disabled = true;
    boton.textContent = "Retirando...";

    mostrarMensajeGestion(
        "Retirando la aplicación del salón...",
        "informacion"
    );

    try {
        const response = await fetch(
            "/Escuelapp/RetirarAplicacionSalon",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    idgrupo:
                        salonSeleccionado._id,
                    idaplicacion:
                        idAplicacion,
                    idusuario:
                        sesionProfesor._id
                })
            }
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible retirar la aplicación."
            );
        }

        mostrarMensajeGestion(
            resultado.message ||
            "La aplicación fue retirada correctamente.",
            "exito"
        );

        await cargarAplicacionesSalon();
    } catch (error) {
        console.error(
            "Error al retirar la aplicación:",
            error
        );

        boton.disabled = false;
        boton.textContent = "Retirar";

        mostrarMensajeGestion(
            error.message ||
            "No fue posible retirar la aplicación.",
            "error"
        );
    }
}

function configurarVistaPrevia() {
    const dialogo = document.getElementById(
        "dialogo-vista-aplicacion"
    );

    const botonCerrar = document.getElementById(
        "cerrar-vista-aplicacion"
    );

    const enlaceAbrir = document.getElementById(
        "vista-aplicacion-abrir"
    );

    if (botonCerrar) {
        botonCerrar.addEventListener(
            "click",
            cerrarVistaPrevia
        );
    }

    if (dialogo) {
        dialogo.addEventListener(
            "click",
            function (event) {
                if (event.target === dialogo) {
                    cerrarVistaPrevia();
                }
            }
        );
    }

    if (enlaceAbrir) {
        enlaceAbrir.addEventListener(
            "click",
            function (event) {
                if (
                    enlaceAbrir.getAttribute(
                        "aria-disabled"
                    ) === "true"
                ) {
                    event.preventDefault();
                }
            }
        );
    }
}

function abrirVistaPrevia(
    idAplicacion,
    tipo
) {
    const lista =
        tipo === "asignada"
            ? aplicacionesAsignadas
            : aplicacionesDisponibles;

    const aplicacion = lista.find(
        function (registro) {
            return (
                String(registro._id) ===
                String(idAplicacion)
            );
        }
    );

    if (!aplicacion) {
        return;
    }

    const dialogo = document.getElementById(
        "dialogo-vista-aplicacion"
    );

    const imagen = document.getElementById(
        "vista-aplicacion-imagen"
    );

    const nombre = document.getElementById(
        "vista-aplicacion-nombre"
    );

    const enlaceTexto = document.getElementById(
        "vista-aplicacion-enlace"
    );

    const enlaceAbrir = document.getElementById(
        "vista-aplicacion-abrir"
    );

    if (!dialogo) {
        return;
    }

    if (imagen) {
        imagen.src =
            aplicacion.imagen ||
            "../Assets/materia.png";

        imagen.alt =
            aplicacion.nombre
                ? `Imagen de ${aplicacion.nombre}`
                : "Imagen de la aplicación";

        imagen.onerror = function () {
            imagen.src =
                "../Assets/materia.png";
        };
    }

    if (nombre) {
        nombre.textContent =
            aplicacion.nombre ||
            "Aplicación sin nombre";
    }

    const enlaceValido = normalizarEnlace(
        aplicacion.link
    );

    if (enlaceTexto) {
        enlaceTexto.textContent =
            enlaceValido ||
            "Enlace no disponible";
    }

    if (enlaceAbrir) {
        if (enlaceValido) {
            enlaceAbrir.href = enlaceValido;

            enlaceAbrir.removeAttribute(
                "aria-disabled"
            );

            enlaceAbrir.classList.remove(
                "enlace-deshabilitado"
            );
        } else {
            enlaceAbrir.href = "#";

            enlaceAbrir.setAttribute(
                "aria-disabled",
                "true"
            );

            enlaceAbrir.classList.add(
                "enlace-deshabilitado"
            );
        }
    }

    dialogo.showModal();
}

function cerrarVistaPrevia() {
    const dialogo = document.getElementById(
        "dialogo-vista-aplicacion"
    );

    if (dialogo && dialogo.open) {
        dialogo.close();
    }
}

function configurarBotonesGenerales() {
    const botonActualizar =
        document.getElementById(
            "boton-actualizar-aplicaciones"
        );

    if (!botonActualizar) {
        return;
    }

    botonActualizar.addEventListener(
        "click",
        async function () {
            botonActualizar.disabled = true;

            botonActualizar.textContent =
                "Actualizando...";

            try {
                const idSalonActual =
                    salonSeleccionado
                        ? salonSeleccionado._id
                        : null;

                await cargarSalonesProfesor();

                if (idSalonActual) {
                    salonSeleccionado =
                        salonesProfesor.find(
                            function (salon) {
                                return (
                                    String(salon._id) ===
                                    String(idSalonActual)
                                );
                            }
                        ) || null;

                    const selector =
                        document.getElementById(
                            "selector-salon-aplicaciones"
                        );

                    if (
                        selector &&
                        salonSeleccionado
                    ) {
                        selector.value =
                            salonSeleccionado._id;
                    }

                    if (salonSeleccionado) {
                        await cargarAplicacionesSalon();
                    }
                }
            } finally {
                botonActualizar.disabled = false;

                botonActualizar.textContent =
                    "Actualizar información";
            }
        }
    );
}

function actualizarContadores() {
    establecerTexto(
        "contador-aplicaciones-asignadas",
        aplicacionesAsignadas.length
    );

    establecerTexto(
        "contador-aplicaciones-disponibles",
        aplicacionesDisponibles.length
    );

    establecerTexto(
        "resumen-total-asignadas",
        aplicacionesAsignadas.length
    );
}

function deshabilitarControles(
    deshabilitado
) {
    const buscador = document.getElementById(
        "buscador-aplicaciones"
    );

    const filtro = document.getElementById(
        "filtro-aplicaciones"
    );

    if (buscador) {
        buscador.disabled = deshabilitado;

        if (deshabilitado) {
            buscador.value = "";
        }
    }

    if (filtro) {
        filtro.disabled = deshabilitado;

        if (deshabilitado) {
            filtro.value = "todas";
        }
    }
}

function limpiarAplicaciones() {
    aplicacionesAsignadas = [];
    aplicacionesDisponibles = [];

    actualizarContadores();
    ocultarMensajeGestion();
}

function mostrarMensajeListasIniciales(
    mensaje
) {
    establecerMensajeLista(
        "lista-aplicaciones-asignadas",
        mensaje
    );

    establecerMensajeLista(
        "lista-aplicaciones-disponibles",
        mensaje
    );
}

function establecerMensajeLista(
    idContenedor,
    mensaje
) {
    const contenedor = document.getElementById(
        idContenedor
    );

    if (!contenedor) {
        return;
    }

    const elemento =
        document.createElement("p");

    elemento.className =
        "mensaje-lista-vacia";

    elemento.textContent = mensaje;

    contenedor.replaceChildren(elemento);
}

function mostrarMensajeGestion(
    mensaje,
    tipo
) {
    const elemento = document.getElementById(
        "mensaje-gestion-aplicaciones"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = false;
    elemento.textContent = mensaje;

    elemento.className =
        `mensaje-gestion mensaje-${tipo}`;
}

function ocultarMensajeGestion() {
    const elemento = document.getElementById(
        "mensaje-gestion-aplicaciones"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = true;
    elemento.textContent = "";

    elemento.className =
        "mensaje-gestion";
}

function establecerTexto(
    idElemento,
    valor
) {
    const elemento = document.getElementById(
        idElemento
    );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        valor !== undefined &&
        valor !== null
            ? String(valor)
            : "";
}

function normalizarBusqueda(valor) {
    return String(valor || "")
        .trim()
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
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

function obtenerDominioAplicacion(enlace) {
    const enlaceNormalizado =
        normalizarEnlace(enlace);

    if (!enlaceNormalizado) {
        return "Enlace no disponible";
    }

    try {
        const url = new URL(
            enlaceNormalizado
        );

        return url.hostname.replace(
            /^www\./,
            ""
        );
    } catch (error) {
        return enlaceNormalizado;
    }
}

async function leerRespuestaJSON(response) {
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

function volverInicioProfesor() {
    window.location.href =
        "./homeProfesor.html";
}

function cerrarSesionYRedirigir(
    mensaje
) {
    if (mensaje) {
        alert(mensaje);
    }

    localStorage.removeItem("token");

    localStorage.removeItem(
        "sesionEscuelApp"
    );

    localStorage.removeItem(
        "salonelegido"
    );

    window.location.replace(
        "./inicio_sesion.html"
    );
}

function redirigirSegunRol(rol) {
    switch (Number(rol)) {
        case 1:
            window.location.replace(
                "./homeAdmin.html"
            );
            break;

        case 3:
            window.location.replace(
                "./homeEstudiante.html"
            );
            break;

        default:
            window.location.replace(
                "./inicio_sesion.html"
            );
    }
}
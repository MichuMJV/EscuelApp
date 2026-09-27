document.addEventListener("DOMContentLoaded", function () {
    inicializarAcordeonAdministracion();
    inicializarListaAplicaciones();
});

function inicializarAcordeonAdministracion() {
    const botonesCategoria = document.querySelectorAll(
        ".boton-categoria[data-acordeon]"
    );

    if (botonesCategoria.length === 0) {
        return;
    }

    botonesCategoria.forEach(function (botonCategoria) {
        botonCategoria.addEventListener("click", function () {
            const idListaOpciones = botonCategoria.dataset.acordeon;
            const listaOpciones = document.getElementById(
                idListaOpciones
            );

            if (!listaOpciones) {
                return;
            }

            const categoriaEstaAbierta =
                botonCategoria.getAttribute("aria-expanded") === "true";

            cerrarCategoriasAdministrativas();

            if (!categoriaEstaAbierta) {
                abrirCategoriaAdministrativa(
                    botonCategoria,
                    listaOpciones
                );
            }
        });
    });
}

function abrirCategoriaAdministrativa(
    botonCategoria,
    listaOpciones
) {
    const moduloAdministracion = botonCategoria.closest(
        ".modulo-administracion"
    );

    botonCategoria.setAttribute("aria-expanded", "true");
    listaOpciones.hidden = false;

    if (moduloAdministracion) {
        moduloAdministracion.classList.add("modulo-abierto");
    }
}

function cerrarCategoriasAdministrativas() {
    const botonesCategoria = document.querySelectorAll(
        ".boton-categoria[data-acordeon]"
    );

    botonesCategoria.forEach(function (botonCategoria) {
        const idListaOpciones = botonCategoria.dataset.acordeon;

        const listaOpciones = document.getElementById(
            idListaOpciones
        );

        const moduloAdministracion = botonCategoria.closest(
            ".modulo-administracion"
        );

        botonCategoria.setAttribute("aria-expanded", "false");

        if (listaOpciones) {
            listaOpciones.hidden = true;
        }

        if (moduloAdministracion) {
            moduloAdministracion.classList.remove("modulo-abierto");
        }
    });
}

function inicializarListaAplicaciones() {
    const botonAplicaciones = document.getElementById("my-button");
    const listaAplicaciones = document.getElementById("my-list");

    if (!botonAplicaciones || !listaAplicaciones) {
        return;
    }

    botonAplicaciones.addEventListener("click", function () {
        const listaEstaOculta =
            window.getComputedStyle(listaAplicaciones).display === "none";

        listaAplicaciones.style.display = listaEstaOculta
            ? "flex"
            : "none";
    });
}

function obtenerSesionEscuelApp() {
    const sessionData = localStorage.getItem("sesionEscuelApp");

    if (!sessionData) {
        return null;
    }

    try {
        return JSON.parse(sessionData);
    } catch (error) {
        console.error(
            "No fue posible interpretar los datos de la sesión:",
            error
        );

        return null;
    }
}

function obtenerIdSalonActual() {
    const parametrosURL = new URLSearchParams(
        window.location.search
    );

    const idSalonURL = parametrosURL.get("id");

    if (idSalonURL) {
        return idSalonURL;
    }

    const salonGuardado = localStorage.getItem("salonelegido");

    if (!salonGuardado) {
        return null;
    }

    try {
        const salon = JSON.parse(salonGuardado);

        if (salon && salon._id) {
            return salon._id;
        }

        if (salon && salon.id) {
            return salon.id;
        }

        return typeof salon === "string"
            ? salon
            : null;
    } catch (error) {
        return salonGuardado;
    }
}

function redirigirPaginaProfesor() {
    const usuario = obtenerSesionEscuelApp();

    localStorage.removeItem("salonelegido");

    if (usuario && Number(usuario.rol) === 2) {
        window.location.href = "./homeProfesor.html";
        return;
    }

    if (usuario && Number(usuario.rol) === 1) {
        window.location.href = "./homeAdmin.html";
        return;
    }

    window.location.href = "./inicio_sesion.html";
}

function redirigirPaginaEstudiante() {
    window.location.href = "./homeEstudiante.html";
}

function abrirdashboardadmin() {
    window.location.href = "./admin-dashboard.html";
}

function VerUsuarios() {
    window.location.href = "./UsuariosActuales.html";
}

function redirigirPaginaAdmin() {
    window.location.href = "./homeAdmin.html";
}

function abrirTareasProfe() {
    const idSalon = obtenerIdSalonActual();

    if (idSalon) {
        window.location.href =
            `./Tareas_profesor.html?id=${encodeURIComponent(idSalon)}`;

        return;
    }

    window.location.href = "./Tareas_profesor.html";
}

function abrirTareasEstudiante() {
    const idSalon = obtenerIdSalonActual();

    if (idSalon) {
        window.location.href =
            `./Tareas_estudiante.html?id=${encodeURIComponent(idSalon)}`;

        return;
    }

    window.location.href = "./Tareas_estudiante.html";
}

function abrirNuevoUsuario() {
    window.location.href = "./Nuevo_usuario.html";
}

function AbrirNuevaTarea() {
    const idSalon = obtenerIdSalonActual();

    if (!idSalon) {
        alert(
            "Error: No se pudo identificar el salón para crear la tarea."
        );

        return;
    }

    window.location.href =
        `./Nueva_tarea.html?id=${encodeURIComponent(idSalon)}`;
}

function AbrirNuevaApp() {
    window.location.href = "./Nueva_App.html";
}

function Borrar_APP() {
    window.location.href = "./Borrar_APP.html";
}

function AbrirNuevoSalon() {
    window.location.href = "./Nuevo_salon.html";
}

function abrirDashboardSalones() {
    const idSalon = obtenerIdSalonActual();

    if (!idSalon) {
        alert(
            "Error: No se pudo identificar el salón para abrir el dashboard."
        );

        return;
    }

    window.location.href =
        `./dashboard.html?id=${encodeURIComponent(idSalon)}`;
}

function Nuevo_rol() {
    window.location.href = "./Nuevo_rol.html";
}

function EditarSalones() {
    window.location.href = "./modificarSalon.html";
}
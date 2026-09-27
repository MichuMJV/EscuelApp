const CLAVE_SESION_ESCUELAPP = "sesionEscuelApp";
const PAGINA_INICIO_SESION = "./inicio_sesion.html";

function obtenerDatosSesion() {
    const datosGuardados = localStorage.getItem(CLAVE_SESION_ESCUELAPP);

    if (!datosGuardados) {
        return null;
    }

    try {
        return JSON.parse(datosGuardados);
    } catch (error) {
        console.error(
            "No fue posible interpretar los datos de la sesión:",
            error
        );

        localStorage.removeItem(CLAVE_SESION_ESCUELAPP);

        return null;
    }
}

function mostrarNombreUsuario(usuario) {
    const elementoNombreUsuario = document.getElementById("username");

    if (!elementoNombreUsuario) {
        return;
    }

    if (usuario.nombre) {
        elementoNombreUsuario.textContent = usuario.nombre;
        return;
    }

    elementoNombreUsuario.textContent = "Usuario";
}

function redirigirAlInicioSesion() {
    window.location.replace(PAGINA_INICIO_SESION);
}

function validarSesion() {
    const usuario = obtenerDatosSesion();

    if (!usuario) {
        alert("No se encontraron datos de sesión.");
        redirigirAlInicioSesion();
        return;
    }

    mostrarNombreUsuario(usuario);
}

function cerrarsesion() {
    localStorage.removeItem(CLAVE_SESION_ESCUELAPP);
    localStorage.removeItem("salonelegido");

    redirigirAlInicioSesion();
}

document.addEventListener("DOMContentLoaded", function () {
    validarSesion();
});
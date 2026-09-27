document.addEventListener("DOMContentLoaded", function () {
    const formulario = document.getElementById(
        "form_inicio_de_sesion"
    );

    const botonMostrarContrasena = document.getElementById(
        "mostrar-contrasena"
    );

    if (!formulario) {
        console.error(
            "No se encontró el formulario de inicio de sesión."
        );

        return;
    }

    formulario.addEventListener(
        "submit",
        iniciarSesion
    );

    if (botonMostrarContrasena) {
        botonMostrarContrasena.addEventListener(
            "click",
            alternarVisibilidadContrasena
        );
    }
});

async function iniciarSesion(event) {
    event.preventDefault();
    event.stopPropagation();

    const campoCedula = document.getElementById(
        "Cedula"
    );

    const campoContrasena = document.getElementById(
        "Password"
    );

    const botonAcceso = document.getElementById(
        "buttsubmit"
    );

    if (
        !campoCedula ||
        !campoContrasena ||
        !botonAcceso
    ) {
        mostrarMensajeInicioSesion(
            "No se encontraron los controles del formulario.",
            "error"
        );

        return;
    }

    const cedula = normalizarCedula(
        campoCedula.value
    );

    const contrasena = campoContrasena.value;

    ocultarMensajeInicioSesion();

    if (!cedula || !contrasena) {
        mostrarMensajeInicioSesion(
            "Por favor, ingresa tu cédula y contraseña.",
            "error"
        );

        if (!cedula) {
            campoCedula.focus();
        } else {
            campoContrasena.focus();
        }

        return;
    }

    botonAcceso.disabled = true;
    botonAcceso.textContent = "Verificando...";

    try {
        const response = await fetch(
            "/Escuelapp/inicio_sesion",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cedula,
                    contrasena
                })
            }
        );

        const data = await leerRespuestaServidor(
            response
        );

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "No fue posible iniciar sesión."
            );
        }

        if (!data.token) {
            throw new Error(
                "El servidor no devolvió un token de sesión."
            );
        }

        const datosSesion = obtenerDatosSesion(
            data.token,
            data.usuario
        );

        if (!datosSesion || !datosSesion._id) {
            throw new Error(
                "No fue posible obtener los datos del usuario."
            );
        }

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "sesionEscuelApp",
            JSON.stringify(datosSesion)
        );

        localStorage.removeItem(
            "salonelegido"
        );

        mostrarMensajeInicioSesion(
            data.debeCambiarContrasena
                ? "Debes establecer una contraseña nueva para continuar."
                : "Inicio de sesión exitoso.",
            "exito"
        );

        const rutaDestino = obtenerRutaDestino(
            data.redirect
        );

        window.location.replace(
            rutaDestino
        );
    } catch (error) {
        console.error(
            "Error al iniciar sesión:",
            error
        );

        mostrarMensajeInicioSesion(
            error.message ||
            "Ocurrió un error al iniciar sesión.",
            "error"
        );

        campoContrasena.value = "";
        campoContrasena.focus();

        botonAcceso.disabled = false;
        botonAcceso.textContent = "Acceder";
    }
}

async function leerRespuestaServidor(response) {
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

function obtenerDatosSesion(
    token,
    usuarioRespuesta
) {
    const datosToken = decodificarToken(
        token
    );

    if (datosToken && datosToken._id) {
        return {
            _id: datosToken._id,
            rol: datosToken.rol,
            nombre: datosToken.nombre,
            cedula: datosToken.cedula,
            debeCambiarContrasena:
                datosToken.debeCambiarContrasena === true
        };
    }

    if (
        usuarioRespuesta &&
        usuarioRespuesta._id
    ) {
        return {
            _id: usuarioRespuesta._id,
            rol: usuarioRespuesta.rol,
            nombre: usuarioRespuesta.nombre,
            cedula: usuarioRespuesta.cedula,
            debeCambiarContrasena:
                usuarioRespuesta.debeCambiarContrasena === true
        };
    }

    return null;
}

function decodificarToken(token) {
    try {
        const partes = token.split(".");

        if (partes.length !== 3) {
            return null;
        }

        let contenidoBase64 = partes[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        while (
            contenidoBase64.length % 4 !== 0
        ) {
            contenidoBase64 += "=";
        }

        const textoDecodificado = window.atob(
            contenidoBase64
        );

        const textoUnicode = decodeURIComponent(
            textoDecodificado
                .split("")
                .map(function (caracter) {
                    return (
                        "%" +
                        caracter
                            .charCodeAt(0)
                            .toString(16)
                            .padStart(2, "0")
                    );
                })
                .join("")
        );

        return JSON.parse(
            textoUnicode
        );
    } catch (error) {
        console.error(
            "No fue posible decodificar el token:",
            error
        );

        return null;
    }
}

function obtenerRutaDestino(rutaServidor) {
    if (
        typeof rutaServidor !== "string" ||
        !rutaServidor.trim()
    ) {
        throw new Error(
            "El servidor no indicó una pantalla de destino."
        );
    }

    const ruta = rutaServidor
        .trim()
        .replace(/^\/+/, "");

    return `../${ruta}`;
}

function alternarVisibilidadContrasena() {
    const campoContrasena = document.getElementById(
        "Password"
    );

    const botonMostrarContrasena = document.getElementById(
        "mostrar-contrasena"
    );

    if (
        !campoContrasena ||
        !botonMostrarContrasena
    ) {
        return;
    }

    const estaOculta =
        campoContrasena.type === "password";

    campoContrasena.type = estaOculta
        ? "text"
        : "password";

    botonMostrarContrasena.textContent = estaOculta
        ? "Ocultar"
        : "Mostrar";

    botonMostrarContrasena.setAttribute(
        "aria-label",
        estaOculta
            ? "Ocultar contraseña"
            : "Mostrar contraseña"
    );

    botonMostrarContrasena.title = estaOculta
        ? "Ocultar contraseña"
        : "Mostrar contraseña";

    campoContrasena.focus();
}

function mostrarMensajeInicioSesion(
    mensaje,
    tipo
) {
    const elemento = document.getElementById(
        "mensaje-inicio-sesion"
    );

    if (!elemento) {
        alert(mensaje);
        return;
    }

    elemento.hidden = false;
    elemento.textContent = mensaje;
    elemento.className =
        `mensaje-inicio-sesion mensaje-${tipo}`;
}

function ocultarMensajeInicioSesion() {
    const elemento = document.getElementById(
        "mensaje-inicio-sesion"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = true;
    elemento.textContent = "";
    elemento.className =
        "mensaje-inicio-sesion";
}

function normalizarCedula(valor) {
    if (
        typeof valor !== "string" &&
        typeof valor !== "number"
    ) {
        return "";
    }

    return String(valor)
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}
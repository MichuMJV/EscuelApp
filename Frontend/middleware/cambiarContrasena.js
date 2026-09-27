document.addEventListener("DOMContentLoaded", function () {
    inicializarCambioContrasena();
});

function inicializarCambioContrasena() {
    const formulario = document.getElementById(
        "form_cambio_contrasena"
    );

    const campoContrasenaActual = document.getElementById(
        "contrasenaActual"
    );

    const campoNuevaContrasena = document.getElementById(
        "nuevaContrasena"
    );

    const campoConfirmarContrasena = document.getElementById(
        "confirmarContrasena"
    );

    const botonesMostrarContrasena =
        document.querySelectorAll(
            "[data-password-target]"
        );

    const botonCerrarSesion = document.getElementById(
        "boton-cerrar-sesion"
    );

    const token = localStorage.getItem("token");
    const sesion = obtenerSesionLocal();

    if (!token || !sesion || !sesion._id) {
        cerrarSesionYRedirigir(
            "No se encontró una sesión válida."
        );

        return;
    }

    if (sesion.debeCambiarContrasena !== true) {
        redirigirSegunRol(sesion.rol);
        return;
    }

    mostrarNombreUsuario(sesion.nombre);

    if (!formulario) {
        console.error(
            "No se encontró el formulario de cambio de contraseña."
        );

        return;
    }

    formulario.addEventListener(
        "submit",
        cambiarContrasena
    );

    if (campoContrasenaActual) {
        campoContrasenaActual.addEventListener(
            "input",
            actualizarRequisitosContrasena
        );
    }

    if (campoNuevaContrasena) {
        campoNuevaContrasena.addEventListener(
            "input",
            actualizarRequisitosContrasena
        );
    }

    if (campoConfirmarContrasena) {
        campoConfirmarContrasena.addEventListener(
            "input",
            actualizarRequisitosContrasena
        );
    }

    botonesMostrarContrasena.forEach(
        function (boton) {
            boton.addEventListener(
                "click",
                alternarCampoContrasena
            );
        }
    );

    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener(
            "click",
            function () {
                cerrarSesionYRedirigir();
            }
        );
    }

    window.addEventListener(
        "pageshow",
        verificarSesionCambioContrasena
    );

    actualizarRequisitosContrasena();
}

async function cambiarContrasena(event) {
    event.preventDefault();

    const campoContrasenaActual = document.getElementById(
        "contrasenaActual"
    );

    const campoNuevaContrasena = document.getElementById(
        "nuevaContrasena"
    );

    const campoConfirmarContrasena = document.getElementById(
        "confirmarContrasena"
    );

    const botonCambiar = document.getElementById(
        "boton-cambiar-contrasena"
    );

    const token = localStorage.getItem("token");

    if (
        !campoContrasenaActual ||
        !campoNuevaContrasena ||
        !campoConfirmarContrasena ||
        !botonCambiar
    ) {
        mostrarMensajeCambioContrasena(
            "No se encontraron los elementos necesarios del formulario.",
            "error"
        );

        return;
    }

    if (!token) {
        cerrarSesionYRedirigir(
            "La sesión no es válida. Inicia sesión nuevamente."
        );

        return;
    }

    const contrasenaActual =
        campoContrasenaActual.value;

    const nuevaContrasena =
        campoNuevaContrasena.value;

    const confirmarContrasena =
        campoConfirmarContrasena.value;

    ocultarMensajeCambioContrasena();

    if (
        !contrasenaActual ||
        !nuevaContrasena ||
        !confirmarContrasena
    ) {
        mostrarMensajeCambioContrasena(
            "Debes completar todos los campos.",
            "error"
        );

        return;
    }

    if (
        nuevaContrasena !==
        confirmarContrasena
    ) {
        mostrarMensajeCambioContrasena(
            "La nueva contraseña y su confirmación no coinciden.",
            "error"
        );

        campoConfirmarContrasena.focus();
        return;
    }

    const validacion = validarNuevaContrasena(
        contrasenaActual,
        nuevaContrasena
    );

    if (!validacion.valida) {
        mostrarMensajeCambioContrasena(
            validacion.mensaje,
            "error"
        );

        campoNuevaContrasena.focus();
        return;
    }

    botonCambiar.disabled = true;
    botonCambiar.textContent =
        "Guardando contraseña...";

    try {
        const response = await fetch(
            "/Escuelapp/CambiarContrasena",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    contrasenaActual,
                    nuevaContrasena,
                    confirmarContrasena
                })
            }
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible cambiar la contraseña."
            );
        }

        if (!resultado.token) {
            throw new Error(
                "El servidor no devolvió la nueva sesión."
            );
        }

        const nuevaSesion = obtenerDatosNuevaSesion(
            resultado.token,
            resultado.usuario
        );

        localStorage.setItem(
            "token",
            resultado.token
        );

        localStorage.setItem(
            "sesionEscuelApp",
            JSON.stringify(nuevaSesion)
        );

        mostrarMensajeCambioContrasena(
            resultado.message ||
            "La contraseña fue actualizada correctamente.",
            "exito"
        );

        formularioBloqueado(true);

        setTimeout(function () {
            const ruta = obtenerRutaRedireccion(
                resultado.redirect,
                nuevaSesion.rol
            );

            window.location.replace(ruta);
        }, 900);
    } catch (error) {
        console.error(
            "Error al cambiar la contraseña:",
            error
        );

        mostrarMensajeCambioContrasena(
            error.message ||
            "Ocurrió un error al cambiar la contraseña.",
            "error"
        );

        campoContrasenaActual.value = "";
        campoContrasenaActual.focus();

        botonCambiar.disabled = false;
        botonCambiar.textContent =
            "Guardar nueva contraseña";
    }
}

function validarNuevaContrasena(
    contrasenaActual,
    nuevaContrasena
) {
    if (nuevaContrasena.length < 8) {
        return {
            valida: false,
            mensaje:
                "La nueva contraseña debe tener al menos 8 caracteres."
        };
    }

    if (nuevaContrasena.length > 128) {
        return {
            valida: false,
            mensaje:
                "La nueva contraseña no puede tener más de 128 caracteres."
        };
    }

    if (!/[A-Z]/.test(nuevaContrasena)) {
        return {
            valida: false,
            mensaje:
                "La nueva contraseña debe incluir al menos una letra mayúscula."
        };
    }

    if (!/[a-z]/.test(nuevaContrasena)) {
        return {
            valida: false,
            mensaje:
                "La nueva contraseña debe incluir al menos una letra minúscula."
        };
    }

    if (!/[0-9]/.test(nuevaContrasena)) {
        return {
            valida: false,
            mensaje:
                "La nueva contraseña debe incluir al menos un número."
        };
    }

    if (
        nuevaContrasena ===
        contrasenaActual
    ) {
        return {
            valida: false,
            mensaje:
                "La nueva contraseña debe ser diferente de la contraseña temporal."
        };
    }

    return {
        valida: true,
        mensaje: ""
    };
}

function actualizarRequisitosContrasena() {
    const campoContrasenaActual =
        document.getElementById(
            "contrasenaActual"
        );

    const campoNuevaContrasena =
        document.getElementById(
            "nuevaContrasena"
        );

    const campoConfirmarContrasena =
        document.getElementById(
            "confirmarContrasena"
        );

    const contrasenaActual =
        campoContrasenaActual
            ? campoContrasenaActual.value
            : "";

    const nuevaContrasena =
        campoNuevaContrasena
            ? campoNuevaContrasena.value
            : "";

    const confirmarContrasena =
        campoConfirmarContrasena
            ? campoConfirmarContrasena.value
            : "";

    actualizarEstadoRequisito(
        "requisito-longitud",
        nuevaContrasena.length >= 8
    );

    actualizarEstadoRequisito(
        "requisito-mayuscula",
        /[A-Z]/.test(nuevaContrasena)
    );

    actualizarEstadoRequisito(
        "requisito-minuscula",
        /[a-z]/.test(nuevaContrasena)
    );

    actualizarEstadoRequisito(
        "requisito-numero",
        /[0-9]/.test(nuevaContrasena)
    );

    actualizarEstadoRequisito(
        "requisito-diferente",
        Boolean(nuevaContrasena) &&
        nuevaContrasena !== contrasenaActual
    );

    if (
        campoConfirmarContrasena &&
        confirmarContrasena
    ) {
        const coinciden =
            nuevaContrasena ===
            confirmarContrasena;

        campoConfirmarContrasena.setCustomValidity(
            coinciden
                ? ""
                : "Las contraseñas no coinciden."
        );
    } else if (campoConfirmarContrasena) {
        campoConfirmarContrasena.setCustomValidity("");
    }
}

function actualizarEstadoRequisito(
    idElemento,
    cumplido
) {
    const elemento = document.getElementById(
        idElemento
    );

    if (!elemento) {
        return;
    }

    elemento.classList.toggle(
        "requisito-cumplido",
        cumplido
    );

    elemento.classList.toggle(
        "requisito-pendiente",
        !cumplido
    );

    elemento.setAttribute(
        "aria-label",
        `${cumplido ? "Cumplido" : "Pendiente"}: ` +
        elemento.textContent.trim()
    );
}

function alternarCampoContrasena(event) {
    const boton = event.currentTarget;

    const idCampo = boton.dataset.passwordTarget;

    const campo = document.getElementById(
        idCampo
    );

    if (!campo) {
        return;
    }

    const estaVisible =
        campo.type === "text";

    campo.type = estaVisible
        ? "password"
        : "text";

    boton.textContent = estaVisible
        ? "Mostrar"
        : "Ocultar";

    const etiquetaCampo =
        campo.closest(".input-contained")
            ?.querySelector(
                ".etiqueta-campo-sesion"
            )
            ?.textContent
            ?.trim() || "contraseña";

    boton.setAttribute(
        "aria-label",
        `${estaVisible ? "Mostrar" : "Ocultar"} ${etiquetaCampo}`
    );

    boton.title =
        `${estaVisible ? "Mostrar" : "Ocultar"} ${etiquetaCampo}`;

    campo.focus();
}

function verificarSesionCambioContrasena() {
    const token = localStorage.getItem("token");
    const sesion = obtenerSesionLocal();

    if (!token || !sesion || !sesion._id) {
        cerrarSesionYRedirigir();
        return;
    }

    if (sesion.debeCambiarContrasena !== true) {
        redirigirSegunRol(sesion.rol);
    }
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
            "No fue posible interpretar la sesión local:",
            error
        );

        return null;
    }
}

function mostrarNombreUsuario(nombre) {
    const elementoNombre =
        document.getElementById(
            "username"
        );

    if (!elementoNombre) {
        return;
    }

    elementoNombre.textContent =
        nombre || "Usuario";
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

function obtenerDatosNuevaSesion(
    token,
    usuarioRespuesta
) {
    const payload = decodificarToken(token);

    if (payload && payload._id) {
        return {
            _id: payload._id,
            rol: payload.rol,
            nombre: payload.nombre,
            cedula: payload.cedula,
            debeCambiarContrasena: false
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
            debeCambiarContrasena: false
        };
    }

    throw new Error(
        "No fue posible actualizar los datos de la sesión."
    );
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

        const contenidoJSON =
            decodeURIComponent(
                window
                    .atob(contenidoBase64)
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

        return JSON.parse(contenidoJSON);
    } catch (error) {
        console.error(
            "No fue posible decodificar el nuevo token:",
            error
        );

        return null;
    }
}

function obtenerRutaRedireccion(
    rutaServidor,
    rol
) {
    if (
        typeof rutaServidor === "string" &&
        rutaServidor.trim()
    ) {
        return (
            "../" +
            rutaServidor
                .trim()
                .replace(/^\/+/, "")
        );
    }

    return obtenerRutaPorRol(rol);
}

function redirigirSegunRol(rol) {
    window.location.replace(
        obtenerRutaPorRol(rol)
    );
}

function obtenerRutaPorRol(rol) {
    switch (Number(rol)) {
        case 1:
            return "./homeAdmin.html";

        case 2:
            return "./homeProfesor.html";

        case 3:
            return "./homeEstudiante.html";

        default:
            return "./inicio_sesion.html";
    }
}

function cerrarSesionYRedirigir(mensaje) {
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

function formularioBloqueado(bloqueado) {
    const formulario = document.getElementById(
        "form_cambio_contrasena"
    );

    if (!formulario) {
        return;
    }

    const controles = formulario.querySelectorAll(
        "input, button"
    );

    controles.forEach(function (control) {
        control.disabled = bloqueado;
    });
}

function mostrarMensajeCambioContrasena(
    mensaje,
    tipo
) {
    const elemento = document.getElementById(
        "mensaje-cambio-contrasena"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = false;
    elemento.textContent = mensaje;
    elemento.className =
        `mensaje-inicio-sesion mensaje-${tipo}`;
}

function ocultarMensajeCambioContrasena() {
    const elemento = document.getElementById(
        "mensaje-cambio-contrasena"
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = true;
    elemento.textContent = "";
    elemento.className =
        "mensaje-inicio-sesion";
}
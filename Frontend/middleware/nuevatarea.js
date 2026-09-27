document.addEventListener("DOMContentLoaded", function () {
    inicializarFormularioNuevaTarea();
});

function inicializarFormularioNuevaTarea() {
    const parametrosURL = new URLSearchParams(
        window.location.search
    );

    const idGrupo = parametrosURL.get("id");

    const formulario = document.getElementById(
        "nuevaTareaForm"
    );

    const idGrupoInput = document.getElementById(
        "idGrupo"
    );

    const botonCrear = document.getElementById(
        "buttsubmit"
    );

    if (!formulario || !idGrupoInput || !botonCrear) {
        console.error(
            "No se encontraron los elementos del formulario de nueva tarea."
        );

        return;
    }

    if (!idGrupo) {
        alert(
            "Error: No se pudo encontrar el ID del grupo en la URL."
        );

        botonCrear.disabled = true;

        return;
    }

    idGrupoInput.value = idGrupo;

    configurarSelectorFecha();
    cargarTemasExistentes(idGrupo);

    formulario.addEventListener(
        "submit",
        crearNuevaTarea
    );
}

function configurarSelectorFecha() {
    const campoFecha = document.getElementById(
        "fechavencimiento"
    );

    const contenedorFecha = document.getElementById(
        "contenedorFechaVencimiento"
    );

    const botonCalendario = document.getElementById(
        "abrirCalendario"
    );

    if (!campoFecha) {
        return;
    }

    actualizarFechaMinima(campoFecha);

    campoFecha.addEventListener("click", function () {
        abrirSelectorFecha(campoFecha);
    });

    campoFecha.addEventListener("focus", function () {
        actualizarFechaMinima(campoFecha);
    });

    if (contenedorFecha) {
        contenedorFecha.addEventListener(
            "click",
            function (event) {
                if (
                    event.target === campoFecha ||
                    event.target.closest(
                        "#abrirCalendario"
                    )
                ) {
                    return;
                }

                abrirSelectorFecha(campoFecha);
            }
        );
    }

    if (botonCalendario) {
        botonCalendario.addEventListener(
            "click",
            function () {
                abrirSelectorFecha(campoFecha);
            }
        );
    }
}

function abrirSelectorFecha(campoFecha) {
    if (!campoFecha || campoFecha.disabled) {
        return;
    }

    actualizarFechaMinima(campoFecha);
    campoFecha.focus();

    if (typeof campoFecha.showPicker === "function") {
        try {
            campoFecha.showPicker();
        } catch (error) {
            console.warn(
                "El navegador no permitió abrir automáticamente el selector de fecha.",
                error
            );
        }
    }
}

function actualizarFechaMinima(campoFecha) {
    const ahora = new Date();

    ahora.setSeconds(0, 0);

    campoFecha.min = convertirFechaAInput(ahora);
}

function convertirFechaAInput(fecha) {
    const ano = fecha.getFullYear();

    const mes = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fecha.getDate()
    ).padStart(2, "0");

    const horas = String(
        fecha.getHours()
    ).padStart(2, "0");

    const minutos = String(
        fecha.getMinutes()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}

async function cargarTemasExistentes(idGrupo) {
    const listaTemas = document.getElementById(
        "listaTemas"
    );

    if (!listaTemas) {
        return;
    }

    try {
        const response = await fetch(
            `/Escuelapp/tareas?id=${encodeURIComponent(idGrupo)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "No fue posible consultar los temas existentes."
            );
        }

        const temasUnicos = new Map();

        data.tareas.forEach(function (tarea) {
            const tema = normalizarTexto(tarea.tema);

            if (
                !tema ||
                tema.toLocaleLowerCase("es") === "sin tema"
            ) {
                return;
            }

            const claveTema =
                tema.toLocaleLowerCase("es");

            if (!temasUnicos.has(claveTema)) {
                temasUnicos.set(claveTema, tema);
            }
        });

        const temasOrdenados = Array.from(
            temasUnicos.values()
        ).sort(function (temaA, temaB) {
            return temaA.localeCompare(
                temaB,
                "es",
                {
                    sensitivity: "base"
                }
            );
        });

        listaTemas.replaceChildren();

        temasOrdenados.forEach(function (tema) {
            const opcion = document.createElement(
                "option"
            );

            opcion.value = tema;
            listaTemas.appendChild(opcion);
        });
    } catch (error) {
        console.warn(
            "No se pudieron cargar los temas existentes:",
            error
        );

        listaTemas.replaceChildren();
    }
}

async function crearNuevaTarea(event) {
    event.preventDefault();

    const formulario = event.currentTarget;

    const idGrupo = document.getElementById(
        "idGrupo"
    ).value.trim();

    const tema = normalizarTexto(
        document.getElementById("tema").value
    );

    const nombre = normalizarTexto(
        document.getElementById("nombreTarea").value
    );

    const descripcion = normalizarTexto(
        document.getElementById("descripcion").value
    );

    const doctarea = normalizarTexto(
        document.getElementById(
            "documentoReferencia"
        ).value
    );

    const fechavencimiento =
        document.getElementById(
            "fechavencimiento"
        ).value;

    const botonCrear = document.getElementById(
        "buttsubmit"
    );

    if (
        !idGrupo ||
        !tema ||
        !nombre ||
        !descripcion ||
        !doctarea ||
        !fechavencimiento
    ) {
        alert(
            "Por favor, complete todos los campos."
        );

        return;
    }

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    if (!esURLValida(doctarea)) {
        alert(
            "El documento de referencia debe ser una dirección URL válida."
        );

        document.getElementById(
            "documentoReferencia"
        ).focus();

        return;
    }

    const fechaVencimiento = new Date(
        fechavencimiento
    );

    if (
        Number.isNaN(fechaVencimiento.getTime())
    ) {
        alert(
            "La fecha de vencimiento seleccionada no es válida."
        );

        return;
    }

    if (
        fechaVencimiento.getTime() <= Date.now()
    ) {
        alert(
            "La fecha de vencimiento debe ser posterior a la fecha y hora actuales."
        );

        abrirSelectorFecha(
            document.getElementById(
                "fechavencimiento"
            )
        );

        return;
    }

    const datosTarea = {
        tema,
        nombre,
        descripcion,
        doctarea,
        fechavencimiento
    };

    botonCrear.disabled = true;
    botonCrear.value = "Creando tarea...";

    try {
        const response = await fetch(
            `/Escuelapp/NewTarea?id=${encodeURIComponent(idGrupo)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datosTarea)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "No fue posible crear la tarea."
            );
        }

        alert(
            result.message ||
            "¡Tarea creada y asignada exitosamente!"
        );

        window.history.back();
    } catch (error) {
        console.error(
            "Error al crear la tarea:",
            error
        );

        alert(
            `No se pudo crear la tarea. ${error.message}`
        );

        botonCrear.disabled = false;
        botonCrear.value = "Crear tarea";
    }
}

function normalizarTexto(valor) {
    return typeof valor === "string"
        ? valor.trim().replace(/\s+/g, " ")
        : "";
}

function esURLValida(valor) {
    try {
        const url = new URL(valor);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );
    } catch (error) {
        return false;
    }
}
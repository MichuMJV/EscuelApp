let tareasEstudiantePorId = new Map();

document.addEventListener("DOMContentLoaded", function () {
    inicializarPantallaTareasEstudiante();
});

function inicializarPantallaTareasEstudiante() {
    const parametrosURL = new URLSearchParams(
        window.location.search
    );

    const idSalon = parametrosURL.get("id");
    const usuario = obtenerUsuarioSesion();
    const idEstudiante = usuario ? usuario._id : null;

    if (!idSalon || !idEstudiante) {
        alert(
            "Error: No se pudo identificar el salón o el estudiante."
        );

        return;
    }

    window.APP_STATE = {
        idSalon,
        idEstudiante
    };

    const contenedorTareas = document.querySelector(
        ".container_tareas"
    );

    if (contenedorTareas) {
        contenedorTareas.addEventListener(
            "click",
            manejarClicTarea
        );
    }

    configurarCierreModalEstudiante();
    configurarSelectorArchivoEntrega();

    cargarDetallesSalon(idSalon);
    cargarMisTareas(idSalon, idEstudiante);
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

async function cargarDetallesSalon(idSalon) {
    try {
        const response = await fetch(
            `/Escuelapp/GetSalonDetails?id=${encodeURIComponent(idSalon)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "No fue posible cargar los detalles del salón."
            );
        }

        const nombreMateria = document.getElementById(
            "nombreMat"
        );

        const imagenMateria = document.getElementById(
            "imagen"
        );

        if (nombreMateria) {
            nombreMateria.textContent =
                data.nombre || "Materia sin nombre";
        }

        if (imagenMateria) {
            imagenMateria.src = data.logo || "";

            imagenMateria.alt = data.nombre
                ? `Logo de ${data.nombre}`
                : "Logo del salón";
        }
    } catch (error) {
        console.error(
            "Error al cargar los detalles del salón:",
            error
        );

        const nombreMateria = document.getElementById(
            "nombreMat"
        );

        if (nombreMateria) {
            nombreMateria.textContent =
                "No se pudo cargar la materia";
        }
    }
}

async function cargarMisTareas(
    idSalon,
    idEstudiante
) {
    const contenedorTareas = document.querySelector(
        ".container_tareas"
    );

    if (!contenedorTareas) {
        return;
    }

    contenedorTareas.innerHTML =
        "<h4>Cargando tareas...</h4>";

    tareasEstudiantePorId.clear();

    try {
        const response = await fetch(
            `/Escuelapp/GetTareasParaEstudiante` +
            `?idgrupo=${encodeURIComponent(idSalon)}` +
            `&idestudiante=${encodeURIComponent(idEstudiante)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "No fue posible obtener las tareas."
            );
        }

        if (
            !Array.isArray(data.tareas) ||
            data.tareas.length === 0
        ) {
            contenedorTareas.innerHTML =
                "<h2>No hay tareas asignadas para esta materia.</h2>";

            return;
        }

        const tareasOrdenadas = ordenarTareas(
            data.tareas
        );

        tareasOrdenadas.forEach(function (tarea) {
            tareasEstudiantePorId.set(
                tarea._id,
                tarea
            );
        });

        const tareasAgrupadas =
            agruparTareasPorTema(tareasOrdenadas);

        renderizarGruposTareasEstudiante(
            tareasAgrupadas,
            contenedorTareas
        );
    } catch (error) {
        console.error(
            "Error al cargar las tareas:",
            error
        );

        contenedorTareas.innerHTML =
            "<h2>Ocurrió un error al cargar las tareas.</h2>";
    }
}

function ordenarTareas(tareas) {
    return [...tareas].sort(function (tareaA, tareaB) {
        const temaA = obtenerTemaNormalizado(
            tareaA.tema
        );

        const temaB = obtenerTemaNormalizado(
            tareaB.tema
        );

        const temaASinAsignar =
            temaA.toLocaleLowerCase("es") ===
            "sin tema";

        const temaBSinAsignar =
            temaB.toLocaleLowerCase("es") ===
            "sin tema";

        if (temaASinAsignar && !temaBSinAsignar) {
            return 1;
        }

        if (!temaASinAsignar && temaBSinAsignar) {
            return -1;
        }

        const comparacionTemas = temaA.localeCompare(
            temaB,
            "es",
            {
                sensitivity: "base"
            }
        );

        if (comparacionTemas !== 0) {
            return comparacionTemas;
        }

        return obtenerTiempoVencimiento(tareaA) -
            obtenerTiempoVencimiento(tareaB);
    });
}

function obtenerTiempoVencimiento(tarea) {
    if (!tarea.fechavencimiento) {
        return Number.MAX_SAFE_INTEGER;
    }

    const tiempo = new Date(
        tarea.fechavencimiento
    ).getTime();

    return Number.isNaN(tiempo)
        ? Number.MAX_SAFE_INTEGER
        : tiempo;
}

function agruparTareasPorTema(tareas) {
    const grupos = new Map();

    tareas.forEach(function (tarea) {
        const tema = obtenerTemaNormalizado(
            tarea.tema
        );

        const claveTema =
            tema.toLocaleLowerCase("es");

        if (!grupos.has(claveTema)) {
            grupos.set(claveTema, {
                nombre: tema,
                tareas: []
            });
        }

        grupos.get(claveTema).tareas.push({
            ...tarea,
            tema
        });
    });

    return Array.from(grupos.values());
}

function renderizarGruposTareasEstudiante(
    grupos,
    contenedor
) {
    contenedor.replaceChildren();

    grupos.forEach(function (grupo) {
        const seccionTema = document.createElement(
            "section"
        );

        seccionTema.className = "grupo-tema";

        const encabezadoTema = document.createElement(
            "div"
        );

        encabezadoTema.className =
            "encabezado-tema";

        const tituloTema = document.createElement(
            "h2"
        );

        tituloTema.className = "titulo-tema";
        tituloTema.textContent = grupo.nombre;

        const contadorTareas = document.createElement(
            "span"
        );

        contadorTareas.className =
            "contador-tareas";

        contadorTareas.textContent =
            grupo.tareas.length === 1
                ? "1 tarea"
                : `${grupo.tareas.length} tareas`;

        encabezadoTema.appendChild(tituloTema);
        encabezadoTema.appendChild(contadorTareas);

        const listaTareas = document.createElement(
            "div"
        );

        listaTareas.className =
            "lista-tareas-tema";

        grupo.tareas.forEach(function (tarea) {
            listaTareas.appendChild(
                crearTarjetaTareaEstudiante(tarea)
            );
        });

        seccionTema.appendChild(encabezadoTema);
        seccionTema.appendChild(listaTareas);

        contenedor.appendChild(seccionTema);
    });
}

function crearTarjetaTareaEstudiante(tarea) {
    const estadoTarea = obtenerEstadoTarea(tarea);

    const tarjeta = document.createElement("button");

    tarjeta.type = "button";
    tarjeta.className =
        `Tareas ${estadoTarea.clase}`;

    tarjeta.dataset.taskId = tarea._id;

    tarjeta.setAttribute(
        "aria-label",
        `Abrir tarea: ${tarea.nombre || "Sin nombre"}. ` +
        `Estado: ${estadoTarea.texto}.`
    );

    const contenido = document.createElement("div");

    contenido.className = "link_tarea";

    const informacion = document.createElement("div");

    informacion.className = "informacion-tarea";

    const nombreTarea = document.createElement("h4");

    nombreTarea.className = "nombre-tarea";

    nombreTarea.textContent =
        tarea.nombre || "Tarea sin nombre";

    const estado = document.createElement("span");

    estado.className =
        `estado-tarea estado-${estadoTarea.clase}`;

    estado.textContent = estadoTarea.texto;

    informacion.appendChild(nombreTarea);
    informacion.appendChild(estado);

    const informacionNota =
        document.createElement("div");

    informacionNota.className =
        "informacion-nota";

    const etiquetaNota = document.createElement("span");

    etiquetaNota.className = "etiqueta-nota";
    etiquetaNota.textContent = "Nota";

    const valorNota = document.createElement("strong");

    valorNota.className = "valor-nota";

    valorNota.textContent =
        obtenerNotaTarea(tarea);

    informacionNota.appendChild(etiquetaNota);
    informacionNota.appendChild(valorNota);

    const contenedorVencimiento =
        document.createElement("div");

    contenedorVencimiento.className =
        "contenedor_vencimiento";

    const etiquetaVencimiento =
        document.createElement("span");

    etiquetaVencimiento.className =
        "etiqueta-vencimiento";

    etiquetaVencimiento.textContent = "Vence:";

    const fechaVencimiento =
        document.createElement("time");

    fechaVencimiento.className =
        "fecha-vencimiento";

    if (tarea.fechavencimiento) {
        const fecha = new Date(
            tarea.fechavencimiento
        );

        if (!Number.isNaN(fecha.getTime())) {
            fechaVencimiento.dateTime =
                fecha.toISOString();

            fechaVencimiento.textContent =
                formatearFechaLegible(fecha);
        } else {
            fechaVencimiento.textContent =
                "Fecha no válida";
        }
    } else {
        fechaVencimiento.textContent =
            "Sin fecha";
    }

    contenedorVencimiento.appendChild(
        etiquetaVencimiento
    );

    contenedorVencimiento.appendChild(
        fechaVencimiento
    );

    contenido.appendChild(informacion);
    contenido.appendChild(informacionNota);
    contenido.appendChild(
        contenedorVencimiento
    );

    tarjeta.appendChild(contenido);

    return tarjeta;
}

function obtenerEstadoTarea(tarea) {
    const asignacion = tarea.miAsignacion;
    const tieneArchivo = Boolean(asignacion?.archivoEntrega?.archivoId);

    if (tieneArchivo) {
        return { clase: "completada", texto: "Entregada" };
    }

    const fechaVencimiento = new Date(tarea.fechavencimiento);
    if (!Number.isNaN(fechaVencimiento.getTime()) && Date.now() > fechaVencimiento.getTime()) {
        return { clase: "vencida", texto: "Vencida" };
    }

    return { clase: "pendiente", texto: "Pendiente" };
}
function obtenerNotaTarea(tarea) {
    if (
        tarea.miAsignacion &&
        tarea.miAsignacion.nota !== undefined &&
        tarea.miAsignacion.nota !== null &&
        String(tarea.miAsignacion.nota).trim()
    ) {
        return String(tarea.miAsignacion.nota);
    }

    return "Sin calificar";
}

function manejarClicTarea(event) {
    const tarjetaTarea = event.target.closest(
        ".Tareas"
    );

    if (!tarjetaTarea) {
        return;
    }

    const idTarea =
        tarjetaTarea.dataset.taskId;

    const tarea = tareasEstudiantePorId.get(
        idTarea
    );

    if (!tarea) {
        alert(
            "No fue posible cargar la información de la tarea."
        );

        return;
    }

    abrirModalTareaEstudiante(tarea);
}

function abrirModalTareaEstudiante(tarea) {
    const dialogo = document.getElementById("dialogo");
    if (!dialogo) return;

    const asignacion = tarea.miAsignacion || {};
    document.getElementById("dialog_task_topic").textContent = obtenerTemaNormalizado(tarea.tema);
    document.getElementById("dialog_task_title").textContent = tarea.nombre || "Tarea sin nombre";
    document.getElementById("dialog_task_grade").textContent = `Nota: ${obtenerNotaTarea(tarea)}`;
    document.getElementById("dialog_task_description").textContent = tarea.descripcion || "Sin descripción.";
    document.getElementById("dialog_task_due_date").value = formatISODateToInput(tarea.fechavencimiento);
    configurarEnlaceReferencia(document.getElementById("dialog_reference_link"), tarea.doctarea);
    document.getElementById("dialog_submission_link").value = asignacion.docentrega || "";

    const inputArchivo = document.getElementById("dialog_submission_file");
    if (inputArchivo) inputArchivo.value = "";
    document.getElementById("dialog_archivo_seleccionado")?.replaceChildren();

    renderizarMaterialesProfesor(tarea.archivos || []);
    renderizarArchivoEntregado(asignacion.archivoEntrega || null);

    dialogo.dataset.idtarea = tarea._id;
    dialogo.dataset.tieneArchivoEntrega = asignacion.archivoEntrega?.archivoId ? "true" : "false";
    dialogo.showModal();
}
function configurarEnlaceReferencia(
    enlace,
    direccion
) {
    if (!enlace) {
        return;
    }

    if (esURLValida(direccion)) {
        enlace.href = direccion;
        enlace.textContent =
            "Ver material de referencia";

        enlace.removeAttribute(
            "aria-disabled"
        );

        enlace.classList.remove(
            "enlace-deshabilitado"
        );

        return;
    }

    enlace.href = "#";

    enlace.textContent =
        "No hay material de referencia disponible";

    enlace.setAttribute(
        "aria-disabled",
        "true"
    );

    enlace.classList.add(
        "enlace-deshabilitado"
    );
}

async function enviarrespuesta() {
    const dialogo = document.getElementById("dialogo");
    const estado = window.APP_STATE;
    const idTarea = dialogo?.dataset.idtarea;
    const enlace = document.getElementById("dialog_submission_link").value.trim();
    const inputArchivo = document.getElementById("dialog_submission_file");
    const archivo = inputArchivo?.files?.[0] || null;
    const tieneArchivoAnterior = dialogo?.dataset.tieneArchivoEntrega === "true";
    const boton = document.getElementById("botonEnviarEntrega");

    if (!estado?.idEstudiante || !estado?.idSalon || !idTarea) {
        alert("No fue posible identificar la entrega.");
        return;
    }

    if (!archivo && !tieneArchivoAnterior) {
        alert("Debes seleccionar un archivo para entregar la tarea.");
        inputArchivo?.focus();
        return;
    }

    if (enlace && !esURLValida(enlace)) {
        alert("El enlace opcional debe ser una dirección URL válida.");
        return;
    }

    if (archivo && archivo.size > 25 * 1024 * 1024) {
        alert("El archivo seleccionado supera el límite de 25 MB.");
        inputArchivo.value = "";
        return;
    }

    const datos = new FormData();
    datos.append("idtarea", idTarea);
    datos.append("idestudiante", estado.idEstudiante);
    datos.append("docentrega", enlace);
    if (archivo) datos.append("archivoEntrega", archivo, archivo.name);

    boton.disabled = true;
    boton.textContent = archivo ? "Subiendo archivo..." : "Actualizando entrega...";

    try {
        const response = await fetch("/Escuelapp/EstudianteEntregaTarea", {
            method: "POST",
            body: datos
        });
        const resultado = await response.json();
        if (!response.ok || !resultado.success) {
            throw new Error(resultado.message || "No fue posible entregar la tarea.");
        }
        alert(resultado.message || "Archivo entregado exitosamente.");
        cerrarModalTareaEstudiante();
        await cargarMisTareas(estado.idSalon, estado.idEstudiante);
    } catch (error) {
        console.error("Error al enviar la tarea:", error);
        alert(`No se pudo entregar la tarea. ${error.message}`);
    } finally {
        boton.disabled = false;
        boton.textContent = "Enviar entrega";
    }
}
function configurarSelectorArchivoEntrega() {
    const input = document.getElementById("dialog_submission_file");
    const lista = document.getElementById("dialog_archivo_seleccionado");
    if (!input || !lista) return;

    input.addEventListener("change", function () {
        lista.replaceChildren();
        const archivo = input.files?.[0];
        if (!archivo) return;
        if (archivo.size > 25 * 1024 * 1024) {
            alert("El archivo supera el límite de 25 MB.");
            input.value = "";
            return;
        }
        const item = document.createElement("p");
        item.className = "archivo-seleccionado";
        item.textContent = `${archivo.name} (${formatearTamanoArchivo(archivo.size)})`;
        lista.appendChild(item);
    });
}

function renderizarMaterialesProfesor(archivos) {
    const contenedor = document.getElementById("dialog_materiales_profesor");
    if (!contenedor) return;
    contenedor.replaceChildren();

    if (!Array.isArray(archivos) || archivos.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "texto-ayuda-modal";
        mensaje.textContent = "Sin archivos adjuntos.";
        contenedor.appendChild(mensaje);
        return;
    }

    archivos.forEach(function (archivo) {
        const enlace = document.createElement("a");
        enlace.className = "material-profesor-item";
        enlace.href = archivo.urlDescarga || "#";
        enlace.textContent = `${archivo.nombre || "Archivo"} (${formatearTamanoArchivo(archivo.tamano)})`;
        if (!archivo.urlDescarga) {
            enlace.setAttribute("aria-disabled", "true");
            enlace.addEventListener("click", event => event.preventDefault());
        }
        contenedor.appendChild(enlace);
    });
}

function renderizarArchivoEntregado(archivo) {
    const contenedor = document.getElementById("dialog_archivo_entregado");
    if (!contenedor) return;
    contenedor.replaceChildren();

    if (!archivo?.archivoId) {
        const mensaje = document.createElement("p");
        mensaje.className = "texto-ayuda-modal";
        mensaje.textContent = "No has entregado un archivo.";
        contenedor.appendChild(mensaje);
        return;
    }

    const info = document.createElement("div");
    info.className = "informacion-archivo-entregado";
    const nombre = document.createElement("strong");
    nombre.textContent = archivo.nombre || "Archivo entregado";
    const tamano = document.createElement("small");
    tamano.textContent = formatearTamanoArchivo(archivo.tamano);
    info.append(nombre, tamano);
    contenedor.appendChild(info);

    if (archivo.urlDescarga) {
        const descargar = document.createElement("a");
        descargar.className = "boton-descargar-entrega";
        descargar.href = archivo.urlDescarga;
        descargar.textContent = "Descargar mi archivo";
        contenedor.appendChild(descargar);
    }
}

function formatearTamanoArchivo(bytes) {
    const numero = Number(bytes || 0);
    if (!Number.isFinite(numero) || numero <= 0) return "Tamaño no disponible";
    return numero < 1024 * 1024
        ? `${(numero / 1024).toFixed(1)} KB`
        : `${(numero / 1024 / 1024).toFixed(1)} MB`;
}

function obtenerTemaNormalizado(tema) {
    if (typeof tema !== "string") {
        return "Sin tema";
    }

    const temaLimpio = tema
        .trim()
        .replace(/\s+/g, " ");

    return temaLimpio || "Sin tema";
}

function formatISODateToInput(fechaISO) {
    if (!fechaISO) {
        return "";
    }

    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        return "";
    }

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

function formatearFechaLegible(fecha) {
    return new Intl.DateTimeFormat(
        "es-PA",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(fecha);
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

function configurarCierreModalEstudiante() {
    const dialogo = document.getElementById(
        "dialogo"
    );

    if (!dialogo) {
        return;
    }

    dialogo.addEventListener(
        "click",
        function (event) {
            if (event.target === dialogo) {
                cerrarModalTareaEstudiante();
            }
        }
    );

    dialogo.addEventListener(
        "close",
        function () {
            delete dialogo.dataset.idtarea;
        }
    );

    const enlaceReferencia =
        document.getElementById(
            "dialog_reference_link"
        );

    if (enlaceReferencia) {
        enlaceReferencia.addEventListener(
            "click",
            function (event) {
                if (
                    enlaceReferencia.getAttribute(
                        "aria-disabled"
                    ) === "true"
                ) {
                    event.preventDefault();
                }
            }
        );
    }
}

function cerrarModalTareaEstudiante() {
    const dialogo = document.getElementById(
        "dialogo"
    );

    if (dialogo && dialogo.open) {
        dialogo.close();
    }
}
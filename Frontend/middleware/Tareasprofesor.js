let temasDisponiblesProfesor = [];
let archivosActualesProfesor = [];
let archivosMarcadosParaEliminar = new Set();

document.addEventListener("DOMContentLoaded", function () {
    const contenedorTareas = document.querySelector(
        ".container_tareas"
    );

    if (contenedorTareas) {
        contenedorTareas.addEventListener(
            "click",
            manejarClicTarea
        );
    }

    configurarSelectorFechaModal();
    configurarCierreModal();
    configurarSelectorArchivosProfesor();

    cargarDetallesSalon();
});

async function cargarDetallesSalon() {
    const parametrosURL = new URLSearchParams(
        window.location.search
    );

    const idSalon = parametrosURL.get("id");
    const contenedorTareas = document.querySelector(
        ".container_tareas"
    );

    if (!idSalon) {
        if (contenedorTareas) {
            contenedorTareas.innerHTML =
                "<h2>No se encontró el ID del salón.</h2>";
        }

        return;
    }

    try {
        const response = await fetch(
            `/Escuelapp/GetSalonDetails?id=${encodeURIComponent(idSalon)}`
        );

        const salon = await response.json();

        if (!response.ok) {
            throw new Error(
                salon.message ||
                "No fue posible cargar los detalles del salón."
            );
        }

        const imagenSalon = document.getElementById("imagen");
        const nombreMateria = document.getElementById("nombreMat");
        const codigoSalon = document.getElementById("codigo");

        if (imagenSalon) {
            imagenSalon.src = salon.logo || "";
            imagenSalon.alt = salon.nombre
                ? `Logo de ${salon.nombre}`
                : "Logo del salón";
        }

        if (nombreMateria) {
            nombreMateria.textContent =
                salon.nombre || "Materia sin nombre";
        }

        if (codigoSalon) {
            codigoSalon.textContent =
                salon.clave || "Sin código";
        }

        await cargarTareas(idSalon);
    } catch (error) {
        console.error(
            "Error al cargar los detalles del salón:",
            error
        );

        if (contenedorTareas) {
            contenedorTareas.innerHTML =
                "<h2>No se pudieron cargar los datos del salón.</h2>";
        }
    }
}

async function cargarTareas(idSalon) {
    const contenedorTareas = document.querySelector(
        ".container_tareas"
    );

    if (!contenedorTareas) {
        return;
    }

    contenedorTareas.innerHTML =
        "<h4>Cargando tareas...</h4>";

    try {
        const response = await fetch(
            `/Escuelapp/tareas?id=${encodeURIComponent(idSalon)}` +
            `&idusuario=${encodeURIComponent(obtenerIdProfesorSesion())}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Error al obtener las tareas."
            );
        }

        if (
            !Array.isArray(data.tareas) ||
            data.tareas.length === 0
        ) {
            temasDisponiblesProfesor = [];
            actualizarOpcionesTemasModal([]);

            contenedorTareas.innerHTML =
                "<h2>No hay tareas asignadas para esta materia.</h2>";

            return;
        }

        const tareasOrdenadas = ordenarTareas(
            data.tareas
        );

        temasDisponiblesProfesor =
            obtenerTemasUnicos(tareasOrdenadas);

        actualizarOpcionesTemasModal(
            temasDisponiblesProfesor
        );

        const tareasAgrupadas =
            agruparTareasPorTema(tareasOrdenadas);

        renderizarGruposTareas(
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
            tema: tema
        });
    });

    return Array.from(grupos.values());
}

function obtenerTemasUnicos(tareas) {
    const temas = new Map();

    tareas.forEach(function (tarea) {
        const tema = obtenerTemaNormalizado(
            tarea.tema
        );

        if (
            tema.toLocaleLowerCase("es") ===
            "sin tema"
        ) {
            return;
        }

        const clave =
            tema.toLocaleLowerCase("es");

        if (!temas.has(clave)) {
            temas.set(clave, tema);
        }
    });

    return Array.from(temas.values()).sort(
        function (temaA, temaB) {
            return temaA.localeCompare(
                temaB,
                "es",
                {
                    sensitivity: "base"
                }
            );
        }
    );
}

function renderizarGruposTareas(
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

        const listaTema = document.createElement(
            "div"
        );

        listaTema.className = "lista-tareas-tema";

        grupo.tareas.forEach(function (tarea) {
            listaTema.appendChild(
                crearTarjetaTarea(tarea)
            );
        });

        seccionTema.appendChild(encabezadoTema);
        seccionTema.appendChild(listaTema);
        contenedor.appendChild(seccionTema);
    });
}

function crearTarjetaTarea(tarea) {
    const tarjeta = document.createElement("button");

    tarjeta.type = "button";
    tarjeta.className = "Tareas";
    tarjeta.dataset.taskId = tarea._id;
    tarjeta.setAttribute(
        "aria-label",
        `Editar tarea: ${tarea.nombre || "Sin nombre"}`
    );

    const contenido = document.createElement("div");

    contenido.className = "link_tarea";

    const informacion = document.createElement("div");

    informacion.className = "informacion-tarea";

    const nombre = document.createElement("h4");

    nombre.className = "nombre-tarea";
    nombre.textContent =
        tarea.nombre || "Tarea sin nombre";

    const descripcion = document.createElement("p");

    descripcion.className =
        "descripcion-tarea trim";

    descripcion.textContent =
        tarea.descripcion || "Sin descripción";

    informacion.appendChild(nombre);
    informacion.appendChild(descripcion);

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
    contenido.appendChild(
        contenedorVencimiento
    );

    tarjeta.appendChild(contenido);

    return tarjeta;
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

function obtenerTemaNormalizado(tema) {
    if (typeof tema !== "string") {
        return "Sin tema";
    }

    const temaLimpio = tema
        .trim()
        .replace(/\s+/g, " ");

    return temaLimpio || "Sin tema";
}

function normalizarTexto(valor) {
    return typeof valor === "string"
        ? valor.trim().replace(/\s+/g, " ")
        : "";
}

function NuevaTarea() {
    const parametrosURL = new URLSearchParams(
        window.location.search
    );

    const idGrupo = parametrosURL.get("id");

    if (!idGrupo) {
        alert(
            "Error: No se pudo identificar la materia para crear la tarea."
        );

        return;
    }

    window.location.href =
        `./Nueva_tarea.html?id=${encodeURIComponent(idGrupo)}`;
}

async function manejarClicTarea(event) {
    const tarjetaTarea = event.target.closest(
        ".Tareas"
    );

    if (!tarjetaTarea) {
        return;
    }

    const idTarea =
        tarjetaTarea.dataset.taskId;

    if (!idTarea) {
        alert(
            "No fue posible identificar la tarea seleccionada."
        );

        return;
    }

    await abrirTareaEnModal(idTarea);
}

async function abrirTareaEnModal(idTarea) {
    const dialogo = document.getElementById("dialogo");
    if (!dialogo) return;

    const idProfesor = obtenerIdProfesorSesion();
    if (!idProfesor) {
        alert("No fue posible identificar la sesión del profesor.");
        return;
    }

    try {
        const response = await fetch(
            `/Escuelapp/tarea_unica?id=${encodeURIComponent(idTarea)}` +
            `&idusuario=${encodeURIComponent(idProfesor)}`
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "No fue posible consultar la tarea.");
        }

        const tarea = data.tarea;
        document.getElementById("dialog_task_topic").value = obtenerTemaNormalizado(tarea.tema);
        document.getElementById("dialog_task_title").value = tarea.nombre || "";
        document.getElementById("dialog_task_description").value = tarea.descripcion || "";
        document.getElementById("dialog_task_reference").value = tarea.doctarea || "";

        const campoFecha = document.getElementById("dialog_task_due_date");
        campoFecha.value = formatISODateToInput(tarea.fechavencimiento);
        actualizarFechaMinimaModal(campoFecha);

        archivosActualesProfesor = Array.isArray(tarea.archivos) ? tarea.archivos : [];
        archivosMarcadosParaEliminar.clear();

        const inputNuevos = document.getElementById("dialog_archivos_nuevos");
        if (inputNuevos) inputNuevos.value = "";

        renderizarArchivosActualesProfesor();
        renderizarArchivosNuevosProfesor();

        dialogo.dataset.currentTaskId = idTarea;
        dialogo.showModal();
    } catch (error) {
        console.error("Error al abrir la tarea:", error);
        alert(`No se pudieron cargar los detalles de la tarea. ${error.message}`);
    }
}
async function actualizarTarea() {
    const dialogo = document.getElementById("dialogo");
    const idTarea = dialogo?.dataset.currentTaskId;
    const botonActualizar = document.getElementById("botonActualizarTarea");

    if (!idTarea) {
        alert("No se puede identificar la tarea a actualizar.");
        return;
    }

    const tema = normalizarTexto(document.getElementById("dialog_task_topic").value);
    const nombre = normalizarTexto(document.getElementById("dialog_task_title").value);
    const descripcion = normalizarTexto(document.getElementById("dialog_task_description").value);
    const doctarea = document.getElementById("dialog_task_reference").value.trim();
    const fechavencimiento = document.getElementById("dialog_task_due_date").value;
    const inputArchivos = document.getElementById("dialog_archivos_nuevos");
    const archivosNuevos = Array.from(inputArchivos?.files || []);

    const archivosConservados = archivosActualesProfesor.filter(
        archivo => !archivosMarcadosParaEliminar.has(String(archivo.archivoId))
    ).length;

    if (!tema || !nombre || !descripcion || !fechavencimiento) {
        alert("Completa el tema, nombre, descripción y fecha de vencimiento.");
        return;
    }

    if (doctarea && !esURLValida(doctarea)) {
        alert("El enlace opcional debe ser una dirección URL válida.");
        return;
    }

    if (archivosConservados + archivosNuevos.length === 0) {
        alert("La tarea debe conservar o agregar al menos un archivo adjunto.");
        return;
    }

    if (archivosConservados + archivosNuevos.length > 5) {
        alert("Una tarea puede tener como máximo 5 archivos adjuntos.");
        return;
    }

    if (archivosNuevos.some(archivo => archivo.size > 25 * 1024 * 1024)) {
        alert("Cada archivo debe pesar como máximo 25 MB.");
        return;
    }

    const fecha = new Date(fechavencimiento);
    if (Number.isNaN(fecha.getTime()) || fecha.getTime() <= Date.now()) {
        alert("La fecha de vencimiento debe ser posterior a la fecha actual.");
        return;
    }

    const datos = new FormData();
    datos.append("tema", tema);
    datos.append("nombre", nombre);
    datos.append("descripcion", descripcion);
    datos.append("doctarea", doctarea);
    datos.append("fechavencimiento", fechavencimiento);
    datos.append("eliminarArchivos", JSON.stringify(Array.from(archivosMarcadosParaEliminar)));
    archivosNuevos.forEach(archivo => datos.append("archivosTarea", archivo, archivo.name));

    botonActualizar.disabled = true;
    botonActualizar.textContent = "Actualizando...";

    try {
        const response = await fetch(
            `/Escuelapp/UpdateTarea?id=${encodeURIComponent(idTarea)}`,
            { method: "PUT", body: datos }
        );
        const resultado = await response.json();
        if (!response.ok || !resultado.success) {
            throw new Error(resultado.message || "No fue posible actualizar la tarea.");
        }

        alert(resultado.message || "Tarea actualizada correctamente.");
        cerrarModalTarea();
        const idSalon = new URLSearchParams(window.location.search).get("id");
        if (idSalon) await cargarTareas(idSalon);
    } catch (error) {
        console.error("Error al actualizar la tarea:", error);
        alert(`No se pudo actualizar la tarea. ${error.message}`);
    } finally {
        botonActualizar.disabled = false;
        botonActualizar.textContent = "Actualizar tarea";
    }
}
function obtenerIdProfesorSesion() {
    const datos = localStorage.getItem("sesionEscuelApp");
    if (!datos) return "";
    try {
        const usuario = JSON.parse(datos);
        return usuario?._id || usuario?.id || "";
    } catch (error) {
        console.error("No fue posible interpretar la sesión:", error);
        return "";
    }
}

function configurarSelectorArchivosProfesor() {
    const input = document.getElementById("dialog_archivos_nuevos");
    if (!input) return;

    input.addEventListener("change", function () {
        const archivosNuevos = Array.from(input.files || []);
        const conservados = archivosActualesProfesor.filter(
            archivo => !archivosMarcadosParaEliminar.has(String(archivo.archivoId))
        ).length;

        if (conservados + archivosNuevos.length > 5) {
            alert("Una tarea puede tener como máximo 5 archivos adjuntos.");
            input.value = "";
        } else if (archivosNuevos.some(archivo => archivo.size > 25 * 1024 * 1024)) {
            alert("Cada archivo debe pesar como máximo 25 MB.");
            input.value = "";
        }

        renderizarArchivosNuevosProfesor();
    });
}

function renderizarArchivosActualesProfesor() {
    const contenedor = document.getElementById("dialog_archivos_actuales");
    if (!contenedor) return;
    contenedor.replaceChildren();

    if (archivosActualesProfesor.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "texto-ayuda-modal";
        mensaje.textContent = "Sin archivos adjuntos.";
        contenedor.appendChild(mensaje);
        return;
    }

    archivosActualesProfesor.forEach(function (archivo) {
        const id = String(archivo.archivoId);
        const marcado = archivosMarcadosParaEliminar.has(id);
        const fila = document.createElement("div");
        fila.className = marcado ? "archivo-actual-item archivo-marcado-eliminar" : "archivo-actual-item";

        const info = document.createElement("div");
        info.className = "informacion-archivo-adjunto";
        const nombre = document.createElement("strong");
        nombre.textContent = archivo.nombre || "Archivo";
        const tamano = document.createElement("small");
        tamano.textContent = formatearTamanoProfesor(archivo.tamano);
        info.append(nombre, tamano);

        const acciones = document.createElement("div");
        acciones.className = "acciones-archivo-adjunto";

        if (archivo.urlDescarga) {
            const descargar = document.createElement("a");
            descargar.className = "boton-descargar-adjunto";
            descargar.href = archivo.urlDescarga;
            descargar.textContent = "Descargar";
            acciones.appendChild(descargar);
        }

        const retirar = document.createElement("button");
        retirar.type = "button";
        retirar.className = "boton-retirar-adjunto";
        retirar.textContent = marcado ? "Conservar" : "Retirar";
        retirar.addEventListener("click", function () {
            if (marcado) archivosMarcadosParaEliminar.delete(id);
            else archivosMarcadosParaEliminar.add(id);
            renderizarArchivosActualesProfesor();
        });
        acciones.appendChild(retirar);
        fila.append(info, acciones);
        contenedor.appendChild(fila);
    });
}

function renderizarArchivosNuevosProfesor() {
    const input = document.getElementById("dialog_archivos_nuevos");
    const contenedor = document.getElementById("dialog_lista_archivos_nuevos");
    if (!input || !contenedor) return;
    contenedor.replaceChildren();

    Array.from(input.files || []).forEach(function (archivo) {
        const item = document.createElement("p");
        item.className = "archivo-seleccionado";
        item.textContent = `${archivo.name} (${formatearTamanoProfesor(archivo.size)})`;
        contenedor.appendChild(item);
    });
}

function formatearTamanoProfesor(bytes) {
    const numero = Number(bytes || 0);
    if (!Number.isFinite(numero) || numero <= 0) return "Tamaño no disponible";
    return numero < 1024 * 1024
        ? `${(numero / 1024).toFixed(1)} KB`
        : `${(numero / 1024 / 1024).toFixed(1)} MB`;
}

async function eliminarTareaActual() {
    const dialogo = document.getElementById("dialogo");
    const idTarea = dialogo?.dataset.currentTaskId;
    const idProfesor = obtenerIdProfesorSesion();

    if (!idTarea || !idProfesor) {
        alert("No fue posible identificar la tarea o la sesión.");
        return;
    }

    if (!window.confirm("¿Eliminar esta tarea, todas las entregas y sus archivos? Esta acción no se puede deshacer.")) {
        return;
    }

    const boton = document.getElementById("botonEliminarTarea");
    boton.disabled = true;
    boton.textContent = "Eliminando...";

    try {
        const response = await fetch(
            `/Escuelapp/DeleteTarea?id=${encodeURIComponent(idTarea)}` +
            `&idUsuario=${encodeURIComponent(idProfesor)}`,
            { method: "DELETE" }
        );
        const resultado = await response.json();
        if (!response.ok || !resultado.success) {
            throw new Error(resultado.message || "No fue posible eliminar la tarea.");
        }

        alert(resultado.message || "Tarea eliminada correctamente.");
        cerrarModalTarea();
        const idSalon = new URLSearchParams(window.location.search).get("id");
        if (idSalon) await cargarTareas(idSalon);
    } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        alert(`No se pudo eliminar la tarea. ${error.message}`);
    } finally {
        boton.disabled = false;
        boton.textContent = "Eliminar tarea";
    }
}

function actualizarOpcionesTemasModal(temas) {
    const listaOpciones =
        document.getElementById(
            "dialog_topic_options"
        );

    if (!listaOpciones) {
        return;
    }

    listaOpciones.replaceChildren();

    temas.forEach(function (tema) {
        const opcion =
            document.createElement("option");

        opcion.value = tema;
        listaOpciones.appendChild(opcion);
    });
}

function configurarSelectorFechaModal() {
    const campoFecha = document.getElementById(
        "dialog_task_due_date"
    );

    const contenedorFecha =
        document.getElementById(
            "contenedorFechaModal"
        );

    const botonCalendario =
        document.getElementById(
            "abrirCalendarioModal"
        );

    if (!campoFecha) {
        return;
    }

    campoFecha.addEventListener(
        "click",
        function () {
            abrirSelectorFechaModal();
        }
    );

    campoFecha.addEventListener(
        "focus",
        function () {
            actualizarFechaMinimaModal(
                campoFecha
            );
        }
    );

    if (contenedorFecha) {
        contenedorFecha.addEventListener(
            "click",
            function (event) {
                if (
                    event.target === campoFecha ||
                    event.target.closest(
                        "#abrirCalendarioModal"
                    )
                ) {
                    return;
                }

                abrirSelectorFechaModal();
            }
        );
    }

    if (botonCalendario) {
        botonCalendario.addEventListener(
            "click",
            function () {
                abrirSelectorFechaModal();
            }
        );
    }
}

function abrirSelectorFechaModal() {
    const campoFecha = document.getElementById(
        "dialog_task_due_date"
    );

    if (!campoFecha || campoFecha.disabled) {
        return;
    }

    actualizarFechaMinimaModal(campoFecha);
    campoFecha.focus();

    if (
        typeof campoFecha.showPicker ===
        "function"
    ) {
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

function actualizarFechaMinimaModal(
    campoFecha
) {
    const ahora = new Date();

    ahora.setSeconds(0, 0);

    campoFecha.min =
        convertirFechaAInput(ahora);
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

function formatISODateToInput(fechaISO) {
    if (!fechaISO) {
        return "";
    }

    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        return "";
    }

    return convertirFechaAInput(fecha);
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

function configurarCierreModal() {
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
                cerrarModalTarea();
            }
        }
    );

    dialogo.addEventListener(
        "close",
        function () {
            delete dialogo.dataset.currentTaskId;
            archivosActualesProfesor = [];
            archivosMarcadosParaEliminar.clear();
        }
    );
}

function cerrarModalTarea() {
    const dialogo = document.getElementById(
        "dialogo"
    );

    if (dialogo && dialogo.open) {
        dialogo.close();
    }
}
document.addEventListener("DOMContentLoaded", function () {
    inicializarAdministracionMatriculas();
});

let sesionAdministrador = null;
let salonesDisponibles = [];
let salonSeleccionado = null;
let usuariosEstudiantes = [];
let matriculasSalon = [];
let archivoExcelSeleccionado = null;

async function inicializarAdministracionMatriculas() {
    sesionAdministrador = obtenerSesionLocal();

    if (
        !sesionAdministrador ||
        !sesionAdministrador._id
    ) {
        cerrarSesionYRedirigir(
            "No se encontró una sesión válida."
        );

        return;
    }

    if (Number(sesionAdministrador.rol) !== 1) {
        alert(
            "Esta pantalla es exclusiva para administradores."
        );

        redirigirSegunRol(sesionAdministrador.rol);
        return;
    }

    mostrarNombreUsuario(
        sesionAdministrador.nombre
    );

    configurarSelectorSalon();
    configurarSelectorMetodos();
    configurarBusquedaEstudiantes();
    configurarFormularioIndividual();
    configurarCargaExcel();
    configurarTablaMatriculas();
    configurarBotonesGenerales();

    await cargarSalones();
}

function configurarSelectorSalon() {
    const selectorSalon = document.getElementById(
        "selector-salon"
    );

    if (!selectorSalon) {
        return;
    }

    selectorSalon.addEventListener(
        "change",
        async function () {
            const idSalon = selectorSalon.value;

            salonSeleccionado =
                salonesDisponibles.find(
                    function (salon) {
                        return String(salon._id) ===
                            String(idSalon);
                    }
                ) || null;

            limpiarFormularioIndividual();
            limpiarArchivoSeleccionado();
            ocultarResultadoUsuarioNuevo();

            if (!salonSeleccionado) {
                ocultarInformacionSalon();
                establecerMensajeTabla(
                    "Selecciona un salón para consultar sus matrículas."
                );

                return;
            }

            actualizarInformacionSalon();
            await cargarMatriculasSalon();
        }
    );
}

async function cargarSalones() {
    const selectorSalon = document.getElementById(
        "selector-salon"
    );

    if (!selectorSalon) {
        return;
    }

    selectorSalon.disabled = true;
    selectorSalon.innerHTML =
        '<option value="">Cargando salones...</option>';

    try {
        const response = await fetch(
            "/Escuelapp/AllSalones"
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok) {
            throw new Error(
                resultado.message ||
                "No fue posible consultar los salones."
            );
        }

        salonesDisponibles =
            normalizarRespuestaSalones(resultado);

        salonesDisponibles.sort(
            function (salonA, salonB) {
                return String(
                    salonA.nombre || ""
                ).localeCompare(
                    String(salonB.nombre || ""),
                    "es",
                    {
                        sensitivity: "base"
                    }
                );
            }
        );

        renderizarOpcionesSalones();
    } catch (error) {
        console.error(
            "Error al cargar los salones:",
            error
        );

        selectorSalon.innerHTML =
            '<option value="">No fue posible cargar los salones</option>';

        alert(
            error.message ||
            "No fue posible cargar los salones."
        );
    } finally {
        selectorSalon.disabled = false;
    }
}

function normalizarRespuestaSalones(resultado) {
    if (Array.isArray(resultado)) {
        return resultado;
    }

    if (
        resultado &&
        Array.isArray(resultado.SalonData)
    ) {
        return resultado.SalonData;
    }

    if (
        resultado &&
        Array.isArray(resultado.data)
    ) {
        return resultado.data;
    }

    if (
        resultado &&
        Array.isArray(resultado.salones)
    ) {
        return resultado.salones;
    }

    return [];
}

function renderizarOpcionesSalones() {
    const selectorSalon = document.getElementById(
        "selector-salon"
    );

    if (!selectorSalon) {
        return;
    }

    selectorSalon.replaceChildren();

    const opcionInicial =
        document.createElement("option");

    opcionInicial.value = "";

    opcionInicial.textContent =
        salonesDisponibles.length > 0
            ? "Selecciona un salón"
            : "No hay salones registrados";

    selectorSalon.appendChild(opcionInicial);

    salonesDisponibles.forEach(
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

            selectorSalon.appendChild(opcion);
        }
    );
}

function actualizarInformacionSalon() {
    if (!salonSeleccionado) {
        ocultarInformacionSalon();
        return;
    }

    establecerTexto(
        "salon-nombre",
        salonSeleccionado.nombre ||
        "Salón sin nombre"
    );

    establecerTexto(
        "salon-materia",
        salonSeleccionado.materia ||
        "No disponible"
    );

    establecerTexto(
        "salon-grado",
        obtenerGradoSalon(
            salonSeleccionado.grado
        )
    );

    establecerTexto(
        "salon-cupo",
        salonSeleccionado.cupo !== undefined &&
        salonSeleccionado.cupo !== null
            ? salonSeleccionado.cupo
            : "No disponible"
    );

    establecerTexto(
        "salon-matriculados",
        contarMatriculasActivas()
    );

    const informacionSalon =
        document.getElementById(
            "informacion-salon"
        );

    if (informacionSalon) {
        informacionSalon.hidden = false;
    }
}

function ocultarInformacionSalon() {
    const informacionSalon =
        document.getElementById(
            "informacion-salon"
        );

    if (informacionSalon) {
        informacionSalon.hidden = true;
    }
}

function obtenerGradoSalon(grado) {
    if (
        grado === undefined ||
        grado === null ||
        String(grado).trim() === ""
    ) {
        return "No disponible";
    }

    return String(grado);
}

function contarMatriculasActivas() {
    return matriculasSalon.filter(
        function (matricula) {
            return matricula.status !== "Retirado";
        }
    ).length;
}

function configurarSelectorMetodos() {
    const botonesMetodo =
        document.querySelectorAll(
            ".boton-metodo[data-panel]"
        );

    botonesMetodo.forEach(
        function (boton) {
            boton.addEventListener(
                "click",
                function () {
                    activarPanelMetodo(boton);
                }
            );
        }
    );
}

function activarPanelMetodo(botonSeleccionado) {
    const botonesMetodo =
        document.querySelectorAll(
            ".boton-metodo[data-panel]"
        );

    const paneles =
        document.querySelectorAll(
            ".panel-operacion[role='tabpanel']"
        );

    botonesMetodo.forEach(
        function (boton) {
            const estaActivo =
                boton === botonSeleccionado;

            boton.classList.toggle(
                "metodo-activo",
                estaActivo
            );

            boton.setAttribute(
                "aria-selected",
                String(estaActivo)
            );
        }
    );

    paneles.forEach(
        function (panel) {
            panel.hidden =
                panel.id !==
                botonSeleccionado.dataset.panel;
        }
    );
}

function configurarBusquedaEstudiantes() {
    const botonBuscar = document.getElementById(
        "boton-buscar-estudiante"
    );

    const campoBusqueda = document.getElementById(
        "buscador-estudiante"
    );

    if (botonBuscar) {
        botonBuscar.addEventListener(
            "click",
            buscarEstudiantes
        );
    }

    if (campoBusqueda) {
        campoBusqueda.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    buscarEstudiantes();
                }
            }
        );

        campoBusqueda.addEventListener(
            "input",
            function () {
                if (
                    campoBusqueda.value.trim() === ""
                ) {
                    mostrarMensajeResultados(
                        "Escribe un nombre o una cédula para buscar."
                    );
                }
            }
        );
    }

    const contenedorResultados =
        document.getElementById(
            "resultados-busqueda"
        );

    if (contenedorResultados) {
        contenedorResultados.addEventListener(
            "click",
            function (event) {
                const botonSeleccionar =
                    event.target.closest(
                        ".boton-seleccionar-estudiante"
                    );

                if (!botonSeleccionar) {
                    return;
                }

                seleccionarEstudiante(
                    botonSeleccionar.dataset.studentId
                );
            }
        );
    }
}

async function buscarEstudiantes() {
    if (!validarSalonSeleccionado()) {
        return;
    }

    const campoBusqueda = document.getElementById(
        "buscador-estudiante"
    );

    const terminoBusqueda =
        campoBusqueda
            ? campoBusqueda.value.trim()
            : "";

    if (!terminoBusqueda) {
        mostrarMensajeResultados(
            "Escribe un nombre o una cédula para buscar."
        );

        if (campoBusqueda) {
            campoBusqueda.focus();
        }

        return;
    }

    mostrarMensajeResultados(
        "Buscando estudiantes..."
    );

    try {
        const response = await fetch(
            "/Escuelapp/returnUser" +
            "?rol=3" +
            `&buscar=${encodeURIComponent(
                terminoBusqueda
            )}`
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok) {
            throw new Error(
                resultado.message ||
                "No fue posible buscar estudiantes."
            );
        }

        usuariosEstudiantes =
            Array.isArray(resultado)
                ? resultado
                : [];

        renderizarResultadosBusqueda(
            usuariosEstudiantes
        );
    } catch (error) {
        console.error(
            "Error al buscar estudiantes:",
            error
        );

        mostrarMensajeResultados(
            error.message ||
            "No fue posible realizar la búsqueda."
        );
    }
}

function renderizarResultadosBusqueda(
    estudiantes
) {
    const contenedor = document.getElementById(
        "resultados-busqueda"
    );

    if (!contenedor) {
        return;
    }

    contenedor.replaceChildren();

    if (estudiantes.length === 0) {
        const mensaje =
            document.createElement("p");

        mensaje.className = "mensaje-vacio";

        mensaje.textContent =
            "No se encontró una cuenta. Puedes completar el formulario manual para crearla al matricular.";

        contenedor.appendChild(mensaje);
        return;
    }

    estudiantes.forEach(
        function (estudiante) {
            const tarjeta =
                crearTarjetaResultadoBusqueda(
                    estudiante
                );

            contenedor.appendChild(tarjeta);
        }
    );
}

function crearTarjetaResultadoBusqueda(
    estudiante
) {
    const tarjeta =
        document.createElement("article");

    const informacion =
        document.createElement("div");

    const nombre =
        document.createElement("strong");

    const cedula =
        document.createElement("span");

    const estado =
        document.createElement("span");

    const boton =
        document.createElement("button");

    tarjeta.className =
        "tarjeta-resultado-estudiante";

    informacion.className =
        "informacion-resultado-estudiante";

    nombre.textContent =
        estudiante.nombre ||
        "Estudiante sin nombre";

    cedula.textContent =
        `Cédula: ${
            estudiante.cedula ||
            "No disponible"
        }`;

    const matricula =
        buscarMatriculaPorEstudiante(
            estudiante._id
        );

    estado.textContent =
        matricula
            ? matricula.status
            : "Sin matrícula en este salón";

    estado.className =
        matricula &&
        matricula.status === "Retirado"
            ? "estado-resultado estado-retirado"
            : matricula
                ? "estado-resultado estado-activo"
                : "estado-resultado estado-sin-matricula";

    boton.type = "button";

    boton.className =
        "boton-seleccionar-estudiante";

    boton.dataset.studentId =
        estudiante._id;

    boton.textContent = "Seleccionar";

    informacion.appendChild(nombre);
    informacion.appendChild(cedula);
    informacion.appendChild(estado);

    tarjeta.appendChild(informacion);
    tarjeta.appendChild(boton);

    return tarjeta;
}

function seleccionarEstudiante(idEstudiante) {
    const estudiante =
        usuariosEstudiantes.find(
            function (usuario) {
                return String(usuario._id) ===
                    String(idEstudiante);
            }
        );

    if (!estudiante) {
        return;
    }

    const campoId = document.getElementById(
        "id-estudiante-seleccionado"
    );

    const campoNombre = document.getElementById(
        "nombre-estudiante"
    );

    const campoCedula = document.getElementById(
        "cedula-estudiante"
    );

    const campoAccion = document.getElementById(
        "accion-individual"
    );

    const matricula =
        buscarMatriculaPorEstudiante(
            estudiante._id
        );

    if (campoId) {
        campoId.value = estudiante._id;
    }

    if (campoNombre) {
        campoNombre.value =
            estudiante.nombre || "";
    }

    if (campoCedula) {
        campoCedula.value =
            estudiante.cedula || "";
    }

    if (campoAccion) {
        campoAccion.value =
            matricula &&
            matricula.status !== "Retirado"
                ? "RETIRAR"
                : "MATRICULAR";
    }

    ocultarResultadoUsuarioNuevo();

    mostrarMensajeIndividual(
        `Cuenta seleccionada: ${
            estudiante.nombre ||
            "Estudiante"
        }.`,
        "informacion"
    );

    campoNombre?.focus();
}

function buscarMatriculaPorEstudiante(
    idEstudiante
) {
    return matriculasSalon.find(
        function (matricula) {
            return String(
                matricula.idestudiante
            ) === String(idEstudiante);
        }
    );
}

function configurarFormularioIndividual() {
    const formulario = document.getElementById(
        "form-matricula-individual"
    );

    const botonLimpiar = document.getElementById(
        "boton-limpiar-individual"
    );

    if (formulario) {
        formulario.addEventListener(
            "submit",
            procesarMatriculaIndividual
        );
    }

    if (botonLimpiar) {
        botonLimpiar.addEventListener(
            "click",
            limpiarFormularioIndividual
        );
    }

    const botonCopiar = document.getElementById(
        "boton-copiar-credenciales"
    );

    if (botonCopiar) {
        botonCopiar.addEventListener(
            "click",
            copiarCredencialesTemporales
        );
    }
}

async function procesarMatriculaIndividual(
    event
) {
    event.preventDefault();

    if (!validarSalonSeleccionado()) {
        return;
    }

    const campoNombre = document.getElementById(
        "nombre-estudiante"
    );

    const campoCedula = document.getElementById(
        "cedula-estudiante"
    );

    const campoAccion = document.getElementById(
        "accion-individual"
    );

    const botonProcesar = document.getElementById(
        "boton-procesar-individual"
    );

    const nombre = normalizarNombre(
        campoNombre
            ? campoNombre.value
            : ""
    );

    const cedula = normalizarCedula(
        campoCedula
            ? campoCedula.value
            : ""
    );

    const accion =
        campoAccion
            ? campoAccion.value
            : "";

    ocultarMensajeIndividual();
    ocultarResultadoUsuarioNuevo();

    if (!cedula) {
        mostrarMensajeIndividual(
            "La cédula del estudiante es obligatoria.",
            "error"
        );

        campoCedula?.focus();
        return;
    }

    if (
        accion === "MATRICULAR" &&
        !nombre
    ) {
        const usuarioExistente =
            usuariosEstudiantes.find(
                function (usuario) {
                    return normalizarCedula(
                        usuario.cedula
                    ) === cedula;
                }
            );

        if (!usuarioExistente) {
            mostrarMensajeIndividual(
                "El nombre es obligatorio cuando la cuenta no existe.",
                "error"
            );

            campoNombre?.focus();
            return;
        }
    }

    if (!botonProcesar) {
        return;
    }

    botonProcesar.disabled = true;

    botonProcesar.textContent =
        accion === "RETIRAR"
            ? "Retirando..."
            : "Matriculando...";

    try {
        const response = await fetch(
            "/Escuelapp/AdministrarMatriculaIndividual",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    idSalon:
                        salonSeleccionado._id,
                    idAdmin:
                        sesionAdministrador._id,
                    nombre,
                    cedula,
                    accion
                })
            }
        );

        const resultado = await leerRespuestaJSON(
            response
        );

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible procesar la matrícula."
            );
        }

        mostrarMensajeIndividual(
            resultado.message ||
            "La operación fue completada.",
            "exito"
        );

        if (
            resultado.usuarioCreado &&
            resultado.contrasenaTemporal
        ) {
            mostrarResultadoUsuarioNuevo(
                resultado.usuario,
                resultado.contrasenaTemporal
            );
        }

        await actualizarDatosDespuesDeOperacion();

        limpiarFormularioIndividual({
            conservarMensaje: true,
            conservarCredenciales:
                resultado.usuarioCreado === true
        });
    } catch (error) {
        console.error(
            "Error al procesar la matrícula individual:",
            error
        );

        mostrarMensajeIndividual(
            error.message ||
            "No fue posible completar la operación.",
            "error"
        );
    } finally {
        botonProcesar.disabled = false;
        botonProcesar.textContent =
            "Procesar estudiante";
    }
}

function limpiarFormularioIndividual(
    opciones = {}
) {
    const campoId = document.getElementById(
        "id-estudiante-seleccionado"
    );

    const campoNombre = document.getElementById(
        "nombre-estudiante"
    );

    const campoCedula = document.getElementById(
        "cedula-estudiante"
    );

    const campoAccion = document.getElementById(
        "accion-individual"
    );

    const campoBusqueda = document.getElementById(
        "buscador-estudiante"
    );

    if (campoId) {
        campoId.value = "";
    }

    if (campoNombre) {
        campoNombre.value = "";
    }

    if (campoCedula) {
        campoCedula.value = "";
    }

    if (campoAccion) {
        campoAccion.value = "MATRICULAR";
    }

    if (campoBusqueda) {
        campoBusqueda.value = "";
    }

    mostrarMensajeResultados(
        salonSeleccionado
            ? "Busca un estudiante existente o completa el formulario manual."
            : "Selecciona un salón y busca un estudiante para comenzar."
    );

    if (!opciones.conservarMensaje) {
        ocultarMensajeIndividual();
    }

    if (!opciones.conservarCredenciales) {
        ocultarResultadoUsuarioNuevo();
    }
}

function mostrarResultadoUsuarioNuevo(
    usuario,
    contrasena
) {
    const contenedor = document.getElementById(
        "resultado-usuario-nuevo"
    );

    establecerTexto(
        "credencial-cedula",
        usuario && usuario.cedula
            ? usuario.cedula
            : ""
    );

    establecerTexto(
        "credencial-contrasena",
        contrasena
    );

    if (contenedor) {
        contenedor.hidden = false;
        contenedor.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }
}

function ocultarResultadoUsuarioNuevo() {
    const contenedor = document.getElementById(
        "resultado-usuario-nuevo"
    );

    if (contenedor) {
        contenedor.hidden = true;
    }

    establecerTexto(
        "credencial-cedula",
        ""
    );

    establecerTexto(
        "credencial-contrasena",
        ""
    );
}

async function copiarCredencialesTemporales() {
    const cedula = obtenerTextoElemento(
        "credencial-cedula"
    );

    const contrasena = obtenerTextoElemento(
        "credencial-contrasena"
    );

    if (!cedula || !contrasena) {
        return;
    }

    const contenido =
        `Cédula: ${cedula}\n` +
        `Contraseña temporal: ${contrasena}`;

    try {
        await navigator.clipboard.writeText(
            contenido
        );

        mostrarMensajeIndividual(
            "Las credenciales fueron copiadas.",
            "exito"
        );
    } catch (error) {
        console.error(
            "No fue posible copiar las credenciales:",
            error
        );

        mostrarMensajeIndividual(
            "No fue posible copiar automáticamente. Selecciona y copia las credenciales manualmente.",
            "error"
        );
    }
}

function configurarCargaExcel() {
    const botonPlantilla = document.getElementById(
        "boton-descargar-plantilla"
    );

    const formulario = document.getElementById(
        "form-carga-excel"
    );

    const campoArchivo = document.getElementById(
        "archivo-matriculas"
    );

    const botonQuitar = document.getElementById(
        "boton-quitar-archivo"
    );

    const zonaArchivo = document.getElementById(
        "zona-archivo"
    );

    if (botonPlantilla) {
        botonPlantilla.addEventListener(
            "click",
            descargarPlantillaExcel
        );
    }

    if (formulario) {
        formulario.addEventListener(
            "submit",
            procesarArchivoExcel
        );
    }

    if (campoArchivo) {
        campoArchivo.addEventListener(
            "change",
            function () {
                seleccionarArchivoExcel(
                    campoArchivo.files[0]
                );
            }
        );
    }

    if (botonQuitar) {
        botonQuitar.addEventListener(
            "click",
            limpiarArchivoSeleccionado
        );
    }

    configurarArrastrarArchivo(
        zonaArchivo
    );
}

function configurarArrastrarArchivo(
    zonaArchivo
) {
    if (!zonaArchivo) {
        return;
    }

    [
        "dragenter",
        "dragover"
    ].forEach(
        function (nombreEvento) {
            zonaArchivo.addEventListener(
                nombreEvento,
                function (event) {
                    event.preventDefault();

                    zonaArchivo.classList.add(
                        "zona-archivo-activa"
                    );
                }
            );
        }
    );

    [
        "dragleave",
        "drop"
    ].forEach(
        function (nombreEvento) {
            zonaArchivo.addEventListener(
                nombreEvento,
                function (event) {
                    event.preventDefault();

                    zonaArchivo.classList.remove(
                        "zona-archivo-activa"
                    );
                }
            );
        }
    );

    zonaArchivo.addEventListener(
        "drop",
        function (event) {
            const archivo =
                event.dataTransfer.files[0];

            seleccionarArchivoExcel(
                archivo
            );
        }
    );
}

function seleccionarArchivoExcel(archivo) {
    ocultarMensajeExcel();

    if (!archivo) {
        limpiarArchivoSeleccionado();
        return;
    }

    const extension = archivo.name
        .toLowerCase()
        .split(".")
        .pop();

    if (
        !["xlsx", "xls"].includes(extension)
    ) {
        mostrarMensajeExcel(
            "Solo se permiten archivos con extensión .xlsx o .xls.",
            "error"
        );

        limpiarArchivoSeleccionado();
        return;
    }

    const limiteBytes =
        5 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
        mostrarMensajeExcel(
            "El archivo no puede superar los 5 MB.",
            "error"
        );

        limpiarArchivoSeleccionado();
        return;
    }

    archivoExcelSeleccionado = archivo;

    const contenedor = document.getElementById(
        "archivo-seleccionado"
    );

    establecerTexto(
        "nombre-archivo-seleccionado",
        archivo.name
    );

    establecerTexto(
        "tamano-archivo-seleccionado",
        formatearTamanoArchivo(
            archivo.size
        )
    );

    if (contenedor) {
        contenedor.hidden = false;
    }
}

function limpiarArchivoSeleccionado() {
    archivoExcelSeleccionado = null;

    const campoArchivo = document.getElementById(
        "archivo-matriculas"
    );

    const contenedor = document.getElementById(
        "archivo-seleccionado"
    );

    if (campoArchivo) {
        campoArchivo.value = "";
    }

    if (contenedor) {
        contenedor.hidden = true;
    }

    establecerTexto(
        "nombre-archivo-seleccionado",
        ""
    );

    establecerTexto(
        "tamano-archivo-seleccionado",
        ""
    );
}

async function descargarPlantillaExcel() {
    if (!validarSalonSeleccionado()) {
        return;
    }

    const boton = document.getElementById(
        "boton-descargar-plantilla"
    );

    if (boton) {
        boton.disabled = true;
        boton.textContent =
            "Generando plantilla...";
    }

    ocultarMensajeExcel();

    try {
        const url =
            "/Escuelapp/DescargarPlantillaMatriculas" +
            `?idSalon=${encodeURIComponent(
                salonSeleccionado._id
            )}` +
            `&idAdmin=${encodeURIComponent(
                sesionAdministrador._id
            )}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorServidor =
                await leerErrorDescarga(
                    response
                );

            throw new Error(errorServidor);
        }

        const archivo = await response.blob();

        const nombreArchivo =
            obtenerNombreArchivoRespuesta(
                response,
                "plantilla_matriculas.xlsx"
            );

        descargarBlob(
            archivo,
            nombreArchivo
        );

        mostrarMensajeExcel(
            "La plantilla fue descargada correctamente.",
            "exito"
        );
    } catch (error) {
        console.error(
            "Error al descargar la plantilla:",
            error
        );

        mostrarMensajeExcel(
            error.message ||
            "No fue posible descargar la plantilla.",
            "error"
        );
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent =
                "Descargar plantilla";
        }
    }
}

async function procesarArchivoExcel(event) {
    event.preventDefault();

    if (!validarSalonSeleccionado()) {
        return;
    }

    if (!archivoExcelSeleccionado) {
        mostrarMensajeExcel(
            "Selecciona un archivo Excel antes de procesar.",
            "error"
        );

        return;
    }

    const boton = document.getElementById(
        "boton-procesar-excel"
    );

    if (!boton) {
        return;
    }

    boton.disabled = true;

    boton.textContent =
        "Procesando archivo...";

    ocultarMensajeExcel();

    try {
        const datosFormulario =
            new FormData();

        datosFormulario.append(
            "archivo",
            archivoExcelSeleccionado
        );

        datosFormulario.append(
            "idSalon",
            salonSeleccionado._id
        );

        datosFormulario.append(
            "idAdmin",
            sesionAdministrador._id
        );

        const response = await fetch(
            "/Escuelapp/ProcesarMatriculasAdmin",
            {
                method: "POST",
                body: datosFormulario
            }
        );

        if (!response.ok) {
            const mensajeError =
                await leerErrorDescarga(
                    response
                );

            throw new Error(mensajeError);
        }

        const archivoResultados =
            await response.blob();

        const nombreArchivo =
            obtenerNombreArchivoRespuesta(
                response,
                "resultado_matriculas.xlsx"
            );

        descargarBlob(
            archivoResultados,
            nombreArchivo
        );

        mostrarMensajeExcel(
            "El archivo fue procesado. El reporte de resultados se descargó automáticamente.",
            "exito"
        );

        limpiarArchivoSeleccionado();

        await actualizarDatosDespuesDeOperacion();
    } catch (error) {
        console.error(
            "Error al procesar el Excel:",
            error
        );

        mostrarMensajeExcel(
            error.message ||
            "No fue posible procesar el archivo.",
            "error"
        );
    } finally {
        boton.disabled = false;

        boton.textContent =
            "Procesar archivo y descargar resultados";
    }
}

function configurarTablaMatriculas() {
    const checkboxRetirados =
        document.getElementById(
            "mostrar-retirados"
        );

    const cuerpoTabla = document.getElementById(
        "tabla-matriculas-body"
    );

    if (checkboxRetirados) {
        checkboxRetirados.addEventListener(
            "change",
            cargarMatriculasSalon
        );
    }

    if (cuerpoTabla) {
        cuerpoTabla.addEventListener(
            "click",
            function (event) {
                const boton =
                    event.target.closest(
                        ".boton-accion-matricula"
                    );

                if (!boton) {
                    return;
                }

                prepararAccionDesdeTabla(
                    boton.dataset.studentId,
                    boton.dataset.action
                );
            }
        );
    }
}

async function cargarMatriculasSalon() {
    if (!salonSeleccionado) {
        matriculasSalon = [];

        establecerMensajeTabla(
            "Selecciona un salón para consultar sus matrículas."
        );

        actualizarInformacionSalon();
        return;
    }

    establecerMensajeTabla(
        "Cargando matrículas..."
    );

    const incluirRetirados =
        document.getElementById(
            "mostrar-retirados"
        )?.checked === true;

    try {
        const url =
            "/Escuelapp/returnEstudiantesDeGrupo" +
            `?idGrupo=${encodeURIComponent(
                salonSeleccionado._id
            )}` +
            `&incluirRetirados=${String(
                incluirRetirados
            )}`;

        const response = await fetch(url);

        const resultado =
            await leerRespuestaJSON(response);

        if (!response.ok || !resultado.success) {
            throw new Error(
                resultado.message ||
                "No fue posible cargar las matrículas."
            );
        }

        matriculasSalon =
            Array.isArray(resultado.data)
                ? resultado.data
                : [];

        if (resultado.salon) {
            actualizarSalonLocal(
                resultado.salon
            );
        }

        renderizarTablaMatriculas();
        actualizarInformacionSalon();
    } catch (error) {
        console.error(
            "Error al cargar las matrículas:",
            error
        );

        matriculasSalon = [];

        establecerMensajeTabla(
            error.message ||
            "No fue posible cargar las matrículas."
        );
    }
}

function renderizarTablaMatriculas() {
    const cuerpoTabla = document.getElementById(
        "tabla-matriculas-body"
    );

    if (!cuerpoTabla) {
        return;
    }

    cuerpoTabla.replaceChildren();

    if (matriculasSalon.length === 0) {
        establecerMensajeTabla(
            "No se encontraron estudiantes para este salón."
        );

        return;
    }

    matriculasSalon.forEach(
        function (matricula) {
            const fila =
                crearFilaMatricula(
                    matricula
                );

            cuerpoTabla.appendChild(fila);
        }
    );
}

function crearFilaMatricula(matricula) {
    const fila = document.createElement("tr");

    fila.appendChild(
        crearCeldaTexto(
            matricula.nombreEstudiante ||
            matricula.estudiante?.nombre ||
            "Estudiante sin nombre"
        )
    );

    fila.appendChild(
        crearCeldaTexto(
            matricula.cedulaEstudiante ||
            matricula.estudiante?.cedula ||
            "Sin cédula"
        )
    );

    const celdaEstado =
        document.createElement("td");

    const estado =
        document.createElement("span");

    estado.textContent =
        matricula.status ||
        "Matriculado";

    estado.className =
        matricula.status === "Retirado"
            ? "etiqueta-estado estado-retirado"
            : "etiqueta-estado estado-activo";

    celdaEstado.appendChild(estado);

    fila.appendChild(celdaEstado);

    fila.appendChild(
        crearCeldaTexto(
            formatearFecha(
                matricula.fecha
            )
        )
    );

    fila.appendChild(
        crearCeldaTexto(
            matricula.notafinal ||
            "0"
        )
    );

    const celdaAccion =
        document.createElement("td");

    const boton =
        document.createElement("button");

    boton.type = "button";

    boton.className =
        "boton-accion-matricula";

    boton.dataset.studentId =
        matricula.idestudiante;

    if (matricula.status === "Retirado") {
        boton.dataset.action =
            "MATRICULAR";

        boton.textContent =
            "Reactivar";
    } else {
        boton.dataset.action =
            "RETIRAR";

        boton.textContent =
            "Retirar";

        boton.classList.add(
            "accion-retirar"
        );
    }

    celdaAccion.appendChild(boton);

    fila.appendChild(celdaAccion);

    return fila;
}

function prepararAccionDesdeTabla(
    idEstudiante,
    accion
) {
    const matricula =
        matriculasSalon.find(
            function (registro) {
                return String(
                    registro.idestudiante
                ) === String(idEstudiante);
            }
        );

    if (!matricula) {
        return;
    }

    activarPanelMetodo(
        document.getElementById(
            "tab-individual"
        )
    );

    const campoId = document.getElementById(
        "id-estudiante-seleccionado"
    );

    const campoNombre = document.getElementById(
        "nombre-estudiante"
    );

    const campoCedula = document.getElementById(
        "cedula-estudiante"
    );

    const campoAccion = document.getElementById(
        "accion-individual"
    );

    if (campoId) {
        campoId.value =
            matricula.idestudiante;
    }

    if (campoNombre) {
        campoNombre.value =
            matricula.nombreEstudiante ||
            matricula.estudiante?.nombre ||
            "";
    }

    if (campoCedula) {
        campoCedula.value =
            matricula.cedulaEstudiante ||
            matricula.estudiante?.cedula ||
            "";
    }

    if (campoAccion) {
        campoAccion.value = accion;
    }

    ocultarResultadoUsuarioNuevo();

    mostrarMensajeIndividual(
        accion === "RETIRAR"
            ? "El estudiante está listo para ser retirado."
            : "La matrícula está lista para ser reactivada.",
        "informacion"
    );

    document.getElementById(
        "panel-individual"
    )?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function configurarBotonesGenerales() {
    const botonRecargar = document.getElementById(
        "boton-recargar-datos"
    );

    if (botonRecargar) {
        botonRecargar.addEventListener(
            "click",
            async function () {
                botonRecargar.disabled = true;

                botonRecargar.textContent =
                    "Actualizando...";

                try {
                    await cargarSalones();

                    if (salonSeleccionado) {
                        await cargarMatriculasSalon();
                    }
                } finally {
                    botonRecargar.disabled = false;

                    botonRecargar.textContent =
                        "Actualizar información";
                }
            }
        );
    }
}

async function actualizarDatosDespuesDeOperacion() {
    const idSalonActual =
        salonSeleccionado
            ? salonSeleccionado._id
            : null;

    if (!idSalonActual) {
        return;
    }

    await cargarSalones();

    salonSeleccionado =
        salonesDisponibles.find(
            function (salon) {
                return String(salon._id) ===
                    String(idSalonActual);
            }
        ) || null;

    const selectorSalon =
        document.getElementById(
            "selector-salon"
        );

    if (
        selectorSalon &&
        salonSeleccionado
    ) {
        selectorSalon.value =
            salonSeleccionado._id;
    }

    await cargarMatriculasSalon();
}

function actualizarSalonLocal(salonActualizado) {
    const indiceSalon =
        salonesDisponibles.findIndex(
            function (salon) {
                return String(salon._id) ===
                    String(salonActualizado._id);
            }
        );

    if (indiceSalon >= 0) {
        salonesDisponibles[indiceSalon] = {
            ...salonesDisponibles[indiceSalon],
            ...salonActualizado
        };
    }

    if (
        salonSeleccionado &&
        String(salonSeleccionado._id) ===
        String(salonActualizado._id)
    ) {
        salonSeleccionado = {
            ...salonSeleccionado,
            ...salonActualizado
        };
    }
}

function validarSalonSeleccionado() {
    if (salonSeleccionado) {
        return true;
    }

    alert(
        "Primero selecciona el salón donde deseas administrar matrículas."
    );

    document.getElementById(
        "selector-salon"
    )?.focus();

    return false;
}

function volverPanelAdministrativo() {
    window.location.href =
        "./homeAdmin.html";
}

function obtenerSesionLocal() {
    const datos = localStorage.getItem(
        "sesionEscuelApp"
    );

    if (!datos) {
        return null;
    }

    try {
        return JSON.parse(datos);
    } catch (error) {
        console.error(
            "No fue posible interpretar la sesión:",
            error
        );

        return null;
    }
}

function mostrarNombreUsuario(nombre) {
    establecerTexto(
        "username",
        nombre || "Administrador"
    );
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

function redirigirSegunRol(rol) {
    if (Number(rol) === 2) {
        window.location.replace(
            "./homeProfesor.html"
        );

        return;
    }

    if (Number(rol) === 3) {
        window.location.replace(
            "./homeEstudiante.html"
        );

        return;
    }

    window.location.replace(
        "./inicio_sesion.html"
    );
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

async function leerErrorDescarga(response) {
    const tipoContenido =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        tipoContenido.includes(
            "application/json"
        )
    ) {
        const resultado = await response.json();

        return (
            resultado.message ||
            "El servidor no pudo completar la solicitud."
        );
    }

    return (
        await response.text()
    ) || "El servidor no pudo completar la solicitud.";
}

function obtenerNombreArchivoRespuesta(
    response,
    nombrePredeterminado
) {
    const encabezado =
        response.headers.get(
            "content-disposition"
        ) || "";

    const coincidenciaUTF8 =
        encabezado.match(
            /filename\*=UTF-8''([^;]+)/i
        );

    if (coincidenciaUTF8) {
        return decodeURIComponent(
            coincidenciaUTF8[1]
        );
    }

    const coincidenciaNormal =
        encabezado.match(
            /filename="?([^"]+)"?/i
        );

    return coincidenciaNormal
        ? coincidenciaNormal[1]
        : nombrePredeterminado;
}

function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.style.display = "none";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
}

function crearCeldaTexto(texto) {
    const celda = document.createElement("td");

    celda.textContent =
        texto !== undefined &&
        texto !== null &&
        String(texto).trim()
            ? String(texto)
            : "No disponible";

    return celda;
}

function establecerMensajeTabla(mensaje) {
    const cuerpoTabla = document.getElementById(
        "tabla-matriculas-body"
    );

    if (!cuerpoTabla) {
        return;
    }

    const fila = document.createElement("tr");

    const celda = document.createElement("td");

    celda.colSpan = 6;
    celda.className = "mensaje-tabla";
    celda.textContent = mensaje;

    fila.appendChild(celda);

    cuerpoTabla.replaceChildren(fila);
}

function mostrarMensajeResultados(mensaje) {
    const contenedor = document.getElementById(
        "resultados-busqueda"
    );

    if (!contenedor) {
        return;
    }

    const elemento =
        document.createElement("p");

    elemento.className = "mensaje-vacio";
    elemento.textContent = mensaje;

    contenedor.replaceChildren(elemento);
}

function mostrarMensajeIndividual(
    mensaje,
    tipo
) {
    mostrarMensajeOperacion(
        "mensaje-individual",
        mensaje,
        tipo
    );
}

function ocultarMensajeIndividual() {
    ocultarMensajeOperacion(
        "mensaje-individual"
    );
}

function mostrarMensajeExcel(
    mensaje,
    tipo
) {
    mostrarMensajeOperacion(
        "mensaje-excel",
        mensaje,
        tipo
    );
}

function ocultarMensajeExcel() {
    ocultarMensajeOperacion(
        "mensaje-excel"
    );
}

function mostrarMensajeOperacion(
    idElemento,
    mensaje,
    tipo
) {
    const elemento = document.getElementById(
        idElemento
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = false;
    elemento.textContent = mensaje;

    elemento.className =
        `mensaje-operacion mensaje-${tipo}`;
}

function ocultarMensajeOperacion(idElemento) {
    const elemento = document.getElementById(
        idElemento
    );

    if (!elemento) {
        return;
    }

    elemento.hidden = true;
    elemento.textContent = "";

    elemento.className =
        "mensaje-operacion";
}

function establecerTexto(idElemento, valor) {
    const elemento = document.getElementById(
        idElemento
    );

    if (elemento) {
        elemento.textContent =
            valor !== undefined &&
            valor !== null
                ? String(valor)
                : "";
    }
}

function obtenerTextoElemento(idElemento) {
    const elemento = document.getElementById(
        idElemento
    );

    return elemento
        ? elemento.textContent.trim()
        : "";
}

function normalizarNombre(valor) {
    return String(valor || "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizarCedula(valor) {
    return String(valor || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    const fechaObjeto = new Date(fecha);

    if (
        Number.isNaN(fechaObjeto.getTime())
    ) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat(
        "es-PA",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(fechaObjeto);
}

function formatearTamanoArchivo(bytes) {
    if (!Number.isFinite(bytes)) {
        return "";
    }

    if (bytes < 1024) {
        return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}
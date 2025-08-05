// --- Inicia el proceso cuando la página se carga ---
document.addEventListener('DOMContentLoaded', () => {
    loadSalonDetails();
    const container = document.querySelector('.container_tareas');
    container.addEventListener('click', handleTaskClick);
});

// --- Carga los detalles del encabezado del Salón/Materia ---
async function loadSalonDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const idsalon = urlParams.get('id');

    if (!idsalon) {
        document.querySelector('.container_tareas').innerHTML = '<h2>No se encontró el ID del salón.</h2>';
        return;
    }

    try {
        // Obtenemos los detalles del salón (curso)
        let response = await fetch(`http://127.0.0.1:5000/Escuelapp/GetSalonDetails?id=${idsalon}`);
        let salon = await response.json();

        // Llenamos el encabezado de la página
        document.getElementById("imagen").src = salon.logo;
        document.getElementById("nombreMat").innerText = salon.nombre;
        document.getElementById("codigo").innerText = salon.clave;

        // LLAMADA A LA NUEVA FUNCIÓN: Una vez que tenemos los detalles, cargamos las tareas
        await cargarTareas(idsalon);

    } catch (error) {
        console.error("Error al cargar los detalles del salón:", error);
    }
}


// --- NUEVA FUNCIÓN: Carga y muestra las tareas del salón (CORREGIDA) ---
async function cargarTareas(idSalon) {
    const container = document.querySelector('.container_tareas');
    container.innerHTML = '<h4>Cargando tareas...</h4>';

    try {
        const response = await fetch(`http://127.0.0.1:5000/Escuelapp/tareas?id=${idSalon}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al obtener las tareas.');
        }

        if (data.tareas.length === 0) {
            container.innerHTML = '<h2>No hay tareas asignadas para esta materia.</h2>';
            return;
        }

        console.log("Tareas obtenidas:", data.tareas);

        // PASO 1: Crear una variable para almacenar todo el HTML
        let todasLasTareasHTML = '';

        // PASO 2: Llenar la variable en el bucle, sin tocar el DOM
        data.tareas.forEach(tarea => {
            const fechaFormateada = formatISODateToInput(tarea.fechavencimiento);

            const tareaHTML = `
                <a class="Tareas" data-task-id="${tarea._id}">
                    <div id="link_tarea">
                        <h4>${tarea.nombre}</h4>
                        <h4 class="trim">${tarea.descripcion}</h4>
                        <div class="contenedor_vencimiento">
                            <p>Vence:</p>
                            <input type="datetime-local" value="${fechaFormateada}" class="datetime-input" disabled>
                        </div>
                    </div>
                </a>
            `;
            todasLasTareasHTML += tareaHTML;
        });

        // PASO 3: Insertar todo el HTML en el contenedor UNA SOLA VEZ
        container.innerHTML = todasLasTareasHTML;

    } catch (error) {
        console.error("Error al cargar las tareas:", error);
        container.innerHTML = '<h2>Ocurrió un error al cargar las tareas.</h2>';
    }
}

/**
 * Toma un string de fecha ISO (desde MongoDB en UTC) y lo convierte
 * al formato 'YYYY-MM-DDTHH:MM' en la ZONA HORARIA LOCAL del navegador,
 * que es el formato requerido por los inputs de tipo 'datetime-local'.
 */
function formatISODateToInput(isoDate) {
    if (!isoDate) return '';

    // 1. Creamos un objeto Date. JavaScript lo convierte automáticamente a la zona horaria local.
    const date = new Date(isoDate);

    // 2. Extraemos cada componente de la fecha ya en hora local.
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Se suma 1 porque los meses son de 0 a 11
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // 3. Unimos los componentes en el formato correcto.
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
// ... (todo el código que ya tienes en Tareasprofesor.js) ...

// --- FUNCIÓN PARA IR A LA PÁGINA DE CREAR NUEVA TAREA ---
function NuevaTarea() {
    // Paso 1: Leer los parámetros de la URL actual
    const urlParams = new URLSearchParams(window.location.search);
    
    // Paso 2: Obtener el valor del parámetro 'id' (que es el id del salón/materia)
    const idGrupo = urlParams.get('id');

    // Paso 3: Verificar si el ID existe para evitar errores
    if (idGrupo) {
        // Si existe, redirigir a la página del formulario, AÑADIENDO el id como parámetro
        window.location.href = `./Nueva_tarea.html?id=${idGrupo}`;
    } else {
        // Si no hay ID, notificar al usuario que algo anda mal
        alert('Error: No se pudo identificar la materia para crear la tarea.');
    }
}

async function handleTaskClick(event) {
    const taskCard = event.target.closest('.Tareas');
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;
    const dialog = document.getElementById('dialogo');

    try {
        // Usamos el endpoint para buscar los detalles de la tarea
        const response = await fetch(`http://127.0.0.1:5000/Escuelapp/tarea_unica?id=${taskId}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        
        const tarea = data.tarea;

        // LLENAMOS EL DIÁLOGO CON LA INFORMACIÓN OBTENIDA USANDO LOS NUEVOS IDs
        document.getElementById('dialog_task_title').value = tarea.nombre;
        document.getElementById('dialog_task_description').value = tarea.descripcion;
        document.getElementById('dialog_task_reference').value = tarea.doctarea;
        document.getElementById('dialog_task_due_date').value = formatISODateToInput(tarea.fechavencimiento);

        // Guardamos el ID de la tarea actual en el diálogo para usarlo al actualizar   
        dialog.dataset.currentTaskId = taskId;
        
        // MUESTRA EL DIÁLOGO
        dialog.showModal();

    } catch (error) {
        console.error('Error al abrir la tarea:', error);
        alert('No se pudieron cargar los detalles de la tarea.');
    }
}


// --- NUEVA FUNCIÓN PARA EL BOTÓN "ACTUALIZAR" ---
async function actualizarTarea() {
    const dialog = document.getElementById('dialogo');
    const taskId = dialog.dataset.currentTaskId;

    if (!taskId) {
        alert("Error: No se puede identificar la tarea a actualizar.");
        return;
    }

    // Recolectamos los datos actualizados desde los campos del diálogo
    const datosActualizados = {
        nombre: document.getElementById('dialog_task_title').value,
        descripcion: document.getElementById('dialog_task_description').value,
        doctarea: document.getElementById('dialog_task_reference').value,
        fechavencimiento: document.getElementById('dialog_task_due_date').value
    };

    try {
        const response = await fetch(`http://127.0.0.1:5000/Escuelapp/UpdateTarea?id=${taskId}`, {
            method: 'PUT', // Usamos el método PUT para actualizar
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        alert('¡Tarea actualizada correctamente!');
        dialog.close(); // Cerramos el diálogo

        // Refrescamos la lista de tareas para ver los cambios sin recargar la página
        const urlParams = new URLSearchParams(window.location.search);
        const idSalon = urlParams.get('id');
        cargarTareas(idSalon);

    } catch (error) {
        console.error('Error al actualizar la tarea:', error);
        alert('No se pudo actualizar la tarea.');
    }
}
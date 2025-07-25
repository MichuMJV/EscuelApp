// --- Inicia el proceso cuando la página se carga ---
document.addEventListener('DOMContentLoaded', () => {
    loadSalonDetails();
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
                        <h4>Tarea</h4>
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

// --- FUNCIÓN UTILITARIA: Para formatear la fecha de la base de datos ---
function formatISODateToInput(isoDate) {
    if (!isoDate) return '';
    // La fecha de MongoDB (ISO) se corta para que coincida con el formato YYYY-MM-DDTHH:MM
    return isoDate.slice(0, 16);
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
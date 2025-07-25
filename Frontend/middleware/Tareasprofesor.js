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


// --- NUEVA FUNCIÓN: Carga y muestra las tareas del salón ---
async function cargarTareas(idSalon) {
    const container = document.querySelector('.container_tareas');
    container.innerHTML = '<h4>Cargando tareas...</h4>'; // Mensaje de carga

    try {
        // Usamos el endpoint GET que creamos en el backend
        const response = await fetch(`http://127.0.0.1:5000/Escuelapp/tareas?id=${idSalon}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al obtener las tareas.');
        }

        // Limpiamos el contenedor para llenarlo con datos reales
        container.innerHTML = '';

        if (data.tareas.length === 0) {
            container.innerHTML = '<h2>No hay tareas asignadas para esta materia.</h2>';
            return;
        }

        // Por cada tarea en los datos, creamos su elemento HTML
        data.tareas.forEach(tarea => {
            const fechaFormateada = formatISODateToInput(tarea.fecha);

            const tareaHTML = `
                <a class="Tareas" data-task-id="${tarea._id}">
                    <div id="link_tarea">
                        <h4>Tarea</h4>
                        <h4 class="trim">${tarea.nombre}</h4>
                        <div class="contenedor_vencimiento">
                            <p>Vence:</p>
                            <input type="datetime-local" value="${fechaFormateada}" class="datetime-input" disabled>
                        </div>
                    </div>
                </a>
            `;
            // Añadimos el HTML de la tarea al contenedor
            container.innerHTML += tareaHTML;
        });

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
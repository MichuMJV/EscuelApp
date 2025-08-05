// middleware/Tareasestudiante.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idSalon = urlParams.get('id');
    const usuario = JSON.parse(localStorage.getItem('sesionEscuelApp'));
    const idEstudiante = usuario ? usuario._id : null;

    if (!idSalon || !idEstudiante) {
        alert("Error: No se pudo identificar el salón o el estudiante.");
        return;
    }

    // Guardamos los IDs para usarlos en otras funciones
    window.APP_STATE = { idSalon, idEstudiante };

    cargarDetallesSalon(idSalon);
    cargarMisTareas(idSalon, idEstudiante);

    // Activamos el listener para abrir el diálogo al hacer clic en una tarea
    document.querySelector('.container_tareas').addEventListener('click', handleTaskClick);
});

async function cargarDetallesSalon(idSalon) {
    try {
        const response = await fetch(`/Escuelapp/GetSalonDetails?id=${idSalon}`);
        const data = await response.json();
        console.log("Detalles del salón:", data);
        document.getElementById('nombreMat').innerText = data.nombre;
        document.getElementById("imagen").src = data.logo;

    } catch (error) { console.error("Error al cargar detalles del salón:", error); }
}

async function cargarMisTareas(idSalon, idEstudiante) {
    const container = document.querySelector('.container_tareas');
    container.innerHTML = '<h4>Cargando tareas...</h4>';

    try {
        const response = await fetch(`/Escuelapp/GetTareasParaEstudiante?idgrupo=${idSalon}&idestudiante=${idEstudiante}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        if (data.tareas.length === 0) {
            container.innerHTML = '<h2>No hay tareas asignadas para esta materia.</h2>';
            return;
        }

        let tareasHTML = '';
        const ahora = new Date();

        data.tareas.forEach(tarea => {
            let statusClass = 'pendiente'; // Estado por defecto
            const fechaVencimiento = formatISODateToInput(tarea.fechavencimiento);

            // Lógica para determinar el color
            if (tarea.miAsignacion && tarea.miAsignacion.docentrega) {
                statusClass = 'completada'; // Verde: ya entregó
            } else if (ahora > fechaVencimiento) {
                statusClass = 'vencida'; // Rojo: no ha entregado y se venció
            }
            
            tareasHTML += `
                <a class="Tareas ${statusClass}" data-task-details='${JSON.stringify(tarea)}'>
                    <div class="link_tarea">
                        <h4>${tarea.nombre}</h4>
                        <h4>Nota: ${tarea.miAsignacion ? (tarea.miAsignacion.nota || 'Sin calificar') : 'Sin calificar'}</h4>
                        <div class="contenedor_vencimiento">
                            <p>Vence:</p>
                            <input type="datetime-local" value="${fechaVencimiento}" class="datetime-input" disabled>
                        </div>
                    </div>
                </a>
            `;
        });
        container.innerHTML = tareasHTML;
    } catch (error) {
        console.error("Error al cargar tareas:", error);
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

function handleTaskClick(event) {
    const taskCard = event.target.closest('.Tareas');
    if (!taskCard) return;

    const tarea = JSON.parse(taskCard.dataset.taskDetails);
    const dialog = document.getElementById('dialogo');
    
    // Llenar el diálogo con la info específica de la tarea
    dialog.querySelector('#dialog_task_title').innerText = tarea.nombre;
    dialog.querySelector('#dialog_task_due_date').value = tarea.fechavencimiento.slice(0, 16);
    dialog.querySelector('#dialog_task_grade').innerText = `Nota: ${tarea.miAsignacion ? (tarea.miAsignacion.nota || 'Sin calificar') : 'Sin calificar'}`;
    dialog.querySelector('#dialog_reference_link').href = tarea.doctarea;
    dialog.querySelector('#dialog_submission_link').value = tarea.miAsignacion ? tarea.miAsignacion.docentrega : '';
    
    // Guardamos el ID de la tarea para poder enviarla
    dialog.dataset.idtarea = tarea._id;

    dialog.showModal();
}

async function enviarrespuesta() {
    const dialog = document.getElementById('dialogo');
    const idtarea = dialog.dataset.idtarea;
    const docentrega = document.getElementById('dialog_submission_link').value;
    const { idEstudiante, idSalon } = window.APP_STATE;

    if (!docentrega) {
        alert("Debes pegar el enlace de tu documento para entregarlo.");
        return;
    }

    try {
        const response = await fetch(`/Escuelapp/EstudianteEntregaTarea`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idtarea, idestudiante: idEstudiante, docentrega })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        alert(result.message);
        dialog.close();
        cargarMisTareas(idSalon, idEstudiante); // ¡Refrescar la lista de tareas!
    } catch (error) {
        console.error("Error al enviar la tarea:", error);
        alert(`No se pudo entregar la tarea. ${error.message}`);
    }
}
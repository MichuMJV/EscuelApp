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
            const fechaVencimiento = new Date(tarea.fechavencimiento);

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
                            <input type="datetime-local" value="${tarea.fechavencimiento.slice(0, 16)}" class="datetime-input" disabled>
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
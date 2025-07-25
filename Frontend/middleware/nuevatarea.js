// Se ejecuta cuando todo el contenido de la página se ha cargado
document.addEventListener('DOMContentLoaded', () => {
    // 1. Llenar automáticamente el ID del grupo
    const urlParams = new URLSearchParams(window.location.search);
    const idGrupo = urlParams.get('id');
    const idGrupoInput = document.getElementById('idGrupo');

    if (idGrupo) {
        idGrupoInput.value = idGrupo;
    } else {
        alert('Error: No se pudo encontrar el ID del grupo en la URL.');
        // Deshabilitar el formulario si no hay ID
        document.getElementById('buttsubmit').disabled = true;
    }

    // 2. Añadir el evento al botón de "Crear Tarea"
    const submitButton = document.getElementById('buttsubmit');
    submitButton.addEventListener('click', crearNuevaTarea);
});

async function crearNuevaTarea(event) {
    event.preventDefault(); // Prevenir cualquier comportamiento por defecto

    // Obtener los datos del formulario
    const idGrupo = document.getElementById('idGrupo').value;
    const nombre = document.getElementById('nombreTarea').value;
    const descripcion = document.getElementById('descripcion').value;
    const doctarea = document.getElementById('documentoReferencia').value;
    const fechavencimiento = document.getElementById('fechavencimiento').value;


    // Validación simple de campos
    if (!idGrupo || !nombre || !descripcion || !doctarea || !fechavencimiento) {
        alert('Por favor, complete todos los campos.');
        return;
    }

    // Preparar el cuerpo de la petición (el JSON)
     const datosTarea = {
        nombre,
        descripcion,
        doctarea,
        fechavencimiento // 3. AÑADIMOS EL CAMPO AL BODY DE LA PETICIÓN
    };

    try {
        // Hacemos la llamada al API usando el endpoint que ya creamos
        // El ID del grupo va en la URL, los demás datos van en el body
        const response = await fetch(`http://127.0.0.1:5000/Escuelapp/NewTarea?id=${idGrupo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosTarea)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('¡Tarea creada y asignada exitosamente!');
            // Regresar a la página anterior (la lista de tareas)
            window.history.back();
        } else {
            // Mostrar el mensaje de error que viene del servidor
            alert(`Error al crear la tarea: ${result.message}`);
        }

    } catch (error) {
        console.error('Error de red o en la petición:', error);
        alert('Ocurrió un error de conexión. Por favor, inténtelo de nuevo.');
    }
}
function goBack() {
    window.history.back();
}

async function loadProfesores() {
    try {
        let response = await fetch('http://127.0.0.1:5000/Escuelapp/returnUser');
        let data = await response.json();
        let profesoresSelect = document.getElementById('profesores');
        let profesoresSelectnuevo = document.getElementById('profesoresnew');
        profesoresSelectnuevo.innerHTML = '<option value="">Seleccione un profesor diferente</option>';
        profesoresSelect.innerHTML = '<option value="">Seleccione un profesor</option>';
        data.forEach(profesor => {
            if (profesor.rol === 2) {
                profesoresSelect.innerHTML += `<option value="${profesor._id}">${profesor.nombre}</option>`;
            }
        });
        data.forEach(profesor => {
            if (profesor.rol === 2) {
                profesoresSelectnuevo.innerHTML += `<option value="${profesor._id}">${profesor.nombre}</option>`;
            }
        }
        );
    } catch (error) {
        console.error("Error al cargar los profesores:", error);
    }
}

async function loadSalones() {
    let profesorId = document.getElementById('profesores').value;
    if (!profesorId) return;
    try {
        let response = await fetch(`http://127.0.0.1:5000/Escuelapp/ReturnSalonsByProfessor?idprofesor=${profesorId}`);
        let data = await response.json();
        let salonesSelect = document.getElementById('salones');
        salonesSelect.innerHTML = '<option value="">Seleccione un salón</option>';
        data.SalonData.forEach(salon => {
            salonesSelect.innerHTML += `<option value="${salon._id}">${salon.materia} - Grado ${salon.grado}</option>`;
        });
    } catch (error) {
        console.error("Error al cargar los salones:", error);
    }
}

async function loadSalonDetails() {
    let salonId = document.getElementById('salones').value;
    if (!salonId) return;
    try {
        let response = await fetch(`http://127.0.0.1:5000/Escuelapp/GetSalonDetails?id=${salonId}`);
        let salon = await response.json();
        document.getElementById('Materia').value = salon.materia;
        document.getElementById('Grado').value = salon.grado;
        document.getElementById('clave').value = salon.clave;
        document.getElementById('clave2').value = salon.clave;
        document.getElementById('logo').value = salon.logo;
        document.getElementById('cupo').value = salon.cupo;
    } catch (error) {
        console.error("Error al cargar los detalles del salón:", error);
    }
}

async function modificarSalon(event) {
    event.preventDefault();
    let salonId = document.getElementById('salones').value;
    let profesorId = document.getElementById('profesoresnew').value;
    if(document.getElementById('profesoresnew').value==="")
        profesorId = document.getElementById('profesores').value;
    let data = {
        salonId: salonId,
        idprofesor: profesorId,
        materia: document.getElementById('Materia').value,
        grado: document.getElementById('Grado').value,
        clave: document.getElementById('clave').value,
        clave2: document.getElementById('clave2').value,
        logo: document.getElementById('logo').value,
        cupo: document.getElementById('cupo').value
    };
    try {
        let response = await fetch('http://127.0.0.1:5000/Escuelapp/UpdateSalon', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        let result = await response.json();
        alert(result.message);
        if (result.success) {
            goBack(); 
        }
    } catch (error) {
        console.error("Error al modificar el salón:", error);
    }
}

async function borrarsalon() {
    // 1. Pedimos confirmación al usuario antes de una acción destructiva.
    const confirmacion = confirm(
        "¿Estás seguro de que quieres eliminar este salón?\n\n" +
        "Esta acción es IRREVERSIBLE y borrará también:\n" +
        "- Todas las tareas creadas en este salón.\n" +
        "- Todas las matrículas de los estudiantes.\n" +
        "- Todas las entregas y notas de esas tareas."
    );

    if (!confirmacion) {
        return; // Si el usuario cancela, no hacemos nada.
    }

    // 2. Obtenemos los IDs necesarios
    const idSalon = document.getElementById('salones').value;
    const sesion = JSON.parse(localStorage.getItem('sesionEscuelApp'));

    if (!idSalon) {
        alert("Por favor, selecciona un salón para eliminar.");
        return;
    }

    if (!sesion || !sesion._id) {
        alert("No se pudo verificar tu identidad. Por favor, inicia sesión de nuevo.");
        return;
    }
    const idAdmin = sesion._id; // El ID del usuario que está logueado

    try {
        const response = await fetch('/Escuelapp/DeleteSalon', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            // 3. Enviamos ambos IDs en el body, como espera el nuevo controlador
            body: JSON.stringify({ idSalon, idAdmin })
        });

        const result = await response.json();
        alert(result.message); // Muestra el mensaje de éxito o error del backend

        if (result.success) {
            // Si se borró con éxito, redirigimos a la página principal del profesor
            window.location.href = './homeProfesor.html';
        }

    } catch (error) {
        console.error("Error al intentar eliminar el salón:", error);
        alert("Ocurrió un error de conexión al intentar eliminar el salón.");
    }
}

document.addEventListener('DOMContentLoaded', loadProfesores);
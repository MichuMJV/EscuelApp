function goBack() {
    window.history.back();
}

async function loadProfesores() {
    try {
        let response = await fetch('localhost:5000/Escuelapp/retornoUsers');
        let data = await response.json();
        let profesoresSelect = document.getElementById('profesores');
        profesoresSelect.innerHTML = '<option value="">Seleccione un profesor</option>';
        data.forEach(profesor => {
            if (profesor.rol === 2) {
                profesoresSelect.innerHTML += `<option value="${profesor._id}">${profesor.nombre}</option>`;
            }
        });
    } catch (error) {
        console.error("Error al cargar los profesores:", error);
    }
}

async function loadSalones() {
    let profesorId = document.getElementById('profesores').value;
    if (!profesorId) return;
    try {
        let response = await fetch(`localhost:5000/Escuelapp/ReturnSalonsByProfessor?idprofesor=${profesorId}`);
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
        let response = await fetch(`localhost:5000/Escuelapp/GetSalonDetails?id=${salonId}`);
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
    let data = {
        salonId: salonId,
        idprofesor: document.getElementById('profesores').value,
        materia: document.getElementById('Materia').value,
        grado: document.getElementById('Grado').value,
        clave: document.getElementById('clave').value,
        clave2: document.getElementById('clave2').value,
        logo: document.getElementById('logo').value,
        cupo: document.getElementById('cupo').value
    };
    try {
        let response = await fetch(`localhost:5000/Escuelapp/UpdateSalon`, {
            method: 'POST',
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

document.addEventListener('DOMContentLoaded', loadProfesores);
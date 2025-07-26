// middleware/matricularse.js
document.addEventListener('DOMContentLoaded', () => {
    const matricularBtn = document.querySelector('#boton-filtro .botonbuscar');
    if (matricularBtn) {
        matricularBtn.addEventListener('click', matricularEstudiante);
    }
});

async function matricularEstudiante() {
    const salonNameInput = document.getElementById('inputSalon');
    const contrasenaInput = document.getElementById('inputContrasena');
    
    // --- CAMBIO: La variable ahora representa el nombre del salón ---
    const nombre = salonNameInput.value;
    const clave = contrasenaInput.value;

    const usuario = JSON.parse(localStorage.getItem('sesionEscuelApp'));
    if (!usuario || !usuario._id) {
        alert('Error: No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.');
        return;
    }
    const idEstudiante = usuario._id;

    if (!nombre || !clave) {
        alert('Por favor, ingrese el nombre del salón y la contraseña.');
        return;
    }

    try {
        const response = await fetch(`/Escuelapp/Matricular?idEstudiante=${idEstudiante}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // --- CAMBIO PRINCIPAL: Enviamos 'nombre' en lugar de 'codsalon' ---
            body: JSON.stringify({ nombre: nombre, clave: clave })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            salonNameInput.value = '';
            contrasenaInput.value = '';
            cargarSalones(); 
        } else {
            alert(`Error: ${result.message}`);
        }

    } catch (error) {
        console.error('Error de conexión al matricular:', error);
        alert('Ocurrió un error de conexión.');
    }
}
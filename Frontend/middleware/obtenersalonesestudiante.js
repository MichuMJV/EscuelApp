// middleware/obtenersalonesestudiante.js
document.addEventListener('DOMContentLoaded', () => {
    cargarSalones();
});

async function cargarSalones() {
    // Obtenemos los datos del usuario logueado desde localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario || !usuario._id) {
        console.error("No se encontró información del estudiante.");
        return;
    }

    const idEstudiante = usuario._id;
    const wrapper = document.querySelector('.wrapper');
    wrapper.innerHTML = '<p>Cargando tus materias...</p>'; // Mensaje de carga

    try {
        const response = await fetch(`/Escuelapp/salones-estudiante?idestudiante=${idEstudiante}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        wrapper.innerHTML = ''; // Limpiamos el contenedor

        if (data.salones.length === 0) {
            wrapper.innerHTML = '<p>No estás matriculado en ninguna materia.</p>';
            return;
        }

        data.salones.forEach(salon => {
            // Creamos la tarjeta del salón dinámicamente
            const salonHTML = `
                <a href="./Tareas_estudiante.html?id=${salon._id}" class="no-text-decoration">
                    <div class="contenedor_materia">
                        <img src="${salon.logo || '../Assets/materia.png'}" class="logo_materia" alt="Logo de la materia">
                        <p>${salon.nombre}</p>
                    </div>
                </a>
            `;
            wrapper.innerHTML += salonHTML;
        });

    } catch (error) {
        console.error('Error al cargar los salones:', error);
        wrapper.innerHTML = '<p>Ocurrió un error al cargar tus materias.</p>';
    }
}
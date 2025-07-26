// middleware/obtenersalonesestudiante.js
document.addEventListener('DOMContentLoaded', () => {
    cargarSalones();
});

async function cargarSalones() {
    // Usamos la clave correcta que me confirmaste: 'sesionEscuelApp'
    const sesion = JSON.parse(localStorage.getItem('sesionEscuelApp'));
    
    // Verificamos que la sesión y el _id existan
    if (!sesion || !sesion._id) {
        console.error("Error: No se encontró información de la sesión del estudiante en localStorage con la clave 'sesionEscuelApp'.");
        return;
    }

    const idEstudiante = sesion._id;
    const wrapper = document.querySelector('.wrapper');
    wrapper.innerHTML = '<p>Cargando tus materias...</p>';

    try {
        const response = await fetch(`/Escuelapp/salones-estudiante?idestudiante=${idEstudiante}`);

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        if (data.salones.length === 0) {
            wrapper.innerHTML = '<p>No estás matriculado en ninguna materia.</p>';
            return;
        }

        // --- LÓGICA DE RENDERIZADO MEJORADA ---
        let salonesHTML = ''; // 1. Creamos una cadena vacía
        
        data.salones.forEach(salon => {
            // 2. Llenamos la cadena con el HTML de cada salón
            salonesHTML += `
                <a href="./Tareas_estudiante.html?id=${salon._id}" class="no-text-decoration">
                    <div class="contenedor_materia">
                        <img src="${salon.logo || '../Assets/materia.png'}" class="logo_materia" alt="Logo de la materia">
                        <p>${salon.nombre}</p>
                    </div>
                </a>
            `;
        });
        
        // 3. Actualizamos el HTML del contenedor UNA SOLA VEZ al final del bucle
        wrapper.innerHTML = salonesHTML;

    } catch (error) {
        console.error('Error al cargar los salones:', error);
        wrapper.innerHTML = '<p>Ocurrió un error al cargar tus materias.</p>';
    }
}
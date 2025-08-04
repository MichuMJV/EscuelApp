document.addEventListener('DOMContentLoaded', () => {
    // Variable para guardar la lista completa de salones y no volver a pedirla al servidor.
    let todosLosSalones = [];
    
    // Obtenemos las referencias a los elementos del HTML
    const filtroInput = document.querySelector('#boton-filtro .inputbuscar');
    const containerSalon = document.getElementById('containersalon');

    // --- FUNCIÓN PARA "DIBUJAR" LOS SALONES EN EL HTML ---
    function renderSalones(salones) {
        containerSalon.innerHTML = ''; // Limpiamos el contenedor

        if (salones.length === 0) {
            containerSalon.innerHTML = '<p>No se encontraron salones.</p>';
            return;
        }

        const salonesHTML = salones.map(salon => `
            <a href="./Tareas_profesor.html?id=${salon._id}" class="no-text-decoration">
                <div class="contenedor_materia">
                    <img src="${salon.logo || '../Assets/materia.png'}" class="logo_materia" alt="Logo de la materia">
                    <p>${salon.nombre}</p>
                </div>
            </a>
        `).join('');

        containerSalon.innerHTML = salonesHTML;
    }

    // --- FUNCIÓN PARA CARGAR LOS SALONES INICIALES ---
    async function cargarSalonesIniciales() {
        const sesion = JSON.parse(localStorage.getItem('sesionEscuelApp'));
        if (!sesion || !sesion._id) {
            console.error("No se encontró la sesión del profesor.");
            return;
        }
        
        containerSalon.innerHTML = '<p>Cargando salones...</p>';

        try {
            const response = await fetch(`/Escuelapp/ReturnSalonsByProfessor?idprofesor=${sesion._id}`);
            const result = await response.json();
            
            if (result.SalonData) {
                todosLosSalones = result.SalonData; // Guardamos la lista completa
                renderSalones(todosLosSalones);     // Mostramos la lista inicial
            }
        } catch (error) {
            console.error('Error al cargar los salones:', error);
            containerSalon.innerHTML = '<p>Error al cargar los salones.</p>';
        }
    }

    // --- EVENTO PARA FILTRAR ---
    // Se activa cada vez que el usuario escribe algo en el input.
    filtroInput.addEventListener('input', (event) => {
        const terminoBusqueda = event.target.value.toLowerCase();

        const salonesFiltrados = todosLosSalones.filter(salon => {
            return salon.nombre.toLowerCase().includes(terminoBusqueda);
        });

        renderSalones(salonesFiltrados);
    });

    // --- Inicia todo el proceso ---
    cargarSalonesIniciales();
});
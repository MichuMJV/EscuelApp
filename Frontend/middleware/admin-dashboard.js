// middleware/admin-dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    let allData = []; // Guardará todos los registros para filtrar en el cliente
    
    // Referencias a los elementos del DOM
    const tbody = document.getElementById('admin-dashboard-body');
    const filters = {
        student: document.getElementById('filter-student'),
        salon: document.getElementById('filter-salon'),
        materia: document.getElementById('filter-materia'),
        task: document.getElementById('filter-task')
    };

    // --- CARGA INICIAL DE DATOS ---
    async function CargarDatosIniciales() {
        try {
            const response = await fetch('/Escuelapp/admin-dashboard-data');
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            allData = result.data;
            renderTable(allData);
        } catch (error) {
            console.error("Error al cargar datos del dashboard:", error);
            tbody.innerHTML = `<tr><td colspan="8">Error al cargar los datos.</td></tr>`;
        }
    }

    // --- RENDERIZADO DE LA TABLA ---
    function renderTable(data) {
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">No se encontraron registros.</td></tr>`;
            return;
        }

        data.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.nombreEstudiante}</td>
                <td>${record.nombreSalon}</td>
                <td>${record.materia}</td>
                <td>${record.nombreTarea}</td>
                <td><a href="${record.docentrega}" target="_blank">Ver Entrega</a></td>
                <td>${new Date(record.fechaentrega).toLocaleString()}</td>
                <td><input type="text" class="nota-input" value="${record.nota || ''}" data-id="${record._id}"></td>
                <td><button class="save-button" data-id="${record._id}">Guardar</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    // --- LÓGICA DE FILTROS ---
    function aplicarFiltros() {
        const studentFilter = filters.student.value.toLowerCase();
        const salonFilter = filters.salon.value.toLowerCase();
        const materiaFilter = filters.materia.value.toLowerCase();
        const taskFilter = filters.task.value.toLowerCase();

        const filteredData = allData.filter(record => {
            return record.nombreEstudiante.toLowerCase().includes(studentFilter) &&
                   record.nombreSalon.toLowerCase().includes(salonFilter) &&
                   record.materia.toLowerCase().includes(materiaFilter) &&
                   record.nombreTarea.toLowerCase().includes(taskFilter);
        });
        renderTable(filteredData);
    }

    Object.values(filters).forEach(input => input.addEventListener('keyup', aplicarFiltros));

    // --- LÓGICA PARA GUARDAR NOTA (CORREGIDA) ---
    tbody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('save-button')) {
            const button = event.target;
            const idEntrega = button.dataset.id;
            const input = tbody.querySelector(`.nota-input[data-id="${idEntrega}"]`);
            const nuevaNota = input.value;
            
            // --- INICIO DE LA CORRECCIÓN ---
            // 1. Obtenemos la información del usuario actual (el calificador) desde localStorage
            const sesion = JSON.parse(localStorage.getItem('sesionEscuelApp'));

            // 2. Verificamos que la sesión sea válida
            if (!sesion || !sesion._id) {
                alert("Error: Sesión de administrador no encontrada. Por favor, inicie sesión de nuevo.");
                return;
            }
            const idCalificador = sesion._id;
            // --- FIN DE LA CORRECCIÓN ---
            
            try {
                // Usamos el controlador que ya existe para poner notas
                const response = await fetch(`/Escuelapp/update-nota`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    // 3. Enviamos el idCalificador obtenido del localStorage
                    body: JSON.stringify({ idEntrega, nuevaNota, idCalificador })
                });
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                alert(result.message);
                button.innerText = "Guardado ✓";
                setTimeout(() => { button.innerText = "Guardar"; }, 2000);
            } catch (error) {
                console.error("Error al guardar la nota:", error);
                alert(`No se pudo guardar la nota: ${error.message}`);
            }
        }
    });

    // Iniciar todo
    CargarDatosIniciales();
});
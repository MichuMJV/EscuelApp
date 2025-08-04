// middleware/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // Variable global para guardar todos los datos y no pedirlos de nuevo al filtrar
    let allSubmissions = [];

    const urlParams = new URLSearchParams(window.location.search);
    const idSalon = urlParams.get('id');

    if (!idSalon) {
        alert("Error: No se encontró el ID del salón.");
        return;
    }

    const tbody = document.getElementById('dashboard-body');
    const filterStudent = document.getElementById('filter-student');
    const filterTask = document.getElementById('filter-task');

    // --- FUNCIÓN PRINCIPAL PARA CARGAR DATOS ---
    async function cargarDashboard() {
        try {
            const response = await fetch(`/Escuelapp/dashboard-data?idgrupo=${idSalon}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            allSubmissions = result.data;
            renderTable(allSubmissions);
        } catch (error) {
            console.error("Error al cargar datos del dashboard:", error);
            tbody.innerHTML = `<tr><td colspan="6">Error al cargar los datos.</td></tr>`;
        }
    }

    // --- FUNCIÓN PARA "DIBUJAR" LA TABLA ---
    function renderTable(data) {
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">No se encontraron entregas.</td></tr>`;
            return;
        }

        data.forEach(submission => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${submission.nombreEstudiante}</td>
                <td>${submission.nombreTarea}</td>
                <td><a href="${submission.docentrega}" target="_blank">Ver Entrega</a></td>
                <td>${new Date(submission.fechaentrega).toLocaleString()}</td>
                <td><input type="text" class="nota-input" value="${submission.nota || ''}" data-id="${submission._id}"></td>
                <td><button class="save-button" data-id="${submission._id}">Guardar</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    // --- LÓGICA DE FILTROS ---
    function applyFilters() {
        const studentValue = filterStudent.value.toLowerCase();
        const taskValue = filterTask.value.toLowerCase();

        const filteredData = allSubmissions.filter(submission => {
            const studentMatch = submission.nombreEstudiante.toLowerCase().includes(studentValue);
            const taskMatch = submission.nombreTarea.toLowerCase().includes(taskValue);
            return studentMatch && taskMatch;
        });
        renderTable(filteredData);
    }
    
    filterStudent.addEventListener('keyup', applyFilters);
    filterTask.addEventListener('keyup', applyFilters);

    // --- LÓGICA PARA GUARDAR NOTA (CON DELEGACIÓN DE EVENTOS) ---
    tbody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('save-button')) {
            const button = event.target;
            const idEntrega = button.dataset.id;
            const input = document.querySelector(`.nota-input[data-id="${idEntrega}"]`);
            const nuevaNota = input.value;
            
            try {
                const response = await fetch(`/Escuelapp/update-nota`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idEntrega, nuevaNota })
                });
                const result = await response.json();
                if (!result.success) throw new Error(result.message);

                alert(result.message);
                button.innerText = "Guardado ✓";
                setTimeout(() => { button.innerText = "Guardar"; }, 2000);
            } catch (error) {
                console.error("Error al guardar la nota:", error);
                alert("No se pudo guardar la nota.");
            }
        }
    });

    // Carga inicial de datos
    cargarDashboard();
});

// Finalmente, en tu middleware/Tareasprofesor.js, haz que el botón del dashboard funcione:
// document.getElementById('botondashboard').addEventListener('click', () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const idSalon = urlParams.get('id');
//     if (idSalon) {
//         window.location.href = `./dashboard.html?id=${idSalon}`;
//     }
// });
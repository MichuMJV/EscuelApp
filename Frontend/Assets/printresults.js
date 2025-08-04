// Assets/printresults.js
document.addEventListener('DOMContentLoaded', () => {
    const downloadButton = document.getElementById('download-button');
    if (!downloadButton) return;

    downloadButton.addEventListener('click', () => {
        // 1. Obtenemos los datos que se están mostrando en la tabla
        const dataToExport = window.currentDashboardData;

        if (!dataToExport || dataToExport.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        // 2. Creamos el contenido del archivo CSV
        const headers = [
            "Estudiante",
            "Salón",
            "Materia",
            "Tarea",
            "Documento Entregado",
            "Fecha de Entrega",
            "Calificación"
        ];
        
        let csvContent = headers.join(",") + "\n"; // Fila de encabezados

        // 3. Añadimos una fila por cada registro de la tabla
        dataToExport.forEach(record => {
            // Formateamos la fecha para que sea más legible en Excel
            const formattedDate = new Date(record.fechaentrega).toLocaleString('es-PA');
            
            const row = [
                `"${record.nombreEstudiante}"`,
                `"${record.nombreSalon}"`,
                `"${record.materia}"`,
                `"${record.nombreTarea}"`,
                `"${record.docentrega}"`,
                `"${formattedDate}"`,
                `"${record.nota || 'N/A'}"`
            ];
            csvContent += row.join(",") + "\n";
        });
        
        // 4. Creamos y disparamos la descarga del archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "boletin_calificaciones.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const dashboardButton = document.getElementById('botondashboard');
    
    // Es importante seleccionar la etiqueta <a> que contiene el botón
    const dashboardLink = dashboardButton ? dashboardButton.parentElement : null;

    if (dashboardLink) {
        // 1. Leemos los parámetros de la URL actual
        const urlParams = new URLSearchParams(window.location.search);
        
        // 2. Obtenemos el ID del salón
        const idSalon = urlParams.get('id');

        if (idSalon) {
            // 3. Modificamos el 'href' del enlace para que apunte a la página
            //    del dashboard, pasando el ID del salón como parámetro.
            dashboardLink.href = `./dashboard.html?id=${idSalon}`;
        } else {
            console.error('No se encontró el ID del salón en la URL para crear el enlace del dashboard.');
            // Opcional: Ocultar el botón si no hay ID
            dashboardLink.style.display = 'none';
        }
    }
});
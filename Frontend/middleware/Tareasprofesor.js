async function loadSalonDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const idsalon = urlParams.get('id');
    if (!idsalon) return;
    try {
        let response = await fetch(`http://127.0.0.1:5000/Escuelapp/GetSalonDetails?id=${idsalon}`);
        let salon = await response.json();
        document.getElementById("imagen").src=salon.logo
        document.getElementById("nombreMat").innerText=salon.nombre
        document.getElementById("codigo").innerText=salon.clave
    } catch (error) {
        console.error("Error al cargar los detalles del salón:", error);
    }
}

loadSalonDetails();
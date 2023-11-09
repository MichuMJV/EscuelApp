// Obtener los datos de sesión guardados en localStorage
const sessionData = localStorage.getItem('sesionEscuelApp');
// Comprobar si los datos existen en localStorage
const usuariojson = JSON.parse(sessionData);
if (sessionData === null) {
  // Los datos de la sesión no existen, se puede informar al usuario
  alert('No se encontraron datos de sesión');
  window.location.href="https://w4v13qcw-5501.use2.devtunnels.ms/Frontend/screens/inicio_sesion.html"
} else {
  // Los datos de la sesión existen, se pueden usar... && usuariojson.rol
  document.getElementById("username").innerText=usuariojson.nombre
}

function cerrarsesion(){
  localStorage.removeItem('sesionEscuelApp');
  window.location.href="https://w4v13qcw-5501.use2.devtunnels.ms/Frontend/screens/inicio_sesion.html"
}

window.addEventListener('boton_atras_home', function() {
  cerrarsesion()
});
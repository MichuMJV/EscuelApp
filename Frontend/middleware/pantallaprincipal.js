// Obtener los datos de sesión guardados en localStorage
const sessionData = localStorage.getItem('sesionEscuelApp');
// Comprobar si los datos existen en localStorage
const usuariojson = JSON.parse(sessionData);
if (sessionData && usuariojson.rol) {
  // Los datos de la sesión existen, se pueden usar
  document.getElementById("username").innerText=usuariojson.nombre
} else {
  // Los datos de la sesión no existen, se puede informar al usuario
  console.log('No se encontraron datos de sesión');
  window.location.href="http://127.0.0.1:5501/Frontend/screens/inicio_sesion.html"
}

function cerrarsesion(){
  localStorage.removeItem('sesionEscuelApp');
  window.location.href="http://127.0.0.1:5501/Frontend/screens/inicio_sesion.html"
}

window.addEventListener('beforeunload', function() {
  localStorage.removeItem('sesionEscuelApp');
});
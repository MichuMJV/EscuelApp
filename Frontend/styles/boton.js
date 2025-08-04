let button = document.getElementById("my-button");
let list = document.getElementById("my-list");

try{
    button.addEventListener("click", function() {
    if (list.style.display === "none") {
        $("#my-list").fadeIn();
        list.style.display = "flex";
    } else {
        ($("#my-list").fadeOut()).then(()=>list.style.display = "none")
    }
    });
}catch(e){

}

function redirigirPaginaProfesor(){
    if(JSON.parse(localStorage.getItem('sesionEscuelApp')).rol===2)
        window.location.href = "./homeProfesor.html";
    window.location.href = "./homeAdmin.html";
    localStorage.removeItem('salonelegido')
}

function redirigirPaginaEstudiante() {
    window.location.href = "./homeEstudiante.html";
}

function abrirdashboardadmin() {
    window.location.href = "./admin-dashboard.html";
}

function VerUsuarios() {
    window.location.href = "./UsuariosActuales.html";
}

function redirigirPaginaProfesor() {
    window.location.href = "./homeProfesor.html";
}

function redirigirPaginaAdmin() {
    window.location.href = "./homeAdmin.html";
}

function abrirTareasProfe() {
    window.location.href = "./Tareas_profesor.html";
}

function abrirTareasEstudiante() {
    window.location.href = "./Tareas_estudiante.html";
}

function abrirNuevoUsuario() {
    window.location.href = "../screens/Nuevo_usuario.html";
}

function AbrirNuevaTarea() {
    window.location.href = "../screens/Nueva_tarea.html";
}

function AbrirNuevaApp() {
    window.location.href = "../screens/Nueva_app.html";
} 

function Borrar_APP() {
    window.location.href = "../screens/Borrar_APP.html";
} 

function AbrirNuevoSalon() {
    window.location.href = "../screens/Nuevo_salon.html";
}

function abrirDashboardSalones() {
    window.location.href = "../screens/Dashboard_salones.html";
}

function Nuevo_rol() {
    window.location.href = "../screens/Nuevo_rol.html";
}

function EditarSalones(){
    window.location.href = "../screens/modificarSalon.html";
}
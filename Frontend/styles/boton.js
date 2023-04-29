let button = document.getElementById("my-button");
let list = document.getElementById("my-list");

button.addEventListener("click", function() {
    if (list.style.display === "none") {
        $("#my-list").fadeIn();
        list.style.display = "flex";
    } else {
        $("#my-list").fadeOut().then(()=>list.style.display = "none")
    }
});

function redirigirPagina() {
    window.location.href = "./Nueva_tarea.html";
}
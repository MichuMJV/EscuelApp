const dialogo=document.getElementById("dialogo")


// Obtén todas las tareas con la clase 'Tareas'
const tareas = document.querySelectorAll(".Tareas");

// Agrega el evento de clic a todas las tareas
tareas.forEach(tarea => {
    tarea.addEventListener("click", () => {
        dialogo.showModal();
    });
});

dialogo.addEventListener("click", e => {
    const dialogDimensions = dialogo.getBoundingClientRect();
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        dialogo.close();
    }
});



/* El siguiente codigo funciona
document.getElementById("Open_Dialog").addEventListener("click",()=>{
    dialogo.showModal()
})

dialogo.addEventListener("click", e => {
    const dialogDimensions = dialogo.getBoundingClientRect()
    if(
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ){
      dialogo.close()
    }
  })

  */

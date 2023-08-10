const Modal=document.getElementById("Modal")

let tareas= document.getElementsByClassName("Tareas")

console.log(tareas[0])

for(let i in tareas.length){
    tareas[i].addEventListener("click",()=>{
        Modal.showModal()
    })
}

Modal.addEventListener("click", e => {
    const dialogDimensions = Modal.getBoundingClientRect()
    if (
      e.clientX < dialogDimensions.left ||
      e.clientX > dialogDimensions.right ||
      e.clientY < dialogDimensions.top ||
      e.clientY > dialogDimensions.bottom
    ) {
        Modal.close()
    }
  })

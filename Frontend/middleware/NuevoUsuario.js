let roluser= document.getElementById("roluser")
let Nombre= document.getElementById("Nombre")
let Cedula= document.getElementById("Cedula")
let Contra= document.getElementById("Contra")
let botonsubmit= document.getElementById("buttsubmit")

async function NuevoUsuario(){
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  let raw = JSON.stringify({
    "rol": roluser.value,
    "nombre": Nombre.value,
    "cedula": Cedula.value,
    "contrasena": Contra.value
  });
  
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch("http://127.0.0.1:5000/Escuelapp/Register", requestOptions)
    const data = await response.json()
    if(data.message===undefined){
      alert("Usuario agregado con éxito")
    }else{
      alert(data.message)
    }
  } catch (error) {
    alert("error", error)
  }
  location.reload()
}
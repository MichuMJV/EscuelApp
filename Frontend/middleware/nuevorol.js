let roluser= document.getElementById("roluser")
let Cedula= document.getElementById("Cedula")
let botonsubmit= document.getElementById("buttsubmit")

async function actualizarRol(){
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  let raw = JSON.stringify({
    "rol": roluser.value,
    "cedula": Cedula.value
  });
  
  let requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch("http://127.0.0.1:5000/Escuelapp/nuevoRol", requestOptions)
    const data = await response.json()
    if(data.success){
      alert("Usuario actualizado con éxito")
    }else{
      alert(data.message)
    }
  } catch (error) {
    alert("error", error)
  }
  location.reload()
}
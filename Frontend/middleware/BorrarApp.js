let logo= document.getElementById("logo")
let Nombre= document.getElementById("nombre")
let Link= document.getElementById("link")
let buttsubmit= document.getElementById("buttsubmit")

const sessionData = localStorage.getItem('sesionEscuelApp');
const usuariojson = JSON.parse(sessionData);

async function delete_APP(){
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let id=usuariojson._id
  
  let raw = JSON.stringify({
    "nombre": Nombre.value
  });
  
  let requestOptions = {
    method: 'delete',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch(`http://127.0.0.1:5000/Escuelapp/DeleteApp?id=${id}`, requestOptions)
    const data = await response.json()
    alert("Eliminado correctamente")
  } catch (error) {
    alert("error", error)
  }
  location.reload()
}
let logo= document.getElementById("logo")
let Nombre= document.getElementById("nombre")
let Link= document.getElementById("link")
let buttsubmit= document.getElementById("buttsubmit")

async function NuevaApp(){
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  let raw = JSON.stringify({
    "nombre": Nombre.value,
    "imagen": logo.value,
    "link": Link.value
  });
  
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch("http://127.0.0.1:5000/Escuelapp/NewApp", requestOptions)
    const data = await response.json()
    alert(data.message)
  } catch (error) {
    alert("error", error)
  }
  location.reload()
}
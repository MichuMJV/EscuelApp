let botondeacceso= document.getElementById("buttsubmit")
let nombre= document.getElementById("Uname")
let contrasena= document.getElementById("Password")


async function iniciodesesion(){
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  
  let raw = JSON.stringify({
    "nombre": nombre.value,
    "contrasena": contrasena.value
  });
  
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch("http://127.0.0.1:5000/Escuelapp/inicio_sesion", requestOptions)
    const data = await response.json()
    localStorage.setItem('sesionEscuelApp', JSON.stringify(data.User[0]));
    console.log(data)
    let link = data.redirect;
    let url = "http://127.0.0.1:5501/" + link;
    window.location.href=url
  } catch (error) {
    alert("Error al iniciar sesión, revise sus credenciales o contacte al administrador")
  }
}

botondeacceso.addEventListener("click", iniciodesesion);



let identificadorusser= document.getElementById("identificadorusser")

const sessionData = localStorage.getItem('sesionEscuelApp');
const usuariojson = JSON.parse(sessionData);

async function delete_User(){
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let id=usuariojson._id
  
  let raw = JSON.stringify({
    "cedula": identificadorusser.value
  });
  
  let requestOptions = {
    method: 'delete',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  try {
    const response = await fetch(`http://127.0.0.1:5000/Escuelapp/DeleteUser?id=${id}`, requestOptions)
    const data = await response.json()
    alert(data)
  } catch (error) {
    alert("error", error)
  }
  location.reload()
}
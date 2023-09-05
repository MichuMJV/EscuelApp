let myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");


function crearnuevosalon(){
  let clave= document.getElementById("clave").value;
  let clave2= document.getElementById("clave2").value;

  let raw = JSON.stringify({
    "idprofesor": document.getElementById("profesores").value,
    "grado": document.getElementById("Grado").value,
    "materia": document.getElementById("Materia").value,
    "clave": clave,
    "clave2": clave2,
    "logo": document.getElementById("logo").value,
    "cupo": document.getElementById("cupo").value
  });

  console.log(raw)
  
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  
  fetch("http://127.0.0.1:5000/Escuelapp/NewSalon", requestOptions)
  .then(response => response.json())
  .then(result => alert(result.message))
  .catch(error => error);

  console.log(response)
  
}


async function getteachers(){

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let requestOptions = {
    method: 'get',
    headers: myHeaders,
    redirect: 'follow'
  };

  const response = await fetch("http://127.0.0.1:5000/Escuelapp/returnUser", requestOptions);
  const data = await response.json();

  let teachers=[]

  data.forEach(user => {
    if(user.rol===2){
      teachers.push(user)
    }
  });
  
  teachers.forEach(teacher => {
    const option = document.createElement("option");
    option.value = teacher._id;
    option.text = teacher.nombre;
  
    document.getElementById("profesores").appendChild(option);
  });

}

getteachers()
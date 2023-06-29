function sendData() {

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
  
    let cedulaprofesor = document.getElementById("cedulaprofesor").value;
    let grado = document.getElementById("Grado").value;
    let materia = document.getElementById("materia").value;
    let clave = document.getElementById("clave").value;
    let clave2 = document.getElementById("clave2").value;
    let logo = document.getElementById("logo").value;
    let cupo = document.getElementById("cupo").value;

    if(clave == clave2){
        let raw = JSON.stringify({
            "cedulaprofesor": cedulaprofesor,
            "grado": grado,
            "materia": materia,
            "clave": clave,
            "logo": logo,
            "cupo": cupo
          });
        
          let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
          };

          const sessionData = localStorage.getItem('sesionEscuelApp');

        
          fetch(`http://localhost:5000/Escuelapp/NewSalon`, requestOptions)
            .then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.log('error', error));
    }else{
        alert("las claves no son las mismas")
    }  
  }

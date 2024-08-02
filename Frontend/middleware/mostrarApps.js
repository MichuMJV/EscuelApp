localStorage.removeItem('salonelegido');

async function newFunction() {
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  let requestOptions = {
    method: 'get',
    headers: myHeaders,
    redirect: 'follow'
  };

  const response = await fetch("http://127.0.0.1:5000/Escuelapp/ReturnApps", requestOptions);
  const data = await response.json();

  let padre=document.getElementById("my-list")

  for (let i=0; i<data.length; i++){
    padre.innerHTML +=`
    <a id="link-app" href="http://${data[i].link}" target="_blank" class="no-text-decoration">
      <li>
          <p id="text-app" class="text-app">${data[i].nombre}</p>
          <img id="img-app" class="img-app" src="${data[i].imagen}" alt="Imagen 6">
      </li>
    </a>
    `
  }
}

newFunction();
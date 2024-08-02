let idprofesor=JSON.parse(localStorage.getItem('sesionEscuelApp'))

let requestOptions = {
method: 'GET',
redirect: 'follow'
}

fetch(`http://127.0.0.1:5000/Escuelapp/ReturnSalonsByProfessor?idprofesor=${idprofesor._id}`, requestOptions)
.then(response => response.json())
.then(result => {
    let containersalon= document.getElementById('containersalon')
    let resultado= JSON.parse(JSON.stringify(result.SalonData))
    for(let i=0;i<resultado.length;i++){
        containersalon.innerHTML=containersalon.innerHTML+`
                <a id="${resultado[i]._id}" href="./Tareas_profesor.html?id=${resultado[i]._id}" class="no-text-decoration">
                    <div class="contenedor_materia">
                        <img src="${resultado[i].logo}" class="logo_materia" alt="">
                        <p>${resultado[i].nombre}</p>
                    </div>
                </a>`;
    }
}).catch(error => console.log('error', error)); 


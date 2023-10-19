
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
    console.log(resultado)
    for(let i=0;i<resultado.length;i++){
        containersalon.innerHTML=containersalon.innerHTML+`
                <a id="salon${resultado[i]._id}" href="./Tareas_profesor.html" class="no-text-decoration">
                    <div class="contenedor_materia">
                        <img src="${resultado[i].logo}" class="logo_materia" alt="">
                        <p>${resultado[i].materia}${resultado[i].grado}</p>
                    </div>
                </a>`;
        document.getElementById('salon'+resultado[i]._id).addEventListener('click',()=>{
            localStorage.setItem('salonelegido',JSON.stringify(resultado[0]))
        })
    }
}).catch(error => console.log('error', error)); 



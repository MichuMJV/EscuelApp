const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")

const materiasAvaliables=["matematicas","español","ingles",
"ciencias","arte","educacion fisica","musica","tecnologia",
"religion","filosofia","geografia","historia","quimica",
"fisica","biologia","economia","administracion","programacion",
"dibujo","literatura","comunicacion"]

async function isThisProfesorExist(profesor){
    let data=await Usuario.find({
        cedula: profesor
    })
    return data.length!==0
}

function isThisClaveUsefull(clave){
    return clave.length===6
}

function isValidMateria(materia){
    return materiasAvaliables.includes(materia)
}

function IsThisUserAbleToEdit(user){
    return user.rol===3
}

module.exports= async function NewSalon(request,response){
    let body=request.body

    if(!isThisClaveUsefull(body.clave))
        return response.json({success:false,message:"La clave debe tener 6 caracteres"})

    if(!isValidMateria(body.materia))
        return response.json({success:false,message:"La materia no es valida"})

    if(!await isThisProfesorExist(body.cedulaprofesor))
        return response.json({success:false,message:"El profesor no existe"})

    let data={
        cedulaprofesor: body.cedulaprofesor,
        grado: body.grado,
        materia: body.materia,
        fecha: new Date(),
        clave: body.clave,
        logo: body.logo,
        cupo: body.cupo
    }

    try{
        const materia = new Salon(data);
        await materia.save()
        response.json(materia)
    }catch(error){
        console.log(error)
    }

}
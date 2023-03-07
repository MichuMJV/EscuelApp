const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")


const materiasAvaliables=["matematicas","español","ingles",
"ciencias","arte","educacion fisica","musica","tecnologia",
"religion","filosofia","geografia","historia","quimica",
"fisica","biologia","economia","administracion","programacion",
"dibujo","literatura","comunicacion","sociologia","psicologia",
"etica","logica","estadistica","derecho","contabilidad","finanzas",
"negocios","economia","administracion","programacion","dibujo","literatura",
"comunicacion","sociologia","psicologia","etica","logica","estadistica",
"derecho","contabilidad","finanzas","negocios","economia","administracion",
"programacion","dibujo","literatura","comunicacion","sociologia","psicologia",
"etica","logica","estadistica","derecho","contabilidad","finanzas","negocios",
"economia","administracion","programacion","dibujo","literatura","comunicacion",
"sociologia","psicologia","etica","logica","estadistica","derecho","contabilidad",
"finanzas","negocios","economia","administracion","programacion","dibujo","literatura",
"comunicacion","sociologia","psicologia","etica","logica","estadistica","derecho",
"contabilidad","finanzas","negocios","economia","administracion","programacion","dibujo",
"literatura","comunicacion","sociologia","psicologia","etica","logica","estadistica",
"derecho","contabilidad","finanzas","negocios","economia","administracion","programacion",
"dibujo","literatura","comunicacion","sociologia","psicologia","etica","logica","estadistica","derecho","contabilidad","finanzas","negocios","economia","administracion","programacion","dibujo","literatura","comunicacion","sociologia","psicologia","etica","logica","estadistica","derecho","contabilidad","finanzas","negocios","economia","administracion","programacion","dibujo","literatura","comunicacion","sociologia","psicologia","etica"]

async function isThisProfesorExist(profesor,fecha){
    let data=await Salon.select({
        fecha:fecha,
        idprofesor: profesor
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

    request.user=Usuario.findOne({_id:request.query.id})

    if(IsThisUserAbleToEdit(request.user)){
        return response.json({success:false,message:"No tienes permisos para realizar esta acción"})
    }

    if(!isThisClaveUsefull(body.clave))
        return response.json({success:false,message:"La clave debe tener 6 caracteres"})

    if(!isValidMateria(body.materia))
        return response.json({success:false,message:"La materia no es valida"})

    if(await isThisProfesorExist(body.idprofesor))
        return response.json({success:false,message:"El profesor ya tiene un salon asignado"})

    let data={
        idprofesor: body.idprofesor,
        grado: body.grado,
        materia: body.materia,
        fecha: new Date(),
        clave: body.clave,
        logo: body.image,
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
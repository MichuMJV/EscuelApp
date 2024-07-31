const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")


function validarContraseña(clave, clave2) {
    // Verificamos que los campos no estén vacíos
    if (clave === "" || clave2 === "") {
      return {success:false,message:"no puede dejar contraseñas vacías"};
    }
    
    // Verificamos que las contraseñas coincidan
    if (clave !== clave2) {
      return {success:false,message:"Las contraseñas no coinciden"};
    }
  
    // La contraseña es válida
    return {success:true};
  }
  

const materiasAvaliables=["Matematicas","Español","Ingles",
"Ciencias","Arte","Educacion Fisica","Musica","Tecnologia",
"Religion","Filosofia","Geografia","Historia","Quimica",
"Fisica","Biologia","Economia","Administracion","Programacion",
"Dibujo","Literatura","Comunicacion"]

async function isThisProfesorExist(profesor){
    let data=await Usuario.findById(profesor)
    return data.length!==0
}

function isValidMateria(materia){
    return materiasAvaliables.includes(materia)
}

module.exports= async function NewSalon(request,response){
    let body=request.body

    if(!validarContraseña(body.clave, body.clave2).success)
        return response.json({success:false,message:validarContraseña(body.clave, body.clave2).message})

    if(!isValidMateria(body.materia))
        return response.json({success:false,message:"La materia no es valida"})

    if(!await isThisProfesorExist(body.idprofesor))
        return response.json({success:false,message:"El profesor no existe"})

    let nombreconcat= body.grado+body.materia+"-"+new Date().getFullYear()


    let data={
        idprofe:body.idprofesor ,
        nombre: nombreconcat,
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
        console.log("materia",materia)
        return response.json({success:true,message:"materia creada"})
    }catch(error){
        return response.json({success:false,message:error})
    }

}
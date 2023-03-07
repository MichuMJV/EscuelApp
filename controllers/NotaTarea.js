const {Tarea}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")
const {TareaEstudiante}=require("../models/Models.js")

module.exports= async function AddNotaToTarea(request,response){
    let body=request.body

    try{
        request.Profesor=await Usuario.findOne({_id:request.query.Profesor})
    }catch(e){
        console.log("error en la busqueda del profesor")
        return response.json({success:false,message:"Este profesor no existe"})
    }

    if(request.profesor.rol!==2)
        return response.json({success:false,message:"este usuario no es un profesor"})

    try{
        request.Estudiante=await Usuario.findOne({_id:request.query.Estudiante})
    }catch(e){
        console.log("error en la busqueda del estudiante")
        return response.json({success:false,message:"Este estudiante no existe"})
    }

    try{
        request.Tarea=await Tarea.findOne({_id:request.query.tarea})
    }catch(e){
        console.log("error en la busqueda de la tarea")
        return response.json({success:false,message:"Esta tarea no existe"})
    }

    try{
        request.tareaEspecifica=await TareaEstudiante.findOne({
            idtarea:request.Tarea._id,
            idestudiante:request.Estudiante._id})
    }catch(e){
        console.log("error en la busqueda de la tarea especifica")
        return response.json({success:false,message:"El estudiante no tiene asignada esta tarea"})
    }

    try{
        request.tareaEspecifica.nota=body.nota
        request.tareaEspecifica.save()
        return response.json({success:true, message:"Nota agregada"})
    }catch(error){
        console.log(error)
        return response.json({success:false,message:"Error al agregar la nota"})
    }
    
}
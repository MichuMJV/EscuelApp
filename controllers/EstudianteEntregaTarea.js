const {TareaEstudiante}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")

module.exports= async function EstudianteEntregaTarea(request,response){
    let body=request.body

    request.tarea=await Tarea.findOne({_id:request.query.tarea})

    request.Estudiante=await Usuario.findOne({_id:request.query.Estudiante})

    if(!request.grupo)
        return response.json({success:false,message:"Este grupo no existe"})

    if(!request.Estudiante)
        return response.json({success:false,message:"Este Estudiante no existe"})

    if(body.docentrega===undefined)
        return response.json({success:false,message:"Debe subir el link del archivo"})

    let data={
        idtarea: request.tarea._id,
        idestudiante: request.Estudiante._id,
        nota: null,
        docentrega:body.docentrega
    }

    try{
        const tareaData = new TareaEstudiante(data);
        await tareaData.save()
        return response.json({success:true,message:"Tarea guardada"})
    }catch(error){
        console.log(error)
    }

}
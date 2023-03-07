const {Salon}=require("../models/Models.js")
const {Tarea}=require("../models/Models.js")

module.exports= async function NewTarea(request,response){
    let body=request.body

    request.grupo=await Salon.findOne({_id:request.query.id})

    if(!request.grupo)
        return response.json({success:false,message:"Este grupo no existe"})
    
    if(body.doctarea===undefined)
        return response.json({success:false,message:"Debe subir el link del archivo"})

    let data={
        idgrupo: request.grupo._id,
        descripcion: body.descripcion,
        doctarea: body.doctarea
    }
    
    try{
        const tareaData = new Tarea(data);
        await tareaData.save()
        return response.json({success:true,message:"Tarea guardada"})
    }catch(error){
        console.log(error)
    }
    
}
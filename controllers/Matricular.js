const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")
const {SalonEstudiante}=require("../models/Models.js")


module.exports= async function Matricular(request,response){
    let body=request.body

    request.Estudiante=await Usuario.findOne({_id:request.query.idEstudiante})

    request.salon=await Salon.findOne({_id:request.query.idSalon})

    if(request.salon.clave!==body.clave)
        return response.json({success:false,message:"Clave incorrecta"})

    if(request.salon.cupo===0)
        return response.json({success:false,message:"No hay cupo en este salon"})

    let data={
        idgrupo: request.salon._id,
        idestudiante: request.Estudiante._id,
        status: "Matriculado",
        fecha: new Date(),
        notafinal: null
    }
    
    try{
        const userdata=await SalonEstudiante.insert(data);
        request.salon.cupo=request.salon.cupo-1
        request.salon.save()
        response.json(userdata)
        console.log(body)
    }catch(error){
        console.log(error)
    }
    
}
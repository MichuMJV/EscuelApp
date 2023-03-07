const {SalonEstudiante}=require("../models/Models.js")
const {Salon}=require("../models/Models.js")

module.exports= async function estudiantesDeMateria(request,response){

    try{
        request.grupo=await Salon.findOne({_id:request.query.idGrupo})
    }catch(e){
        console.log(e)
        return response.json({success:false,message:"Grupo inválido"})
    }

    try{
        let {data}=await SalonEstudiante.find({idgrupo:request.grupo._id})
        console.log(data)
        return response.json({success:true, data})
    }catch(e){
        console.log(e)
        return response.json({success:false,message:"Error en obtener datos"})
    }

}
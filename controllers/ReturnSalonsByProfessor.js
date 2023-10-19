const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")

module.exports= async function ReturnSalonsByProfessor(request,response){

    if(!request.query.idprofesor)
        return response.json({success:false,err:"no se envio el idprofesor"})

    request.profesor=await Usuario.find({_id:request.query.idprofesor})

    if(request.profesor.rol === null)
        return response.json({success:false,err:"el usuario no es profesor"})
        
    try{
        const SalonData=await Salon.find({idprofe:request.query.idprofesor})
        return response.json({SalonData})
    }catch(error){
        return response.json({error:error})
    }
}
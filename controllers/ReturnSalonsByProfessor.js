const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")

module.exports= async function ReturnSalonsByProfessor(request,response){
    if(!request.query.idprofesor)
        response.json({success:false,err:"no se envio el idprofesor"})

    request.profesor=await Usuario.find({_id:request.query.idprofesor})

    if(!request.profesor.rol!==2)
        response.json({success:false,err:"el usuario no es profesor"})
        
    try{
        const SalonData=await Salon.find({idprofesor:request.query.idprofesor})
        response.json({SalonData})
    }catch(error){
        response.json({error:error})
        console.log(error)
    }
}
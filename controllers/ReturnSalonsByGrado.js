const {Salon}=require("../models/Models.js")

module.exports= async function ReturnSalonsByGrado(request,response){
    if(!request.query.grado)
        response.json({success:false,err:"no se envio el grado"})
        
    try{
        const SalonData=await Salon.find({grado:request.query.grado})
        response.json({SalonData})
    }catch(error){
        console.log(error)
        response.json({error:error})
    }
}
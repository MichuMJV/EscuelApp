const {Salon}=require("../models/Models.js")

module.exports= async function ReturnIDMateria(request,response){
    if(!request.query.id)
        response.json({success:false,err:"no se envio el id"})
        
    try{
        const {SalonData}=await Salon.find({_id:request.query.id})
        response.json({
            CodigoSalon:SalonData.codsalon,
            clave:SalonData.clave})
    }catch(error){
        response.json({error:error})
        console.log(error)
    }
}
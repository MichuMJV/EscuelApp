const {Salon}=require("../models/Models.js")

module.exports= async function ReturnSalonsByCodSalon(request,response){
    if(!request.query.codsalon)
        return response.json({error:"No se ha especificado codsalon"})
    try{
        const SalonData=await Salon.find({codsalon:request.query.codsalon})
        response.json({SalonData})
    }catch(error){
        console.log("error al guardar en sistema")
        response.json({error:error})
    }
}
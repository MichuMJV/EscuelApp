const {Salon}=require("../models/Models.js")

module.exports= async function ReturnSalonsByCodSalon(request,response){
    try{
        const SalonData=await Salon.find({codsalon:request.query.codsalon})
        response.json({SalonData})
    }catch(error){
        response.json({error:error})
        console.log(error)
    }
}
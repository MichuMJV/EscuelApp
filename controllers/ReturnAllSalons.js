const {Salon}=require("../models/Models.js")

module.exports= async function ReturnSalonsByCodSalon(request,response){
    try{
        const SalonData=await Salon.find()
        response.json({SalonData})
    }catch(error){
        console.log("error al guardar en sistema")
        response.json({error:error})
    }
}
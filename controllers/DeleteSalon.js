const {Usuario}=require("../models/Models.js")
const {Salon}=require("../models/Models.js")

module.exports= async function DeleteSalon(request,response){
    let body=request.body

    request.user=await Usuario.findOne({_id:request.query.id})

    if(request.user.rol!==3){
        return response.json({success:false,message:"No tienes permisos para realizar esta acción"})
    }
    
    try{
        const Salondelete=await Salon.deleteOne({_id:body.id});
        response.json(Salondelete)
    }catch(error){
        console.log(error)
    }
    
}
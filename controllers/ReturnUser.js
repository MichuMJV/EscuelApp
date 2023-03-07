const {Usuario}=require("../models/Models.js")

module.exports= async function retornoUsers(request,response){
    if(!request.query.id)
        response.json({Err:"no introdujo el id del usuario"})
    try{
        const userdata=await Usuario.findById(request.query.id);
        response.json(userdata)
    }catch(error){
        response.json({msj:"hubieron problemas encontrando el usuario"})
        console.log(error)  
    }
}
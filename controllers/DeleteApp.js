const {Usuario}=require("../models/Models.js")
const {Apps}=require("../models/Models.js")

module.exports= async function DeleteApp(request,response){
    let body=request.body
    /*
    request.user=await Usuario.findOne({_id:request.query.id})

    if(request.user.rol!==3){
        return response.json({success:false,message:"No tienes permisos para realizar esta acción"})
    }*/
    
    try{
        const AppDelete=await Apps.deleteOne({nombre:body.nombre});
        response.json(AppDelete)
    }catch(error){
        console.log(error)
    }
}
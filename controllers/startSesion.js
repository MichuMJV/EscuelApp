const {Usuario}=require("../models/Models.js")

module.exports= async function NewSesion(request,response){
    let body=request.body
    try{
        request.user=await Usuario.findOne({
            nombre: body.nombre
        })

        if(!request.user)
            return response.json({success:false,message:"Usuario no encontrado"})

        if(request.user.contrasena!==body.contrasena)
            return response.json({success:false,message:"Contraseña incorrecta"})

        if(request.user.rol===1)
            return response.json({success:true,rol:"admin",redirect:"/admin", User:request.user})

        if(request.user.rol===2)
            return response.json({success:true,rol:"profesor",redirect:"/profesor", User:request.user})

        if(request.user.rol===3)
            return response.json({success:true,rol:"alumno",redirect:"/alumno", User:request.user})
    }catch(error){
        response.json({error:error})
        console.log(error)
    }
}
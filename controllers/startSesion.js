const {Usuario}=require("../models/Models.js")

module.exports= async function NewSesion(request,response){
    let body=request.body
    try{
        request.user=await Usuario.find({nombre: body.nombre})

        if(request.user===null || request.user===[])
            return response.json({success:false,message:"Usuario no encontrado"})

        if(request.user[0].contrasena!=body.contrasena)
            return response.json({success:false,message:"Contraseña incorrecta"})

        if(request.user[0].rol===1)
            return response.json({success:true,rol:"admin",redirect:"Frontend/screens/homeAdmin.html", User:request.user})

        if(request.user[0].rol===2)
            return response.json({success:true,rol:"profesor",redirect:"Frontend/screens/homeProfesor.html", User:request.user})

        if(request.user[0].rol===3)
            return response.json({success:true,rol:"alumno",redirect:"Frontend/screens/homeEstudiante.html", User:request.user})
    }catch(error){
        return response.json({success:false,message:"Usuario no encontrado"})
    }
}
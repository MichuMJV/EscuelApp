const {Usuario}=require("../models/Models.js")

module.exports= async function NewUser(request,response){
    let body=request.body
    
    let data={
        rol: body.rol,
        nombre: body.nombre,
        cedula:body.cedula,
        contrasena: body.contrasena
    }
    
    request.user=await Usuario.findOne({
        cedula: body.cedula
    })

    if(request.user!==null){
        return response.json({success:false,message:"Este usuario ya existe"})
    }

    if(body.nombre ==="" || body.rol==="" || body.cedula === "" || body.contrasena==="" ){
        return response.json({success:false, message:"no debe dejar vacío ningun campo"})
    }
    
    try{
        const User = new Usuario(data);
        await User.save()
        response.json(User)
    }catch(error){
        console.log(error)
    }
    
}

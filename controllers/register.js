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
        nombre: body.nombre
    })

    if(request.user){
        return response.json({success:false,message:"Este usuario ya existe"})
    }
    
    try{
        const User = new Usuario(data);
        await User.save()
        response.json(User)
    }catch(error){
        console.log(error)
    }
    
}

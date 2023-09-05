/*const {Usuario}=require("../models/Models.js")

module.exports= async function DeleteUser(request,response){
    let body=request.body

    request.user=await Usuario.findOne({_id:request.query.id})

    if(request.user.rol!==1){
        return response.json({success:false,message:"No tienes permisos para realizar esta acción"})
    }

    if(body.nombre !== undefined){
        try{
            const UsuarioDelete=await Usuario.deleteOne({nombre:body.nombre});
            return response.json(UsuarioDelete)
        }catch(error){
            try{
                const UsuarioDelete=await Usuario.deleteOne({cedula:body.cedula});
                return response.json(UsuarioDelete)
            }catch(error){
                console.log(error)
            }
        }
    }    
}


*/


const {Usuario}=require("../models/Models.js")// Asegúrate de importar correctamente tu modelo Usuario

module.exports= async function DeleteUser(request,response){
    const { cedula } = request.body;
    
    try {
        let usuarioDelete;
        
       if (cedula) {
            usuarioDelete = await Usuario.deleteOne({ cedula: cedula});
        }
        
        if (usuarioDelete.deletedCount === 1) {
            return response.json({ message: 'Usuario eliminado correctamente.' });
        } else {
            return response.status(404).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error al eliminar el usuario.' });
    }
}

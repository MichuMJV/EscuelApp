const {Usuario}=require("../models/Models.js")

module.exports= async function ActualizarRol(request,response){
    const cedula = request.body.cedula
    const nuevoRol = request.body.rol // 1:admin, 2:profesor, 3:alumno

    Usuario.updateOne({ cedula: cedula }, { rol: nuevoRol }, (err, res) => {
      if (err) {
        return response.json({success:false,message:'Error al actualizar el rol del usuario:', errno:err});
      } else {
        return response.json({success:true,message:'Rol del usuario actualizado correctamente'});
      }
    });
}
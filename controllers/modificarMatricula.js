const {Salon}=require("../models/Models.js")
const {Usuario}=require("../models/Models.js")
const {SalonEstudiante}=require("../models/Models.js")

const opcionesStatus=["Matriculado","Retirado","Aprobado","Reprobado"]

module.exports= async function modificarMatricula(request,response){
    let body=request.body

    request.profesor=await Usuario.findOne({_id:request.query.idProfesor})
    request.SalonEstudiante=await SalonEstudiante.findOne({_id:request.query.idMatricula})
    request.salon=await Salon.findOne(({_id:request.SalonEstudiante.idgrupo}))
    
    if(request.salon.idprofesor!==request.profesor._id)
        return response.json({success:false,message:"No eres el profesor de este salon"})

    if(opcionesStatus.includes(body.status))
        return response.json({success:false,message:"Status no valido"})

    if(body.nota>100 || body.nota<0 || Number(body.nota))
        return response.json({success:false,message:"Nota no valida"})

    let dataUpdating={
        status:body.status,
        notafinal:body.nota
    }

    try{
        let Upstatus=await SalonEstudiante.updateOne({_id:request.SalonEstudiante._id},dataUpdating)
        response.json(Upstatus)
    }catch(e){
        console.log(e)
        return response.json({success:false, message:"Error al modificar"})
    }
}
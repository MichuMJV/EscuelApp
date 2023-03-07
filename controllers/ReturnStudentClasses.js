const {Usuario}=require("../models/Models.js")
const {SalonEstudiante}=require("../models/Models.js")
const {salon}=require("../models/Models.js")

module.exports= async function ReturnByStudent(request,response){

    request.Estudiante= await Usuario.findbyid(request.query.Sid);

    if(!request.Estudiante)
        return response.json({success:false,message:"Usuario no encontrado"})

    try{
        request.Salons=await SalonEstudiante.find({idestudiante:request.Estudiante.id});
    }catch(e){
        console.log(e)
        return response.json({success:false,message:"el estudiante no tiene salones asignados"})
    }

    let salonsArray=[]

    for(const element of request.Salons)
        salonsArray.push(await salon.select({id:element.idsalon}))//se agarra el id del salon en especifico de los salones que se devolvieron de salon estudiante y se devuelve la informacion entera del mismo 

    return response.json({success:true, salons:salonsArray})

}
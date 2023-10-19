const {Usuario}=require("../models/Models.js")
const {salon}=require("../models/Models.js")

module.exports= async function ReturnByTeacher(request,response){
    
    try{
        request.Teacher= await Usuario.findbyid(request.query.Tid);

        if(!request.Teacher)
            return response.json({success:false,message:"profesor no encontrado"})
        
        if(request.Teacher.rol!==2)
            return response.json({success:false,message:"no es profesor"})

        request.Salons=await salon.find({idprofesor:request.Teacher.id});
        return response.json(request.Salons)

    }catch(error){
        console.log(error)
    }
}
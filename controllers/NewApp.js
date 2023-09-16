const {Apps}=require("../models/Models.js")

module.exports= async function NewApp(request,response){
    let body=request.body
    
    request.app=await Apps.find({nombre:body.nombre})

    let AppData={nombre:body.nombre,imagen:body.imagen,link:body.link}

    if(!request.app.length == 0) 
        return response.json({success:false,message:"Esta aplicación ya existe"})

    if(Object.keys(body.nombre).length > 15)
        return response.json({success:false,message:"El nombre de la aplicación es muy largo"})

    try{
        const App = new Apps(AppData);
        await App.save()
        return response.json({success:true,message:"Aplicación agregada"})
    }catch(error){
        console.log(error)
        return response.json({success:false,message:"error al guardar la aplicación"})
    }

}
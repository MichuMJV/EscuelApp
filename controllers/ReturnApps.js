const {Apps}=require("../models/Models.js")

module.exports= async function ReturnApps(request,response){
    try{
        let AppsData=await Apps.find()
        return response.json(AppsData)
    }catch(e){
        return response.json({err:e})
    }    
}
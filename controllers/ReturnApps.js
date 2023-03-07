const {Apps}=require("../models/Models.js")

module.exports= async function ReturnApps(res){
    try{
        let AppsData=await Apps.find()
        console.log(AppsData)
        return res.json(AppsData)
    }catch(e){
        return res.json({err:e})
    }
}

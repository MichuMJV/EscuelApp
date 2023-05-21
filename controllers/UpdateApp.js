const {Apps}=require("../models/Models.js")

module.exports= async function UpdateApp(request,response){
    let body=request.body

    const filter = { _id: body.id }
    const update = {nombre:body.nombre,imagen:body.imagen,link:body.link}

    const doc = await Apps.findOneAndUpdate(filter, update, {
      new: true
    })
}
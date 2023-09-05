const mongoose = require("mongoose")
const conectarDB= ()=>{
    try{
        mongoose.set('strictQuery', false)
        mongoose.connect('mongodb://127.0.0.1:27017/EscuelAPP', { useNewUrlParser: true });
    }
    catch(error){
        console.log("mal ahí",error)
    }
}

module.exports=conectarDB
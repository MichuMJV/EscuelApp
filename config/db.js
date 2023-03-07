const mongoose = require("mongoose")
const conectarDB= ()=>{
    try{
        mongoose.set('strictQuery', false)
        mongoose.connect('mongodb://localhost/mydatabase', { useNewUrlParser: true });
    }
    catch(error){
        console.log("mal ahí",error)
    }
}

module.exports=conectarDB
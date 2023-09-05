const mongoose =require("mongoose")
// schemas

const usuariosqueme= mongoose.Schema({
    rol: Number,//1:admin, 2:profesor, 3:alumno
    nombre: String,
    cedula:String,
    contrasena: String})

const salonSqueme= mongoose.Schema({
    idprofe: mongoose.Schema.ObjectId,
    codsalon: String,
    grado: String,
    materia: String,
    fecha: Date,
    clave: String,
    logo: String,
    cupo: Number
})

const tareaSqueme= mongoose.Schema({
    idgrupo: mongoose.Schema.ObjectId,
    descripcion: String,
    doctarea:String
})

const tareaEstudianteSqueme= mongoose.Schema({
    idtarea: mongoose.Schema.ObjectId,
    idestudiante: mongoose.Schema.ObjectId,
    nota: String,
    docentrega:String
})

const salonEstudianteSqueme= mongoose.Schema({
    idgrupo: mongoose.Schema.ObjectId,
    idestudiante: mongoose.Schema.ObjectId,
    status: String,//Matriculado, Retirado, Aprobado, Reprobado
    notafinal: String,//0-100
    fecha:Date
})

const AplicacionesSqueme= mongoose.Schema({
    nombre: String,
    imagen: String,
    link: String
})


// squema declarations

const Usuario= mongoose.model('usuariosEscuela', usuariosqueme)
const Salon= mongoose.model('salonesEscuela', salonSqueme)
const Tarea= mongoose.model('tareasEscuela', tareaSqueme)
const TareaEstudiante= mongoose.model('tareasEstudianteEscuela', tareaEstudianteSqueme)
const SalonEstudiante= mongoose.model('salonesEstudianteEscuela', salonEstudianteSqueme)
const Apps= mongoose.model('AplicacionesSqueme', AplicacionesSqueme)

module.exports={Usuario, Salon, Tarea, TareaEstudiante, SalonEstudiante,Apps}
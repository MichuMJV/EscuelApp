const mongoose = require("mongoose");

// Schemas
const usuarioSchema = mongoose.Schema({
    rol: Number, // 1: administrador, 2: profesor, 3: estudiante
    nombre: String,
    cedula: String,
    contrasena: String
});

const salonSchema = mongoose.Schema({
    idprofe: mongoose.Schema.ObjectId,
    nombre: String,
    grado: Number,
    materia: String,
    fecha: Date,
    clave: String,
    logo: String,
    cupo: Number
});

const tareaSchema = mongoose.Schema({
    idgrupo: mongoose.Schema.ObjectId,
    tema: {
        type: String,
        trim: true,
        default: "Sin tema"
    },
    nombre: String,
    descripcion: String,
    doctarea: String,
    fecha: {
        type: Date,
        default: Date.now
    },
    fechavencimiento: Date
});

const tareaEstudianteSchema = mongoose.Schema({
    idtarea: mongoose.Schema.ObjectId,
    idestudiante: mongoose.Schema.ObjectId,
    nota: String,
    docentrega: String,
    fechaentrega: Date
});

const salonEstudianteSchema = mongoose.Schema({
    idgrupo: mongoose.Schema.ObjectId,
    idestudiante: mongoose.Schema.ObjectId,
    status: String, // Matriculado, Retirado, Aprobado, Reprobado
    notafinal: String, // 0-100
    fecha: Date
});

const aplicacionesSchema = mongoose.Schema({
    nombre: String,
    imagen: String,
    link: String
});

// Model declarations
const Usuario = mongoose.model("usuariosEscuela", usuarioSchema);
const Salon = mongoose.model("salonesEscuela", salonSchema);
const Tarea = mongoose.model("tareasEscuela", tareaSchema);
const TareaEstudiante = mongoose.model(
    "tareasEstudianteEscuela",
    tareaEstudianteSchema
);
const SalonEstudiante = mongoose.model(
    "salonesEstudianteEscuela",
    salonEstudianteSchema
);
const Apps = mongoose.model("AplicacionesSqueme", aplicacionesSchema);

module.exports = {
    Usuario,
    Salon,
    Tarea,
    TareaEstudiante,
    SalonEstudiante,
    Apps
};
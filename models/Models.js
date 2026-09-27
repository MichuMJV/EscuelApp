const mongoose = require("mongoose");

// =========================================================
// ESQUEMA DE USUARIOS
// =========================================================

const usuarioSchema = mongoose.Schema({
    rol: {
        type: Number,
        required: true,
        enum: [1, 2, 3]
        // 1: administrador
        // 2: profesor
        // 3: estudiante
    },

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    cedula: {
        type: String,
        required: true,
        trim: true
    },

    contrasena: {
        type: String,
        required: true
    },

    debeCambiarContrasena: {
        type: Boolean,
        default: false
    },

    fechaCambioContrasena: {
        type: Date,
        default: null
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

// =========================================================
// ESQUEMA DE SALONES
// =========================================================

const salonSchema = mongoose.Schema({
    idprofe: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    grado: {
        type: Number,
        required: true
    },

    materia: {
        type: String,
        required: true,
        trim: true
    },

    fecha: {
        type: Date,
        default: Date.now
    },

    clave: {
        type: String,
        required: true,
        trim: true
    },

    logo: {
        type: String,
        trim: true
    },

    cupo: {
        type: Number,
        required: true,
        min: 0
    }
});

// =========================================================
// ESQUEMA DE TAREAS
// =========================================================

const tareaSchema = mongoose.Schema({
    idgrupo: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    tema: {
        type: String,
        trim: true,
        default: "Sin tema"
    },

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    descripcion: {
        type: String,
        required: true,
        trim: true
    },

    doctarea: {
        type: String,
        required: true,
        trim: true
    },

    fecha: {
        type: Date,
        default: Date.now
    },

    fechavencimiento: {
        type: Date,
        required: true
    }
});

// =========================================================
// ESQUEMA DE TAREAS ASIGNADAS A ESTUDIANTES
// =========================================================

const tareaEstudianteSchema = mongoose.Schema({
    idtarea: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    idestudiante: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    nota: {
        type: String,
        default: null
    },

    docentrega: {
        type: String,
        default: null,
        trim: true
    },

    fechaentrega: {
        type: Date,
        default: null
    }
});

// =========================================================
// ESQUEMA DE MATRÍCULAS
// =========================================================

const salonEstudianteSchema = mongoose.Schema({
    idgrupo: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    idestudiante: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

    status: {
        type: String,
        enum: [
            "Matriculado",
            "Retirado",
            "Aprobado",
            "Reprobado"
        ],
        default: "Matriculado"
    },

    notafinal: {
        type: String,
        default: "0"
    },

    fecha: {
        type: Date,
        default: Date.now
    }
});

// =========================================================
// ESQUEMA DE APLICACIONES
// =========================================================

const aplicacionesSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    imagen: {
        type: String,
        required: true,
        trim: true
    },

    link: {
        type: String,
        required: true,
        trim: true
    }
});

// =========================================================
// ÍNDICES
// =========================================================

// Permite consultar usuarios por cédula rápidamente.
// La prevención de duplicados también se realizará en los controladores.
usuarioSchema.index({
    cedula: 1
});

// Evita que un mismo estudiante tenga dos matrículas en el mismo salón.
salonEstudianteSchema.index(
    {
        idgrupo: 1,
        idestudiante: 1
    },
    {
        unique: true
    }
);

// Evita asignar dos veces la misma tarea al mismo estudiante.
tareaEstudianteSchema.index(
    {
        idtarea: 1,
        idestudiante: 1
    },
    {
        unique: true
    }
);

// Mejora las consultas de tareas por salón.
tareaSchema.index({
    idgrupo: 1,
    tema: 1,
    fechavencimiento: 1
});

// =========================================================
// DECLARACIÓN DE MODELOS
// =========================================================

const Usuario = mongoose.model(
    "usuariosEscuela",
    usuarioSchema
);

const Salon = mongoose.model(
    "salonesEscuela",
    salonSchema
);

const Tarea = mongoose.model(
    "tareasEscuela",
    tareaSchema
);

const TareaEstudiante = mongoose.model(
    "tareasEstudianteEscuela",
    tareaEstudianteSchema
);

const SalonEstudiante = mongoose.model(
    "salonesEstudianteEscuela",
    salonEstudianteSchema
);

const Apps = mongoose.model(
    "AplicacionesSqueme",
    aplicacionesSchema
);

// =========================================================
// EXPORTACIÓN DE MODELOS
// =========================================================

module.exports = {
    Usuario,
    Salon,
    Tarea,
    TareaEstudiante,
    SalonEstudiante,
    Apps
};
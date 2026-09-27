require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();
const port = 5000;

const basededatos = require("./config/db.js");

// =========================================================
// CONEXIÓN A LA BASE DE DATOS
// =========================================================

basededatos();

// =========================================================
// CONTROLADORES DEL DASHBOARD
// =========================================================

const getAdminDashboardData = require(
    "./controllers/getAdminDashboardData.js"
);

const getDashboardData = require(
    "./controllers/getDashboardData.js"
);

const updateNota = require(
    "./controllers/updateNota.js"
);

// =========================================================
// CONTROLADORES DE SALONES
// =========================================================

const GetSalonDetails = require(
    "./controllers/GetSalonDetails.js"
);

const NewSalon = require(
    "./controllers/NewSalon.js"
);

const UpdateSalon = require(
    "./controllers/UpdateSalon.js"
);

const DeleteSalon = require(
    "./controllers/DeleteSalon.js"
);

const ReturnAllSalons = require(
    "./controllers/ReturnAllSalons.js"
);

const ReturnIDCodMateria = require(
    "./controllers/ReturnIDMateria.js"
);

const ReturnSalonsByCodSalon = require(
    "./controllers/ReturnSalonsByCodSalon.js"
);

const ReturnSalonsByGrado = require(
    "./controllers/ReturnSalonsByGrado.js"
);

const ReturnSalonsByProfessor = require(
    "./controllers/ReturnSalonsByProfessor.js"
);

const returnTeachersSalon = require(
    "./controllers/returnTeachersSalon.js"
);

// =========================================================
// CONTROLADORES DE TAREAS
// =========================================================

const GetTareasPorSalon = require(
    "./controllers/GetTareasPorSalon.js"
);

const GetTareaById = require(
    "./controllers/GetTareaById.js"
);

const GetTareasParaEstudiante = require(
    "./controllers/GetTareasParaEstudiante.js"
);

const NewTarea = require(
    "./controllers/NewTarea.js"
);

const UpdateTarea = require(
    "./controllers/UpdateTarea.js"
);

const EstudianteEntregaTarea = require(
    "./controllers/EstudianteEntregaTarea.js"
);

// =========================================================
// CONTROLADORES DE ESTUDIANTES Y MATRÍCULAS
// =========================================================

const getSalonesEstudiante = require(
    "./controllers/getSalonesEstudiante.js"
);

const returnStudentClasses = require(
    "./controllers/returnStudentClasses.js"
);

const Matricular = require(
    "./controllers/Matricular.js"
);

const modificarMatricula = require(
    "./controllers/modificarMatricula.js"
);

const returnMatricula = require(
    "./controllers/returnMatricula.js"
);

const AdministrarMatriculaIndividual = require(
    "./controllers/AdministrarMatriculaIndividual.js"
);

const ProcesarMatriculasAdmin = require(
    "./controllers/ProcesarMatriculasAdmin.js"
);

const DescargarPlantillaMatriculas = require(
    "./controllers/DescargarPlantillaMatriculas.js"
);

// =========================================================
// CONTROLADORES DE USUARIOS Y AUTENTICACIÓN
// =========================================================

const register = require(
    "./controllers/register.js"
);

const startSesion = require(
    "./controllers/startSesion.js"
);

const CambiarContrasena = require(
    "./controllers/CambiarContrasena.js"
);

const returnUser = require(
    "./controllers/returnUser.js"
);

const UpdateUsers = require(
    "./controllers/UpdateUsers.js"
);

const NuevoRol = require(
    "./controllers/UpdateRol.js"
);

const DeleteUser = require(
    "./controllers/DeleteUser.js"
);

// =========================================================
// CONTROLADORES DE APLICACIONES
// =========================================================

const ReturnApps = require(
    "./controllers/ReturnApps.js"
);

const NewApp = require(
    "./controllers/NewApp.js"
);

const UpdateApp = require(
    "./controllers/UpdateApp.js"
);

const DeleteApp = require(
    "./controllers/DeleteApp.js"
);

// =========================================================
// CONFIGURACIÓN DE MULTER PARA EXCEL
// =========================================================

const almacenamientoExcel = multer.memoryStorage();

const tiposExcelPermitidos = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream"
];

const uploadExcel = multer({
    storage: almacenamientoExcel,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },

    fileFilter: function (
        request,
        archivo,
        callback
    ) {
        const extension = path
            .extname(archivo.originalname)
            .toLowerCase();

        const extensionValida = [
            ".xlsx",
            ".xls"
        ].includes(extension);

        const tipoValido =
            tiposExcelPermitidos.includes(
                archivo.mimetype
            );

        if (!extensionValida || !tipoValido) {
            return callback(
                new Error(
                    "Solo se permiten archivos Excel con extensión .xlsx o .xls."
                )
            );
        }

        return callback(null, true);
    }
});

// =========================================================
// MIDDLEWARE GENERAL
// =========================================================

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(cors());

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);

app.use(
    express.static(
        path.join(__dirname, "Frontend")
    )
);

// =========================================================
// RUTAS DELETE
// =========================================================

app.delete(
    "/Escuelapp/DeleteSalon",
    DeleteSalon
);

app.delete(
    "/Escuelapp/DeleteApp",
    DeleteApp
);

app.delete(
    "/Escuelapp/DeleteUser",
    DeleteUser
);

// =========================================================
// RUTAS PUT
// =========================================================

app.put(
    "/Escuelapp/update-nota",
    updateNota
);

app.put(
    "/Escuelapp/modificarMatricula",
    modificarMatricula
);

app.put(
    "/Escuelapp/UpdateTarea",
    UpdateTarea
);

app.put(
    "/Escuelapp/nuevoRol",
    NuevoRol
);

app.put(
    "/Escuelapp/UpdateApp",
    UpdateApp
);

app.put(
    "/Escuelapp/UpdateUsers",
    UpdateUsers
);

app.put(
    "/Escuelapp/UpdateSalon",
    UpdateSalon
);

app.put(
    "/Escuelapp/CambiarContrasena",
    CambiarContrasena
);

// =========================================================
// RUTAS POST
// =========================================================

app.post(
    "/Escuelapp/inicio_sesion",
    startSesion
);

app.post(
    "/Escuelapp/EstudianteEntregaTarea",
    EstudianteEntregaTarea
);

app.post(
    "/Escuelapp/Matricular",
    Matricular
);

app.post(
    "/Escuelapp/AdministrarMatriculaIndividual",
    AdministrarMatriculaIndividual
);

app.post(
    "/Escuelapp/ProcesarMatriculasAdmin",
    function (
        request,
        response,
        next
    ) {
        uploadExcel.single("archivo")(
            request,
            response,
            function (error) {
                if (error) {
                    return manejarErrorCargaExcel(
                        error,
                        response
                    );
                }

                return next();
            }
        );
    },
    ProcesarMatriculasAdmin
);

app.post(
    "/Escuelapp/NewApp",
    NewApp
);

app.post(
    "/Escuelapp/NewSalon",
    NewSalon
);

app.post(
    "/Escuelapp/NewTarea",
    NewTarea
);

app.post(
    "/Escuelapp/Register",
    register
);

// =========================================================
// RUTAS GET
// =========================================================

app.get(
    "/Escuelapp/admin-dashboard-data",
    getAdminDashboardData
);

app.get(
    "/Escuelapp/dashboard-data",
    getDashboardData
);

app.get(
    "/Escuelapp/GetSalonDetails",
    GetSalonDetails
);

app.get(
    "/Escuelapp/tareas",
    GetTareasPorSalon
);

app.get(
    "/Escuelapp/salones-estudiante",
    getSalonesEstudiante
);

app.get(
    "/Escuelapp/tarea_unica",
    GetTareaById
);

app.get(
    "/Escuelapp/GetTareasParaEstudiante",
    GetTareasParaEstudiante
);

app.get(
    "/Escuelapp/ReturnApps",
    ReturnApps
);

app.get(
    "/Escuelapp/AllSalones",
    ReturnAllSalons
);

app.get(
    "/Escuelapp/returnEstudiantesDeGrupo",
    returnMatricula
);

app.get(
    "/Escuelapp/Materias-de-estudiante",
    returnStudentClasses
);

app.get(
    "/Escuelapp/returnTeachersSalon",
    returnTeachersSalon
);

app.get(
    "/Escuelapp/returnUser",
    returnUser
);

app.get(
    "/Escuelapp/ReturnIDCodMateria",
    ReturnIDCodMateria
);

app.get(
    "/Escuelapp/ReturnSalonsByCodSalon",
    ReturnSalonsByCodSalon
);

app.get(
    "/Escuelapp/ReturnSalonsByGrado",
    ReturnSalonsByGrado
);

app.get(
    "/Escuelapp/ReturnSalonsByProfessor",
    ReturnSalonsByProfessor
);

app.get(
    "/Escuelapp/DescargarPlantillaMatriculas",
    DescargarPlantillaMatriculas
);

// =========================================================
// RUTA DE API NO ENCONTRADA
// =========================================================

app.use(
    "/Escuelapp",
    function (
        request,
        response
    ) {
        return response.status(404).json({
            success: false,
            message:
                "La ruta solicitada no existe."
        });
    }
);

// =========================================================
// MANEJO GENERAL DE ERRORES
// =========================================================

app.use(
    function (
        error,
        request,
        response,
        next
    ) {
        console.error(
            "Error no controlado en el servidor:",
            error
        );

        if (response.headersSent) {
            return next(error);
        }

        return response.status(500).json({
            success: false,
            message:
                "Ocurrió un error interno en el servidor."
        });
    }
);

// =========================================================
// INICIO DEL SERVIDOR
// =========================================================

app.listen(
    port,
    function () {
        console.log(
            `Servidor disponible en http://127.0.0.1:${port}/screens/inicio_sesion.html`
        );
    }
);

// =========================================================
// FUNCIONES AUXILIARES
// =========================================================

function manejarErrorCargaExcel(
    error,
    response
) {
    if (
        error instanceof multer.MulterError
    ) {
        if (
            error.code ===
            "LIMIT_FILE_SIZE"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "El archivo Excel no puede superar los 5 MB."
            });
        }

        if (
            error.code ===
            "LIMIT_FILE_COUNT"
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Solo se puede procesar un archivo a la vez."
            });
        }

        return response.status(400).json({
            success: false,
            message:
                "No fue posible recibir el archivo Excel."
        });
    }

    return response.status(400).json({
        success: false,
        message:
            error.message ||
            "El archivo seleccionado no es válido."
    });
}
require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

const basededatos = require("./config/db.js");
const port = 5000;

// --- Database Connection ---
basededatos();

// --- Controller Imports ---
const getAdminDashboardData = require("./controllers/getAdminDashboardData.js");
const getDashboardData = require("./controllers/getDashboardData.js");
const updateNota = require("./controllers/updateNota.js");
const GetSalonDetails = require("./controllers/GetSalonDetails.js");
const GetTareasPorSalon = require('./controllers/GetTareasPorSalon.js');
const getSalonesEstudiante = require("./controllers/getSalonesEstudiante.js");
const GetTareaById = require('./controllers/GetTareaById.js');
const GetTareasParaEstudiante = require('./controllers/GetTareasParaEstudiante.js');
const DeleteUser = require("./controllers/DeleteUser.js");
const DeleteSalon = require("./controllers/DeleteSalon.js");
const DeleteApp = require("./controllers/DeleteApp.js");
const EstudianteEntregaTarea = require("./controllers/EstudianteEntregaTarea.js");
const ReturnApps = require("./controllers/ReturnApps.js");
const Matricular = require("./controllers/Matricular.js");
const modificarMatricula = require("./controllers/modificarMatricula.js");
const NewApp = require("./controllers/NewApp.js");
const UpdateApp = require("./controllers/UpdateApp.js");
const UpdateTarea = require('./controllers/UpdateTarea.js');
const NewSalon = require("./controllers/NewSalon.js");
const NewTarea = require("./controllers/NewTarea.js");
const register = require("./controllers/register.js");
const returnMatricula = require("./controllers/returnMatricula.js");
const returnStudentClasses = require("./controllers/returnStudentClasses.js");
const returnTeachersSalon = require("./controllers/returnTeachersSalon.js");
const returnUser = require("./controllers/returnUser.js");
const ReturnAllSalons = require("./controllers/ReturnAllSalons.js");
const ReturnIDCodMateria = require("./controllers/ReturnIDMateria.js");
const ReturnSalonsByCodSalon = require("./controllers/ReturnSalonsByCodSalon.js");
const ReturnSalonsByGrado = require("./controllers/ReturnSalonsByGrado.js");
const ReturnSalonsByProfessor = require("./controllers/ReturnSalonsByProfessor.js");
const startSesion = require("./controllers/startSesion.js");
const NuevoRol = require("./controllers/UpdateRol.js");
const UpdateUsers = require("./controllers/UpdateUsers.js");
const UpdateSalon = require("./controllers/UpdateSalon.js");

// --- Middleware ---
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Frontend')));

// --- API Routes ---

// DELETE Routes
app.delete("/Escuelapp/DeleteSalon", DeleteSalon);
app.delete("/Escuelapp/DeleteApp", DeleteApp);
app.delete("/Escuelapp/DeleteUser", DeleteUser);

// PUT Routes
app.put("/Escuelapp/update-nota", updateNota);
app.put("/Escuelapp/modificarMatricula", modificarMatricula);
app.put("/Escuelapp/UpdateTarea", UpdateTarea);
app.put("/Escuelapp/nuevoRol", NuevoRol);
app.put("/Escuelapp/UpdateApp", UpdateApp);
app.put("/Escuelapp/UpdateUsers", UpdateUsers);
app.put("/Escuelapp/UpdateSalon", UpdateSalon);

// POST Routes
app.post("/Escuelapp/inicio_sesion", startSesion);
app.post("/Escuelapp/EstudianteEntregaTarea", EstudianteEntregaTarea);
app.post("/Escuelapp/Matricular", Matricular);
app.post("/Escuelapp/NewApp", NewApp);
app.post("/Escuelapp/NewSalon", NewSalon);
app.post("/Escuelapp/NewTarea", NewTarea);
app.post("/Escuelapp/Register", register);

// GET Routes
app.get("/Escuelapp/admin-dashboard-data", getAdminDashboardData);
app.get("/Escuelapp/dashboard-data", getDashboardData);
app.get("/Escuelapp/GetSalonDetails", GetSalonDetails);
app.get('/Escuelapp/tareas', GetTareasPorSalon);
app.get("/Escuelapp/salones-estudiante", getSalonesEstudiante);
app.get("/Escuelapp/tarea_unica", GetTareaById);
app.get("/Escuelapp/GetTareasParaEstudiante", GetTareasParaEstudiante);
app.get("/Escuelapp/ReturnApps", ReturnApps);
app.get("/Escuelapp/AllSalones", ReturnAllSalons);
app.get("/Escuelapp/returnEstudiantesDeGrupo", returnMatricula);
app.get("/Escuelapp/Materias-de-estudiante", returnStudentClasses);
app.get("/Escuelapp/returnTeachersSalon", returnTeachersSalon);
app.get("/Escuelapp/returnUser", returnUser);
app.get("/Escuelapp/ReturnIDCodMateria", ReturnIDCodMateria);
app.get("/Escuelapp/ReturnSalonsByCodSalon", ReturnSalonsByCodSalon);
app.get("/Escuelapp/ReturnSalonsByGrado", ReturnSalonsByGrado);
app.get("/Escuelapp/ReturnSalonsByProfessor", ReturnSalonsByProfessor);

// --- Start Server ---
app.listen(port, () => {
    console.log(`http://127.0.0.1:${port}/screens/inicio_sesion.html`);
});

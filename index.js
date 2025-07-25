const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path"); // Import the 'path' module

const basededatos = require("./config/db.js");
const port = 5000;

// --- Database Connection ---
basededatos();

// --- Controller Imports ---
const GetSalonDetails = require("./controllers/GetSalonDetails.js");
const GetTareasPorSalon = require('./controllers/GetTareasPorSalon.js');
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
const NotaTarea = require("./controllers/NotaTarea.js");
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

// --- FIX: Serve Static Files ---
// This line tells Express to serve any files from the 'Frontend' directory.
// The 'path.join' is used to create a reliable path regardless of the operating system.
// This assumes your 'Frontend' folder is in the same directory as this server file.
app.use(express.static(path.join(__dirname, 'Frontend')));


// --- API Routes ---

// DELETE Routes
app.delete("/Escuelapp/DeleteSalon", DeleteSalon);
app.delete("/Escuelapp/DeleteApp", DeleteApp);
app.delete("/Escuelapp/DeleteUser", DeleteUser);

// PUT Routes
app.put("/Escuelapp/modificarMatricula", modificarMatricula);
app.put("/Escuelapp/UpdateTarea", UpdateTarea);
app.put("/Escuelapp/NotaTarea", NotaTarea);
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
app.get("/Escuelapp/GetSalonDetails", GetSalonDetails);
app.get('/Escuelapp/tareas', GetTareasPorSalon);
app.get("/Escuelapp/tarea_unica", GetTareaById);
app.get("/Escuelapp/tareasestudiante", GetTareasParaEstudiante);
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
    // The URL is now corrected. Because 'Frontend' is the static root, you don't include it in the path.
    console.log(`Server listening on port ${port}! The link is http://127.0.0.1:${port}/screens/inicio_sesion.html`);
});

const express= require("express")

const app=express()

const cors=require("cors")

const basededatos= require("./config/db.js")

const port=5000

basededatos()

const DeleteSalon=require("./controllers/DeleteSalon.js")
const DeleteApp=require("./controllers/DeleteApp.js")
const EstudianteEntregaTarea=require("./controllers/EstudianteEntregaTarea.js")
const ReturnApps=require("./controllers/ReturnApps.js")
const Matricular=require("./controllers/Matricular.js")
const modificarMatricula=require("./controllers/modificarMatricula.js")
const NewApp=require("./controllers/NewApp.js")
const UpdateApp=require("./controllers/UpdateApp.js")
const NewSalon=require("./controllers/NewSalon.js")
const NewTarea=require("./controllers/NewTarea.js")
const register=require("./controllers/register.js")
const NotaTarea=require("./controllers/NotaTarea.js")
const returnMatricula=require("./controllers/returnMatricula.js")
const returnStudentClasses=require("./controllers/returnStudentClasses.js")
const returnTeachersSalon=require("./controllers/returnTeachersSalon.js")
const returnUser=require("./controllers/returnUser.js")
const ReturnAllSalons=require("./controllers/ReturnAllSalons.js")
const ReturnIDCodMateria=require("./controllers/ReturnIDMateria.js")
const ReturnSalonsByCodSalon=require("./controllers/ReturnSalonsByCodSalon.js")
const ReturnSalonsByGrado=require("./controllers/ReturnSalonsByGrado.js")
const ReturnSalonsByProfessor=require("./controllers/ReturnSalonsByProfessor.js")
const startSesion=require("./controllers/startSesion.js")
const NuevoRol=require("./controllers/UpdateRol.js")

app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:true}))

app.delete("/Escuelapp/DeleteSalon",DeleteSalon)
app.delete("/Escuelapp/DeleteApp",DeleteApp)

app.put("/Escuelapp/modificarMatricula",modificarMatricula)
app.put("/Escuelapp/NotaTarea",NotaTarea)
app.put("/Escuelapp/nuevoRol",NuevoRol)
app.put("/Escuelapp/UpdateApp",UpdateApp)

app.post("/Escuelapp/inicio_sesion",startSesion)
app.post("/Escuelapp/EstudianteEntregaTarea",EstudianteEntregaTarea)
app.post("/Escuelapp/Matricular",Matricular)
app.post("/Escuelapp/NewApp",NewApp)
app.post("/Escuelapp/NewSalon",NewSalon)
app.post("/Escuelapp/NewTarea",NewTarea)
app.post("/Escuelapp/Register",register)

app.get("/Escuelapp/ReturnApps",ReturnApps)
app.get("/Escuelapp/AllSalones",ReturnAllSalons)
app.get("/Escuelapp/returnEstudiantesDeGrupo",returnMatricula)
app.get("/Escuelapp/Materias-de-estudiante",returnStudentClasses)
app.get("/Escuelapp/returnTeachersSalon",returnTeachersSalon)
app.get("/Escuelapp/returnUser",returnUser)
app.get("/Escuelapp/ReturnIDCodMateria",ReturnIDCodMateria)
app.get("/Escuelapp/ReturnSalonsByCodSalon",ReturnSalonsByCodSalon)
app.get("/Escuelapp/ReturnSalonsByGrado",ReturnSalonsByGrado)
app.get("/Escuelapp/ReturnSalonsByProfessor",ReturnSalonsByProfessor)

app.listen(port, ()=> console.log(`exampl app listening on port ${port}! the link is  http://127.0.0.1:5501/Frontend/screens/inicio_sesion.html `))
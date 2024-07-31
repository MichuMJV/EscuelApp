let salon=JSON.parse(localStorage.getItem("salonelegido"))
console.log(salon)
document.getElementById("imagen").src=salon.logo
document.getElementById("nombreMat").innerText=salon.nombre
document.getElementById("codigo").innerText=salon.clave
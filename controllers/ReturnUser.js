const { Usuario } = require("../models/Models.js");

module.exports = async function retornoUsers(request, response) {
  try {
    const userData = await Usuario.find();
    response.json(userData);
  } catch (error) {
    response.json({ msj: "Hubo problemas encontrando los usuarios" });
    console.log(error);
  }
};

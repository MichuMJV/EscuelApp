const { Usuario } = require("../models/Models.js");

module.exports = async function updateUser(request, response) {
  const { id, fieldName, value } = request.body;

  try {
    let updatedUser;

    switch (fieldName) {
      case 'nombre':
        updatedUser = await Usuario.findByIdAndUpdate(id, { nombre: value }, { new: true });
        break;
      case 'cedula':
        updatedUser = await Usuario.findByIdAndUpdate(id, { cedula: value }, { new: true });
        break;
      case 'contrasena':
        updatedUser = await Usuario.findByIdAndUpdate(id, { contrasena: value }, { new: true });
        break;
      default:
        throw new Error('Campo no válido');
    }

    console.log(updatedUser);
    response.json(updatedUser);
  } catch (error) {
    response.json({ msj: "Hubo problemas actualizando el usuario" });
    console.log(error);
  }
};
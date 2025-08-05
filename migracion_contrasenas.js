// migracion_contrasenas.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Usuario } = require('./models/Models.js'); // Asegúrate de que la ruta a tus modelos sea correcta
const basededatos = require('./config/db.js'); // Reutilizamos tu configuración de conexión

/**
 * Este script se conecta a la base de datos, busca todos los usuarios,
 * y encripta las contraseñas que no estén ya encriptadas.
 */
async function migrarContrasenas() {
    console.log('Iniciando script de migración de contraseñas...');

    // Conectamos a la base de datos
    await basededatos();

    // 1. Buscamos todos los usuarios en la base de datos
    const usuarios = await Usuario.find({});
    console.log(`Se encontraron ${usuarios.length} usuarios.`);

    let contrasenasMigradas = 0;

    // 2. Recorremos cada usuario uno por uno
    for (const usuario of usuarios) {
        // 3. Verificamos si la contraseña ya está hasheada
        // Los hashes de bcrypt usualmente empiezan con '$2a$', '$2b$', etc.
        // Si no empieza así, es texto plano y necesita ser migrada.
        if (usuario.contrasena && !usuario.contrasena.startsWith('$2')) {
            console.log(`Migrando contraseña para el usuario: ${usuario.nombre}...`);

            // 4. Hasheamos la contraseña de texto plano
            const salt = await bcrypt.genSalt(10);
            const contrasenaHasheada = await bcrypt.hash(usuario.contrasena, salt);

            // 5. Actualizamos el campo de la contraseña del usuario
            usuario.contrasena = contrasenaHasheada;

            // 6. Guardamos los cambios en la base de datos
            await usuario.save();
            contrasenasMigradas++;
        } else {
            console.log(`La contraseña para ${usuario.nombre} ya está hasheada. Omitiendo.`);
        }
    }

    console.log(`\n¡Migración completada!`);
    console.log(`Total de contraseñas migradas: ${contrasenasMigradas}`);
}

// --- Ejecución del Script ---
migrarContrasenas()
    .catch(error => console.error('Ocurrió un error durante la migración:', error))
    .finally(() => {
        // 7. Cerramos la conexión a la base de datos para que el script termine.
        console.log('Cerrando conexión a la base de datos.');
        mongoose.connection.close();
    });
const mongoose = require("mongoose");

async function conectarDB() {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/EscuelAPP";
    mongoose.set("strictQuery", false);

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
        console.log("Conexión con MongoDB establecida correctamente.");
        return mongoose.connection;
    } catch (error) {
        console.error("No fue posible conectar con MongoDB:", error);
        throw error;
    }
}

module.exports = conectarDB;

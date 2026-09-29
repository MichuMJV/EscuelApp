const multer = require("multer");
const mongoose = require("mongoose");
const { Readable } = require("stream");

const TAMANO_MAXIMO_ARCHIVO = 25 * 1024 * 1024;
const MAXIMO_ARCHIVOS_TAREA = 5;
const NOMBRE_BUCKET = "archivosEscuelApp";

const EXTENSIONES_PERMITIDAS = new Set([
    ".doc", ".docx", ".xls", ".xlsx", ".csv",
    ".ppt", ".pptx", ".pdf", ".txt",
    ".jpg", ".jpeg", ".png"
]);

const TIPOS_MIME_PERMITIDOS = new Set([
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png",
    "application/octet-stream"
]);

function obtenerExtension(nombre) {
    const texto = String(nombre || "").trim().toLowerCase();
    const posicion = texto.lastIndexOf(".");
    return posicion >= 0 ? texto.slice(posicion) : "";
}

function normalizarNombreArchivo(nombre) {
    const nombreBase = String(nombre || "archivo")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\\/<>:"|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, " ")
        .trim();

    return nombreBase.slice(0, 180) || "archivo";
}

function validarArchivo(request, archivo, callback) {
    const extension = obtenerExtension(archivo.originalname);
    const tipoMime = String(archivo.mimetype || "").toLowerCase();

    if (!EXTENSIONES_PERMITIDAS.has(extension)) {
        return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", archivo.fieldname));
    }

    if (!TIPOS_MIME_PERMITIDOS.has(tipoMime)) {
        return callback(new Error(`Tipo de archivo no permitido: ${tipoMime || "desconocido"}.`));
    }

    callback(null, true);
}

const almacenamientoMemoria = multer.memoryStorage();

const subirMaterialesTarea = multer({
    storage: almacenamientoMemoria,
    limits: {
        fileSize: TAMANO_MAXIMO_ARCHIVO,
        files: MAXIMO_ARCHIVOS_TAREA
    },
    fileFilter: validarArchivo
}).array("archivosTarea", MAXIMO_ARCHIVOS_TAREA);

const subirEntregaEstudiante = multer({
    storage: almacenamientoMemoria,
    limits: {
        fileSize: TAMANO_MAXIMO_ARCHIVO,
        files: 1
    },
    fileFilter: validarArchivo
}).single("archivoEntrega");

function obtenerBucket() {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        throw new Error("La conexión con MongoDB todavía no está disponible.");
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: NOMBRE_BUCKET
    });
}

function normalizarObjectId(valor, etiqueta = "identificador") {
    if (!valor || !mongoose.Types.ObjectId.isValid(valor)) {
        throw new Error(`El ${etiqueta} no es válido.`);
    }

    return new mongoose.Types.ObjectId(String(valor));
}

async function guardarArchivoGridFS(archivo, metadatos = {}) {
    if (!archivo || !Buffer.isBuffer(archivo.buffer)) {
        throw new Error("No se recibió un archivo válido para almacenar.");
    }

    const bucket = obtenerBucket();
    const nombreOriginal = normalizarNombreArchivo(archivo.originalname);
    const streamSubida = bucket.openUploadStream(nombreOriginal, {
        contentType: archivo.mimetype,
        metadata: {
            ...metadatos,
            nombreOriginal,
            tipoContenido: archivo.mimetype,
            tamano: archivo.size,
            categoria: metadatos.categoria || "archivo_tarea"
        }
    });

    await new Promise((resolve, reject) => {
        Readable.from(archivo.buffer)
            .on("error", reject)
            .pipe(streamSubida)
            .on("error", reject)
            .on("finish", resolve);
    });

    return {
        archivoId: streamSubida.id,
        nombre: nombreOriginal,
        tipo: archivo.mimetype,
        tamano: archivo.size,
        fechaCarga: new Date()
    };
}

async function guardarVariosArchivosGridFS(archivos, metadatos = {}) {
    const guardados = [];

    try {
        for (const archivo of archivos || []) {
            guardados.push(await guardarArchivoGridFS(archivo, metadatos));
        }
        return guardados;
    } catch (error) {
        await Promise.allSettled(
            guardados.map((archivo) => eliminarArchivoGridFS(archivo.archivoId))
        );
        throw error;
    }
}

async function buscarArchivoGridFS(idArchivo) {
    const archivoId = normalizarObjectId(idArchivo, "ID del archivo");
    const archivos = await obtenerBucket().find({ _id: archivoId }).limit(1).toArray();
    return archivos[0] || null;
}

async function eliminarArchivoGridFS(idArchivo) {
    if (!idArchivo || !mongoose.Types.ObjectId.isValid(idArchivo)) {
        return false;
    }

    try {
        await obtenerBucket().delete(new mongoose.Types.ObjectId(String(idArchivo)));
        return true;
    } catch (error) {
        if (error.code === "ENOENT" || /FileNotFound/i.test(error.message || "")) {
            return false;
        }
        throw error;
    }
}

async function eliminarVariosArchivosGridFS(idsArchivos) {
    return Promise.allSettled(
        [...new Set((idsArchivos || []).filter(Boolean).map(String))]
            .map((idArchivo) => eliminarArchivoGridFS(idArchivo))
    );
}

function obtenerIdsArchivos(documento) {
    if (!documento) {
        return [];
    }

    const ids = [];
    const adjuntos = Array.isArray(documento.archivos) ? documento.archivos : [];

    adjuntos.forEach((adjunto) => {
        const id = adjunto && (adjunto.archivoId || adjunto.archivo);
        if (id) ids.push(String(id));
    });

    const entrega = documento.archivoEntrega;
    const idEntrega = entrega && (entrega.archivoId || entrega.archivo);
    if (idEntrega) ids.push(String(idEntrega));

    return ids;
}

function manejarErrorMulter(error, request, response, next) {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
        const mensajes = {
            LIMIT_FILE_SIZE: "El archivo supera el límite de 25 MB.",
            LIMIT_FILE_COUNT: "Se superó la cantidad máxima de archivos permitida.",
            LIMIT_UNEXPECTED_FILE: "Se recibió un archivo o una extensión no permitida."
        };

        return response.status(400).json({
            success: false,
            message: mensajes[error.code] || "No fue posible procesar el archivo.",
            code: error.code
        });
    }

    return response.status(400).json({
        success: false,
        message: error.message || "No fue posible procesar el archivo."
    });
}

module.exports = {
    TAMANO_MAXIMO_ARCHIVO,
    MAXIMO_ARCHIVOS_TAREA,
    NOMBRE_BUCKET,
    subirMaterialesTarea,
    subirEntregaEstudiante,
    manejarErrorMulter,
    obtenerBucket,
    normalizarObjectId,
    normalizarNombreArchivo,
    guardarArchivoGridFS,
    guardarVariosArchivosGridFS,
    buscarArchivoGridFS,
    eliminarArchivoGridFS,
    eliminarVariosArchivosGridFS,
    obtenerIdsArchivos
};

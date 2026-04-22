// app.js - Configuración principal de la app Express
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- ESTA ES TU PÁGINA INICIAL ---
// Agregamos una ruta raíz para que cuando entres al navegador veas algo
app.get('/', (req, res) => {
    res.send({
        mensaje: "Bienvenido al Sistema del Centro Técnico Electrónico",
        estado: "Online",
        documentacion: "/api/auth para login"
    });
});

// CAMBIO CLAVE: Cambiamos module.exports por export default
export default app;
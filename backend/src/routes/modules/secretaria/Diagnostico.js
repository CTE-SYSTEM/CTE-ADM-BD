// backend/src/routes/modules/secretaria/Diagnostico.js
import express from 'express';
const router = express.Router();

// Importamos todas las funciones necesarias del controlador
// Asegúrate de que los nombres coincidan con lo que hay en DiagnosticoControllers.js
import { 
    createDiagnostico, 
    getDiagnosticos, // <--- ESTA FALTABA
    updateEstadoDiagnostico // <--- PARA CAMBIAR EL ESTADO DESPUÉS
} from '../../../controllers/Secretaria/DiagnosticoControllers.js';

// Rutas configuradas para /api/secretaria/diagnostico
// --------------------------------------------------

// POST /api/secretaria/diagnostico/create -> Para crear uno nuevo
router.post('/create', createDiagnostico);

// GET /api/secretaria/diagnostico -> Para listar todos (SOLUCIONA EL 404)
router.get('/', getDiagnosticos);

// PATCH /api/secretaria/diagnostico/:id/estado -> Para aprobar/rechazar
router.patch('/:id/estado', updateEstadoDiagnostico);

export default router;
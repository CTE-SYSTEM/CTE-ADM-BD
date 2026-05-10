// backend/src/routes/modules/secretaria/Diagnostico.js
import express from 'express';
const router = express.Router();

// Importamos todas las funciones necesarias del controlador
// Asegúrate de que los nombres coincidan con lo que hay en DiagnosticoControllers.js
import { 
    createDiagnostico, 
    getDiagnosticos, 
    updateDiagnostico,
    updateEstadoDiagnostico
} from '../../../controllers/Secretaria/DiagnosticoControllers.js';

// Rutas configuradas para /api/secretaria/diagnostico
// --------------------------------------------------

// POST /api/secretaria/diagnostico/create -> Para crear uno nuevo
router.post('/create', createDiagnostico);

// GET /api/secretaria/diagnostico -> Para listar todos (SOLUCIONA EL 404)
router.get('/', getDiagnosticos);

router.patch('/:id/estado', updateEstadoDiagnostico);

// PUT /api/secretaria/diagnostico/:id -> Para actualizar el diagnóstico completo
router.put('/:id', updateDiagnostico);

export default router;

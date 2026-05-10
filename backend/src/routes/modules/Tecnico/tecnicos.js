import { Router } from 'express';
import { getTecnicos, createTecnico, getMisDiagnosticos } from '../../../controllers/Tecnico/tecnicosController.js';

const router = Router();

router.get('/', getTecnicos);
router.get('/mis-diagnosticos/:username', getMisDiagnosticos);
router.post('/', createTecnico);

export default router;

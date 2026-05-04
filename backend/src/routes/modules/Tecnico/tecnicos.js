import { Router } from 'express';
import { getTecnicos, createTecnico } from '../../../controllers/Tecnico/tecnicosController.js';

const router = Router();

router.get('/', getTecnicos);
router.post('/', createTecnico);

export default router;
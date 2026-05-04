import { Router } from 'express';
import { getGarantias, createGarantia } from '../../../controllers/Secretaria/garantiasController.js';

const router = Router();

router.get('/', getGarantias);
router.post('/', createGarantia);

export default router;
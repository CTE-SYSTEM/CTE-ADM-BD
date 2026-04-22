// routes/garantias.js
import { Router } from 'express';
const router = Router();
import { getGarantias, createGarantia } from '../controllers/garantiasController.js';

router.get('/', getGarantias);
router.post('/', createGarantia);

export default router;
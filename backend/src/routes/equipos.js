// routes/equipos.js
import { Router } from 'express';
const router = Router();
// No olvides el .js al final del import
import { getEquipos, createEquipo } from '../controllers/equiposController.js';

router.get('/', getEquipos);
router.post('/', createEquipo);

export default router;
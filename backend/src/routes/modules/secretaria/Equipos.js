// routes/equipos.js
// backend/src/routes/modules/secretaria/Equipos.js
import { Router } from 'express';
const router = Router();
// No olvides el .js al final del import
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '../../../controllers/Secretaria/equiposController.js';

router.get('/', getEquipos);
router.post('/', createEquipo);
router.put('/:id', updateEquipo);
router.delete('/:id', deleteEquipo);

export default router;
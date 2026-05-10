import { Router } from 'express';
import {
  createTipoRepuesto,
  deleteTipoRepuesto,
  getTiposRepuesto,
  updateTipoRepuesto,
} from '../../../controllers/Secretaria/TipoRepuestoControllers.js';

const router = Router();

router.get('/', getTiposRepuesto);
router.post('/', createTipoRepuesto);
router.put('/:id', updateTipoRepuesto);
router.delete('/:id', deleteTipoRepuesto);

export default router;

// backend/src/routes/modules/secretaria/Repuesto.js
import { Router } from 'express';
import { 
  getRepuestos, 
  createRepuesto, 
  updateRepuesto, 
  deleteRepuesto 
} from '../../../controllers/Secretaria/RepuestoControllers.js';

const router = Router();

router.get('/', getRepuestos);
router.post('/', createRepuesto);
router.put('/:id', updateRepuesto);
router.delete('/:id', deleteRepuesto);

export default router;

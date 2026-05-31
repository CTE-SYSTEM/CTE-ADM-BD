// backend/src/routes/modules/secretaria/Repuesto.js
import { Router } from 'express';
import { 
  getRepuestos, 
  createRepuesto, 
  updateRepuesto, 
  deleteRepuesto 
} from '../../../controllers/Secretaria/RepuestoControllers.js';
import authMiddleware, { requireRole } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

const allowedRoles = requireRole('Secretaria', 'Tecnico', 'TecnicoJefe', 'Administrador', 'admin_pro');

router.get('/', allowedRoles, getRepuestos);
router.post('/', requireRole('Secretaria', 'Administrador', 'admin_pro'), createRepuesto);
router.put('/:id', requireRole('Secretaria', 'Administrador', 'admin_pro'), updateRepuesto);
router.delete('/:id', requireRole('Secretaria', 'Administrador', 'admin_pro'), deleteRepuesto);

export default router;

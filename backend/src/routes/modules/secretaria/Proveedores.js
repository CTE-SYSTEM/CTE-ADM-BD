// backend/src/routes/modules/secretaria/Proveedores.js
import { Router } from 'express';
import { 
  getProveedores, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor 
} from '../../../controllers/Secretaria/ProveedoresControllers.js';

const router = Router();

router.get('/', getProveedores);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

export default router;

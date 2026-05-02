// routes/proveedores.js
import { Router } from 'express';
const router = Router();

// El .js es vital para que Node no se pierda
import { getProveedores, createProveedor, updateProveedor, deleteProveedor } from '../controllers/proveedoresController.js';

router.get('/', getProveedores);
router.post('/', createProveedor);
router.put('/:id', updateProveedor);
router.delete('/:id', deleteProveedor);

export default router;

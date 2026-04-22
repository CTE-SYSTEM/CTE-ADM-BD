// routes/proveedores.js
import { Router } from 'express';
const router = Router();

// El .js es vital para que Node no se pierda
import { getProveedores, createProveedor } from '../controllers/proveedoresController.js';

router.get('/', getProveedores);
router.post('/', createProveedor);

export default router;
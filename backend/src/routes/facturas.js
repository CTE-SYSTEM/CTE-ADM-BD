// routes/facturas.js
import { Router } from 'express';
const router = Router();
// Agregamos el .js y usamos import
import { getFacturas, createFactura } from '../controllers/facturasController.js';

router.get('/', getFacturas);
router.post('/', createFactura);

export default router;
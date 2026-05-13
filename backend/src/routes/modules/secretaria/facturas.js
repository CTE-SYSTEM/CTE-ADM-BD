import { Router } from 'express';
import { getFacturas, createFactura, getOrdenesParaFacturar } from '../../../controllers/Secretaria/FacturacionControllers.js';

const router = Router();

router.get('/ordenes-disponibles', getOrdenesParaFacturar);
router.get('/', getFacturas);
router.post('/', createFactura);

export default router;

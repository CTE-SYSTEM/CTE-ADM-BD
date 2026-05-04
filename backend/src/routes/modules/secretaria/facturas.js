import { Router } from 'express';
import { getFacturas, createFactura } from '../../../controllers/Secretaria/FacturacionControllers.js';

const router = Router();

router.get('/', getFacturas);
router.post('/', createFactura);

export default router;

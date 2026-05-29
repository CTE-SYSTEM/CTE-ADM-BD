import { Router } from 'express';
import { getFacturas, createFactura, getOrdenesParaFacturar } from '../../../controllers/Secretaria/FacturacionControllers.js';
import authMiddleware, { requirePermission } from '../../../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../../../utils/permissions.js';

const router = Router();

router.use(authMiddleware, requirePermission(PERMISSIONS.FACTURAS_GESTIONAR));

router.get('/ordenes-disponibles', getOrdenesParaFacturar);
router.get('/', getFacturas);
router.post('/', createFactura);

export default router;

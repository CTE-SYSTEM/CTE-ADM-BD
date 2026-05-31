import { Router } from 'express';
import { getCompras, createCompra } from '../../../controllers/Secretaria/ComprasControllers.js';
import authMiddleware, { requirePermission } from '../../../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../../../utils/permissions.js';

const router = Router();

router.use(authMiddleware, requirePermission(PERMISSIONS.COMPRAS_GESTIONAR));

router.get('/', getCompras);
router.post('/', createCompra);

export default router;

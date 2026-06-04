import { Router } from 'express';
import { getCompras, createCompra, updateCompra } from '../../../controllers/Secretaria/ComprasControllers.js';
import authMiddleware, { requirePermission } from '../../../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../../../utils/permissions.js';

const router = Router();

router.use(authMiddleware, requirePermission(PERMISSIONS.COMPRAS_GESTIONAR));

router.get('/', getCompras);
router.post('/', createCompra);
router.put('/:id', updateCompra);

export default router;

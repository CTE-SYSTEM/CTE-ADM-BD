import { Router } from 'express';
import { getGarantias, createGarantia } from '../../../controllers/Secretaria/garantiasController.js';
import authMiddleware, { requirePermission } from '../../../middlewares/authMiddleware.js';
import { PERMISSIONS } from '../../../utils/permissions.js';

const router = Router();

router.use(authMiddleware, requirePermission(PERMISSIONS.GARANTIAS_GESTIONAR));

router.get('/', getGarantias);
router.post('/', createGarantia);

export default router;

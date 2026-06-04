import { Router } from 'express';
import { getDashboardStats } from '../../../controllers/Secretaria/SecretariaControllers.js';
import authMiddleware, { requireRole } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, requireRole('Secretaria', 'Administrador', 'admin_pro'));

router.get('/', getDashboardStats);

export default router;

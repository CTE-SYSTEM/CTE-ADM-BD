import { Router } from 'express';
import {
  actualizarDiagnosticoAsignado,
  actualizarEstadoOrden,
  createTecnico,
  getMisDiagnosticos,
  getMisOrdenes,
  getTecnicos,
  solicitarRepuesto,
} from '../../../controllers/Tecnico/tecnicosController.js';
import authMiddleware, { requireRole } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('Secretaria', 'TecnicoJefe', 'Administrador', 'admin_pro'), getTecnicos);
router.get('/mis-diagnosticos/:username', requireRole('Tecnico'), getMisDiagnosticos);
router.get('/mis-ordenes/:username', requireRole('Tecnico'), getMisOrdenes);
router.put('/diagnosticos/:id', requireRole('Tecnico'), actualizarDiagnosticoAsignado);
router.patch('/ordenes/:id/estado', requireRole('Tecnico'), actualizarEstadoOrden);
router.post('/ordenes/:id/repuestos', requireRole('Tecnico'), solicitarRepuesto);
router.post('/', requireRole('Secretaria', 'Administrador', 'admin_pro'), createTecnico);

export default router;

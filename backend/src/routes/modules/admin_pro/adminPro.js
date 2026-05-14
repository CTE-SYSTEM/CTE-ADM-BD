import { Router } from 'express';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import {
  onlyAdminPro,
  getEquiposAvanzado,
  getRepuestosAvanzado,
  getOrdenesAvanzado,
  getFacturasAvanzado,
  getGarantiasAdmin,
  createGarantiaAdmin,
  updateGarantiaAdmin,
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getMonitoreoGeneral,
  getHistorialEquipo,
  getHistorialRepuesto,
  getReporteAdminPro
} from '../../../controllers/admin_pro/adminProController.js';

const router = Router();

router.use(authMiddleware);
router.use(onlyAdminPro);

router.get('/equipos', getEquiposAvanzado);
router.get('/equipos/:id/historial', getHistorialEquipo);
router.get('/repuestos', getRepuestosAvanzado);
router.get('/repuestos/:id/historial', getHistorialRepuesto);
router.get('/ordenes', getOrdenesAvanzado);
router.get('/facturas', getFacturasAvanzado);
router.get('/garantias', getGarantiasAdmin);
router.post('/garantias', createGarantiaAdmin);
router.put('/garantias/:id', updateGarantiaAdmin);

router.get('/usuarios', getUsuarios);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.delete('/usuarios/:id', deleteUsuario);

router.get('/monitoreo', getMonitoreoGeneral);
router.get('/reportes/:tipo', getReporteAdminPro);

export default router;

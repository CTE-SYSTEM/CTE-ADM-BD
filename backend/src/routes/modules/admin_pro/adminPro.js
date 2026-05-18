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
  renewGarantiaAdmin,
  getUsuarios,
  createUsuario,
  updateUsuario,
  updateUsuarioPassword,
  deleteUsuario,
  getMonitoreoGeneral,
  getDashboardResumen,
  updateOrdenAdmin,
  updateRepuestoAdmin,
  getRepuestosPorOrdenAdmin,
  downloadRepuestosPorOrdenAdmin,
  getEquipoUltimoDiagnostico,
  updateDiagnosticoEstadoAdmin,
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
router.get('/ordenes/:id/repuestos', getRepuestosPorOrdenAdmin);
router.get('/ordenes/:id/repuestos/reporte', downloadRepuestosPorOrdenAdmin);
router.post('/ordenes/crear', async (req, res, next) => {
  try {
    const { createOrden } = await import('../../../controllers/Secretaria/NuevaOrdenControllers.js');
    return createOrden(req, res);
  } catch (error) {
    next(error);
  }
});
router.get('/equipos/:id/diagnostico', getEquipoUltimoDiagnostico);
router.patch('/diagnosticos/:id/estado', updateDiagnosticoEstadoAdmin);
router.get('/facturas', getFacturasAvanzado);
router.get('/garantias', getGarantiasAdmin);
router.post('/garantias', createGarantiaAdmin);
router.put('/garantias/:id', updateGarantiaAdmin);
router.post('/garantias/:id/renovar', renewGarantiaAdmin);

router.get('/usuarios', getUsuarios);
router.post('/usuarios', createUsuario);
router.put('/usuarios/:id', updateUsuario);
router.put('/usuarios/:id/password', updateUsuarioPassword);
router.delete('/usuarios/:id', deleteUsuario);

router.get('/dashboard', getDashboardResumen);
router.put('/ordenes/:id', updateOrdenAdmin);
router.put('/repuestos/:id', updateRepuestoAdmin);
router.get('/monitoreo', getMonitoreoGeneral);
router.get('/reportes/:tipo', getReporteAdminPro);

export default router;

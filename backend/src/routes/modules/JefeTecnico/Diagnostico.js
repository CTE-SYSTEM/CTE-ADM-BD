import { Router } from 'express';
import { 
  getDiagnosticosPendientes, 
  getTodosDiagnosticos,
  getDiagnosticoById,
  asignarTecnicoADiagnostico,
  getRepuestos,
  getTecnicos,
  getOrdenById,
  getOrdenesPendientes,
  asignarTecnicoAOrden,
  getOrdenesAprobadas,
  getRepuestosPendientesAprobacion,
  aprobarSolicitudRepuesto,
  rechazarSolicitudRepuesto
} from '../../../controllers/JefeTecnico/DiagnosticoController.js';
import authMiddleware, { requireRole } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, requireRole('TecnicoJefe', 'Administrador', 'admin_pro'));

router.get('/todos', getTodosDiagnosticos);
router.get('/pendientes-asignar', getDiagnosticosPendientes);
router.get('/ordenes/aprobadas', getOrdenesAprobadas);
router.get('/ordenes', getOrdenesPendientes);
router.patch('/orden/:id/asignar', asignarTecnicoAOrden);
router.patch('/:id/asignar', asignarTecnicoADiagnostico);
router.get('/ordenes/:id', getOrdenById);
router.get('/repuestos/pendientes-aprobacion', getRepuestosPendientesAprobacion);
router.patch('/repuestos/:id/aprobar', aprobarSolicitudRepuesto);
router.patch('/repuestos/:id/rechazar', rechazarSolicitudRepuesto);
router.get('/repuestos', getRepuestos);
router.get('/tecnicos', getTecnicos);
router.get('/:id', getDiagnosticoById);

export default router;

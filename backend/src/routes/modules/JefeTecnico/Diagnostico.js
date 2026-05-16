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
  rechazarSolicitudRepuesto,
  getCorreccionesJefeTecnico,
  corregirDiagnosticoJefeTecnico,
  corregirOrdenJefeTecnico,
  corregirRepuestoJefeTecnico
} from '../../../controllers/JefeTecnico/DiagnosticoController.js';
import authMiddleware, { requireRole } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware, requireRole('TecnicoJefe', 'Administrador', 'admin_pro'));

router.get('/correcciones', getCorreccionesJefeTecnico);
router.patch('/correcciones/diagnosticos/:id', corregirDiagnosticoJefeTecnico);
router.patch('/correcciones/ordenes/:id', corregirOrdenJefeTecnico);
router.patch('/correcciones/repuestos/:id', corregirRepuestoJefeTecnico);
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

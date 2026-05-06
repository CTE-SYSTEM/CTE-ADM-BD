import { Router } from 'express';
import { 
  getDiagnosticosPendientes, 
  asignarTecnicoADiagnostico,
  getTodos,
  getOrdenes,
  getRepuestos,
  getTecnicos,
  asignarTecnicoAOrden,
  getDiagnosticoById,
  getOrdenById,
  updateOrden
} from '../../../controllers/JefeTecnico/DiagnosticoController.js';

const router = Router();

router.get('/pendientes-asignar', getDiagnosticosPendientes);
router.patch('/:id/asignar', asignarTecnicoADiagnostico);
router.patch('/orden/:id/asignar', asignarTecnicoAOrden);

// Nuevas rutas para el dashboard
router.get('/todos', getTodos);
router.get('/ordenes', getOrdenes);
router.get('/ordenes/:id', getOrdenById);
router.put('/ordenes/:id', updateOrden);
router.get('/repuestos', getRepuestos);
router.get('/tecnicos', getTecnicos);
router.get('/:id', getDiagnosticoById);

export default router;

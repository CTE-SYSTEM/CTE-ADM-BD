import { Router } from 'express';
import { 
  getDiagnosticosPendientes, 
  asignarTecnicoADiagnostico,
  getRepuestos,
  getTecnicos,
  getOrdenById
} from '../../../controllers/JefeTecnico/DiagnosticoController.js';

const router = Router();

router.get('/pendientes-asignar', getDiagnosticosPendientes);
router.patch('/:id/asignar', asignarTecnicoADiagnostico);
router.get('/ordenes/:id', getOrdenById);
router.get('/repuestos', getRepuestos);
router.get('/tecnicos', getTecnicos);

export default router;

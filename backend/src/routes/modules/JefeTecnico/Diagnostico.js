import { Router } from 'express';
import { 
  getDiagnosticosPendientes, 
  asignarTecnicoADiagnostico 
} from '../../../controllers/JefeTecnico/DiagnosticoController.js';

const router = Router();

router.get('/pendientes-asignar', getDiagnosticosPendientes);
router.patch('/:id/asignar', asignarTecnicoADiagnostico);

export default router;
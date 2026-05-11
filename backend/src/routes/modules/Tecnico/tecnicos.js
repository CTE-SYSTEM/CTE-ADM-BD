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

const router = Router();

router.get('/', getTecnicos);
router.get('/mis-diagnosticos/:username', getMisDiagnosticos);
router.get('/mis-ordenes/:username', getMisOrdenes);
router.put('/diagnosticos/:id', actualizarDiagnosticoAsignado);
router.patch('/ordenes/:id/estado', actualizarEstadoOrden);
router.post('/ordenes/:id/repuestos', solicitarRepuesto);
router.post('/', createTecnico);

export default router;

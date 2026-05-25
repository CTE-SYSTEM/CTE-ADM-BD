// backend/src/routes/modules/secretaria/NuevaOrden.js
import express from 'express';
const router = express.Router();
import {
  createOrden,
  deleteOrden,
  getDiagnosticosListosParaOrden,
  getOrdenes,
  updateOrden,
} from '../../../controllers/Secretaria/NuevaOrdenControllers.js';

router.get('/diagnosticos-listos', getDiagnosticosListosParaOrden);
router.get('/', getOrdenes);
router.post('/', createOrden);
router.post('/create', createOrden);
router.put('/:id', updateOrden);
router.delete('/:id', deleteOrden);

export default router;

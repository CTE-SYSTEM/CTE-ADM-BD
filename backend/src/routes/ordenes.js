// src/routes/ordenes.js
import { Router } from 'express';
const router = Router();

// IMPORTANTE: El .js al final es obligatorio en este modo
import { getOrdenes, createOrden, updateOrden, deleteOrden } from '../controllers/ordenesController.js';

router.get('/', getOrdenes);
router.post('/', createOrden);
router.put('/:id', updateOrden);
router.delete('/:id', deleteOrden);

export default router;

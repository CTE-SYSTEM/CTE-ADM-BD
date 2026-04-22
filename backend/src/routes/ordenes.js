// src/routes/ordenes.js
import { Router } from 'express';
const router = Router();

// IMPORTANTE: El .js al final es obligatorio en este modo
import { getOrdenes, createOrden } from '../controllers/ordenesController.js';

router.get('/', getOrdenes);
router.post('/', createOrden);

export default router;
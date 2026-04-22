// routes/clientes.js
import { Router } from 'express';
const router = Router();

// IMPORTANTE: Recuerda el .js al final siempre
import { getClientes, createCliente } from '../controllers/clientesController.js';

router.get('/', getClientes);
router.post('/', createCliente);

export default router;
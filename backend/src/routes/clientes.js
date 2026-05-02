// routes/clientes.js
import { Router } from 'express';
const router = Router();

// IMPORTANTE: Recuerda el .js al final siempre
import { getClientes, createCliente, updateCliente, deleteCliente } from '../controllers/clientesController.js';

router.get('/', getClientes);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;

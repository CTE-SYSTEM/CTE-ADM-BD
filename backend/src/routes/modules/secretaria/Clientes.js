// backend/src/routes/modules/secretaria/Clientes.js
import express from 'express';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../../../controllers/Secretaria/ClientesControllers.js';

const router = express.Router();

// Prefijo ya definido en index.js como /api/secretaria/clientes
router.get('/', getClientes);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;
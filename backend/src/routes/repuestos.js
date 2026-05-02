// routes/repuestos.js
import { Router } from 'express';
const router = Router();
// No olvides el .js, es el requisito del modo "type: module"
import { getRepuestos, createRepuesto, updateRepuesto, deleteRepuesto } from '../controllers/repuestosController.js';

router.get('/', getRepuestos);
router.post('/', createRepuesto);
router.put('/:id', updateRepuesto);
router.delete('/:id', deleteRepuesto);

export default router;

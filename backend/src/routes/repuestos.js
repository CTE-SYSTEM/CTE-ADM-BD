// routes/repuestos.js
import { Router } from 'express';
const router = Router();
// No olvides el .js, es el requisito del modo "type: module"
import { getRepuestos, createRepuesto } from '../controllers/repuestosController.js';

router.get('/', getRepuestos);
router.post('/', createRepuesto);

export default router;
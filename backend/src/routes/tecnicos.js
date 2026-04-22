// routes/tecnicos.js
import { Router } from 'express';
const router = Router();
// Agregamos el .js que es obligatorio en modo "type: module"
import { getTecnicos, createTecnico } from '../controllers/tecnicosController.js';

router.get('/', getTecnicos);
router.post('/', createTecnico);

export default router;
// RUTA: backend/src/routes/modules/auth/auth.js
import { Router } from 'express';
const router = Router();

// IMPORTANTE: En ES Modules, siempre debes poner la extensión .js al importar tus archivos
import { register, login } from '../../../controllers/authController.js';

// Rutas
router.post('/register', register);
router.post('/login', login);

// CAMBIO CLAVE: Exportación moderna
export default router;
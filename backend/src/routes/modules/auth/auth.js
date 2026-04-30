// backend/src/routes/modules/auth/auth.js
import express from 'express';
import { login } from '../../../controllers/authController.js';

const router = express.Router();

// La ruta solo llama a la función del controlador
router.post('/login', login);

export default router;
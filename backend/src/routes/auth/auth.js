// backend/src/routes/auth/auth.js
import express from 'express';
import { login } from '../../controllers/auth/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

export default router;
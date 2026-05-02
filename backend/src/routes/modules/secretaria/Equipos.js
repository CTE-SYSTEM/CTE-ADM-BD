import express from 'express';
import { getEquipos, createEquipo } from '../controllers/equiposController.js';

const router = express.Router();

router.get('/', getEquipos);
router.post('/', createEquipo);

export default router;
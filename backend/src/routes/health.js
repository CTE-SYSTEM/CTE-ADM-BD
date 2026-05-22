import { Router } from 'express';
import { getHealth } from '../services/healthService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await getHealth());
  } catch (error) {
    next(error);
  }
});

export default router;

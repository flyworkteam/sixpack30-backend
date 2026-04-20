import { Router } from 'express';
import { getExercises } from '../controllers/content.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/exercises', getExercises);

export default router;

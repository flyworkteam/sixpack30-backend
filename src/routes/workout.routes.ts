import { Router } from 'express';
import { getWorkouts, getWorkoutDetail } from '../controllers/workout.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Antrenman rotaları da giriş zorunlu kılınabilir
router.use(verifyToken);

router.get('/', getWorkouts);
router.get('/:id', getWorkoutDetail);

export default router;

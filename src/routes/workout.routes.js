import { Router } from 'express';
import { getWorkouts, getWorkoutDetail } from '../controllers/workout.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', getWorkouts);
router.get('/:id', getWorkoutDetail);

export default router;

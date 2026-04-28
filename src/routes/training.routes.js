import { Router } from 'express';
import { saveProgress, completeDay } from '../controllers/training.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/progress', saveProgress);
router.post('/complete-day', completeDay);

export default router;

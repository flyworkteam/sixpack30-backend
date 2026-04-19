import { Router } from 'express';
import { saveProgress, completeDay } from '../controllers/training.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// İlerleme kaydetmek için de token şart
router.use(verifyToken);

router.post('/progress', saveProgress);
router.post('/complete-day', completeDay);

export default router;

import { Router } from 'express';
import { getExercises } from '../controllers/content.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Egzersiz listeleme auth katmanından geçebilir (veya herkes görebilir ama biz güvenli tutalım)
router.use(verifyToken);

router.get('/exercises', getExercises);

export default router;

import { Router } from 'express';
import { syncUserAuth, getProfile, updateProfile, getUserStats, updateWaterIntake, syncHealthData } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/auth', syncUserAuth);
router.get('/profile', getProfile);
router.get('/stats', getUserStats);
router.put('/stats/water', updateWaterIntake);
router.put('/profile', updateProfile);
router.post('/sync-health', syncHealthData);

export default router;

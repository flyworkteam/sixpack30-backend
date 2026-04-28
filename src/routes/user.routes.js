import { Router } from 'express';
import { syncUserAuth, getProfile, updateProfile, getUserStats, updateWaterIntake, syncHealthData, deleteProfile, updatePremiumStatus } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/auth', syncUserAuth);
router.get('/profile', getProfile);
router.get('/stats', getUserStats);
router.put('/stats/water', updateWaterIntake);
router.put('/profile', updateProfile);
router.delete('/profile', deleteProfile);
router.post('/sync-health', syncHealthData);
router.post('/premium', updatePremiumStatus);

export default router;

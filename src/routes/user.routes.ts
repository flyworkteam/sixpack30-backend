import { Router } from 'express';
import { syncUserAuth, getProfile, updateProfile, getUserStats, updateWaterIntake, syncHealthData } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Tüm rotaları yetki koruması (VerifyToken) altına alıyoruz.
// Kullanıcının mutlaka geçerli bir Firebase Token ile gelmesi gerekiyor.
router.use(verifyToken);

router.post('/auth', syncUserAuth);
router.get('/profile', getProfile);
router.get('/stats', getUserStats);
router.put('/stats/water', updateWaterIntake);
router.put('/profile', updateProfile);
router.post('/sync-health', syncHealthData);

export default router;

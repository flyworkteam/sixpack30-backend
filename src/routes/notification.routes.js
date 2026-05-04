import { Router } from 'express';
import { getNotifications, markAsRead, deleteAllNotifications } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/', deleteAllNotifications);

export default router;

import { Router } from 'express';
import { handleRevenueCatWebhook } from '../controllers/webhook.controller.js';

const router = Router();


router.post('/revenuecat', handleRevenueCatWebhook);

export default router;

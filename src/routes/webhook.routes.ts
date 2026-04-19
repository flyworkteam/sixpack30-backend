import { Router } from 'express';
import { handleRevenueCatWebhook } from '../controllers/webhook.controller';

const router = Router();

/**
 * RevenueCat Webhook Endpoint
 *
 * ÖNEMLİ: Bu route'da Firebase auth middleware'i KULLANILMAZ.
 * Güvenlik, RevenueCat'in gönderdiği "Authorization" header'ı ile sağlanır.
 * Route: POST /api/webhooks/revenuecat
 */
router.post('/revenuecat', handleRevenueCatWebhook);

export default router;

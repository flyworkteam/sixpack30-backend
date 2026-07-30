import prisma from '../config/database.js';
import { createNotification, NOTIFICATION_KEYS } from '../services/notification.service.js';

const PREMIUM_STARTED_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
]);

// CANCELLATION yalnızca otomatik yenilemenin kapatıldığı anlamına gelir.
// Kullanıcının erişimi EXPIRATION olayına kadar devam eder.
const NO_STATUS_CHANGE_EVENTS = new Set([
  'CANCELLATION',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
  'SUBSCRIBER_ALIAS',
  'TRANSFER',
]);

const isAuthorized = (authorization) => {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN;
  if (!expected || !authorization) return false;
  return authorization === expected || authorization === `Bearer ${expected}`;
};

/**
 * RevenueCat Webhook Handler
 * @route POST /api/webhooks/revenuecat
 */
export const handleRevenueCatWebhook = async (req, res) => {
  if (!process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN) {
    console.error('[RevenueCat] REVENUECAT_WEBHOOK_AUTH_TOKEN tanımlı değil.');
    return res.status(503).json({ error: 'Webhook yapılandırılmamış.' });
  }

  if (!isAuthorized(req.headers.authorization)) {
    return res.status(401).json({ error: 'Yetkisiz webhook isteği.' });
  }

  const { event } = req.body ?? {};
  if (!event?.type || !event?.app_user_id) {
    return res.status(400).json({ error: 'Geçersiz webhook verisi.' });
  }

  const { type, app_user_id } = event;

  try {
    if (NO_STATUS_CHANGE_EVENTS.has(type)) {
      console.log(`[RevenueCat] ${type}: premium durumu değişmedi (${app_user_id}).`);
      return res.status(200).json({ message: 'Olay işlendi; premium durumu değişmedi.' });
    }

    let isPremium;
    if (PREMIUM_STARTED_EVENTS.has(type)) {
      isPremium = true;
    } else if (type === 'EXPIRATION') {
      isPremium = false;
    } else {
      console.log(`[RevenueCat] Desteklenmeyen olay yok sayıldı: ${type}`);
      return res.status(200).json({ message: 'Olay alındı; işlem gerektirmiyor.' });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: app_user_id },
    });

    if (!user) {
      console.warn(`[RevenueCat] Kullanıcı bulunamadı: ${app_user_id}`);
      return res.status(200).json({ message: 'Kullanıcı sistemde yok ama bildirim alındı.' });
    }

    // RevenueCat aynı webhook'u tekrar gönderebilir. Durum zaten aynıysa
    // bildirim üretmeden 200 dönerek işlemi idempotent tut.
    if (user.isPremium === isPremium) {
      console.log(`[RevenueCat] ${type}: durum zaten güncel (${app_user_id}).`);
      return res.status(200).json({ message: 'Premium durumu zaten güncel.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isPremium },
    });

    if (isPremium) {
      await createNotification(user.id, NOTIFICATION_KEYS.PREMIUM_ACTIVE, 'success');
    } else {
      await createNotification(user.id, NOTIFICATION_KEYS.SUBSCRIPTION_ENDED, 'alert');
    }

    console.log(`[RevenueCat] ${app_user_id}: premium=${isPremium} (${type}).`);
    return res.status(200).json({
      message: 'Kullanıcı premium durumu güncellendi.',
      isPremium,
    });
  } catch (error) {
    console.error('[RevenueCat Webhook Hatası]:', error);
    return res.status(500).json({ error: 'Webhook işlenirken hata oluştu.' });
  }
};

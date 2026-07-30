import prisma from '../config/database.js';

/**
 * Uygulama içi bildirim kayıtları.
 *
 * Metinler istemcide üretilir: `key` alanı çeviri anahtarını taşır, title/body
 * yalnızca anahtarı tanımayan eski istemciler için yedek olarak saklanır.
 * Push gönderimi cihaz tarafında flutter_local_notifications ile yapılır.
 */
export const NOTIFICATION_KEYS = {
  READY: 'ready',
  PREMIUM_ACTIVE: 'premium_active',
  SUBSCRIPTION_ENDED: 'subscription_ended',
  REMINDER: 'reminder',
};

/** Anahtarı tanımayan istemciler için Türkçe yedek metinler. */
const FALLBACK_TEXT = {
  [NOTIFICATION_KEYS.READY]: {
    title: 'Artık Hazırsın! 🚀',
    body: 'Bilgilerin başarıyla alındı. 30 günlük karın kası yolculuğuna başlamaya hazırsın!',
  },
  [NOTIFICATION_KEYS.PREMIUM_ACTIVE]: {
    title: 'Premium Üyelik Aktif! 💎',
    body: 'SixPack30 Premium dünyasına hoş geldin! Tüm antrenmanlar artık parmaklarının ucunda.',
  },
  [NOTIFICATION_KEYS.SUBSCRIPTION_ENDED]: {
    title: 'Abonelik Sona Erdi',
    body: 'Premium üyeliğin sona erdi. Hedeflerinden uzaklaşmamak için tekrar abone olabilirsin.',
  },
  [NOTIFICATION_KEYS.REMINDER]: {
    title: 'Antrenman Zamanı! 💪',
    body: 'Bugünkü 10 dakikalık antrenmanın seni bekliyor.',
  },
};

export const createNotification = async (userId, key, type = 'info') => {
  const fallback = FALLBACK_TEXT[key];

  if (!fallback) {
    throw new Error(`[NotificationService] Bilinmeyen bildirim anahtarı: ${key}`);
  }

  try {
    return await prisma.notification.create({
      data: {
        userId,
        key,
        title: fallback.title,
        body: fallback.body,
        type,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('[NotificationService] Hata:', error);
    throw error;
  }
};

import prisma from '../config/database.js';
import { createNotification } from '../services/notification.service.js';

/**
 * RevenueCat Webhook Handler
 * @route POST /api/webhooks/revenuecat
 */
export const handleRevenueCatWebhook = async (req, res) => {
  const { event } = req.body;

  const authToken = req.headers['authorization'];
  if (authToken !== process.env.REVENUECAT_WEBHOOK_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Yetkisiz webhook isteği.' });
  }

  if (!event) {
    return res.status(400).json({ error: 'Geçersiz webhook verisi.' });
  }

  const { type, app_user_id } = event;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: app_user_id },
    });

    if (!user) {
      console.warn(`[RevenueCat] Kullanıcı bulunamadı: ${app_user_id}`);
      return res.status(200).json({ message: 'Kullanıcı sistemde yok ama bildirim alındı.' });
    }

    let isPremium = false;

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        isPremium = true;
        console.log(`[RevenueCat] Premium Aktif: ${app_user_id}`);
        break;
      
      case 'EXPIRATION':
      case 'CANCELLATION':
      case 'BILLING_ERROR':
        isPremium = false;
        console.log(`[RevenueCat] Premium Sona Erdi: ${app_user_id}`);
        break;

      default:
        return res.status(200).json({ message: 'Olay işlendi (durum değişmedi).' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isPremium },
    });

    if (isPremium) {
      await createNotification(
        user.id,
        'Premium Üyelik Aktif! 💎',
        'SixPack30 Premium dünyasına hoş geldin! Tüm antrenmanlar artık parmaklarının ucunda.',
        'success'
      );
    } else if (type === 'EXPIRATION' || type === 'CANCELLATION') {
      await createNotification(
        user.id,
        'Abonelik Sona Erdi',
        'Premium üyeliğin sona erdi. Hedeflerinden uzaklaşmamak için tekrar abone olabilirsin.',
        'alert'
      );
    }

    res.status(200).json({ message: 'Kullanıcı premium durumu güncellendi.' });
  } catch (error) {
    console.error('[RevenueCat Webhook Hatası]:', error);
    res.status(500).json({ error: 'Webhook işlenirken hata oluştu.' });
  }
};

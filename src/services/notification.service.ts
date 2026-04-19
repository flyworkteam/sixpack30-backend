import prisma from '../config/database';
import { sendToUser } from './onesignal.service';

/**
 * Merkezi Bildirim Servisi
 * Hem veritabanına (MySQL) kaydeder hem de OneSignal üzerinden Push gönderir.
 */
export const createNotification = async (
  userId: number,
  title: string,
  body: string,
  type: string = 'info'
) => {
  try {
    // 1. Veritabanına kaydet (Kullanıcının bildirim listesinde görünmesi için)
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        isRead: false,
      },
    });

    // 2. OneSignal üzerinden Push gönder
    // Kullanıcının firebaseUid bilgisini almamız gerekiyor (OneSignal External ID eşleşmesi için)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firebaseUid: true }
    });

    if (user && user.firebaseUid) {
      await sendToUser(user.firebaseUid, title, body);
    }

    return notification;
  } catch (error) {
    console.error('[NotificationService] Hata:', error);
    throw error;
  }
};

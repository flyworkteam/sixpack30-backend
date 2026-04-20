import prisma from '../config/database.js';
import { sendToUser } from './onesignal.service.js';

/**
 */
export const createNotification = async (
  userId,
  title,
  body,
  type = 'info'
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        isRead: false,
      },
    });

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

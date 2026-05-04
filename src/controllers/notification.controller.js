import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Kullanıcının bildirimlerini listeleme
 * @route GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Bildirimler getirilemedi' });
  }
};

/**
 * Bildirimi okundu olarak işaretleme
 * @route PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const id = parseInt(req.params.id);
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json(updatedNotification);
  } catch (error) {
    res.status(500).json({ error: 'Bildirim güncellenemedi' });
  }
};

/**
 * Tüm bildirimleri silme
 * @route DELETE /api/notifications
 */
export const deleteAllNotifications = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    await prisma.notification.deleteMany({
      where: { userId: user.id }
    });

    res.status(200).json({ message: 'Tüm bildirimler silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Bildirimler silinemedi' });
  }
};

import type { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Kullanıcının tamamladığı antrenmanı ve yaktığı kaloriyi sisteme işler.
 * @route POST /api/training/progress
 */
export const saveProgress = async (req: Request, res: Response) => {
  // req.user kesinlikle var (middleware sayesinde)
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });
  
  const { exerciseId, duration, calories } = req.body;

  if (!exerciseId || typeof duration !== 'number') {
    return res.status(400).json({ error: 'Eksik veya hatalı parametre: exerciseId ve duration zorunludur.' });
  }

  try {
    // Önce Kullanıcının MySQL'deki ID'sini bulalım
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'Karanlık sistem hatası: Kullanıcı backendde eşlenmemiş.' });
    }

    // Egzersizin de geçerli olup olmadığını kontrol edelim
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Tamamlanan egzersiz veritabanında bulunamadı.' });
    }

    // Progress (İlerleme) kaydını oluşturuyoruz
    const newProgress = await prisma.progress.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        duration: duration,
        calories: calories || null,
      },
    });

    res.status(201).json({
      message: 'Antrenman başarıyla kaydedildi.',
      progress: newProgress,
    });
  } catch (error) {
    console.error('Progress kaydetme hatası:', error);
    res.status(500).json({ error: 'Antrenman bilgileri kaydedilirken sunucu hatası oluştu.' });
  }
};

/**
 * Kullanıcının belirli bir program gününü (1-30) tamamladığını kaydeder.
 * @route POST /api/training/complete-day
 */
export const completeDay = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });
  
  const { dayNumber } = req.body;

  if (typeof dayNumber !== 'number') {
    return res.status(400).json({ error: 'dayNumber zorunludur ve sayı olmalıdır.' });
  }

  try {
    // Prisma nesnesinin ve modelin varlığını kontrol et (Debug için)
    if (!prisma || !prisma.user) {
      console.error('CRITICAL: Prisma client or User model is undefined!');
      return res.status(500).json({ 
        error: 'Veritabanı bağlantı hatası.',
        details: 'Prisma Client correctly initialized but models are missing. Try regenerating prisma client.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Zaten tamamlanmış mı kontrol et (Opsiyonel: tekrar kaydetmek hata vermesin)
    const existing = await prisma.completedDay.findUnique({
      where: {
        userId_dayNumber: {
          userId: user.id,
          dayNumber: dayNumber,
        },
      },
    });

    if (existing) {
      return res.status(200).json({ message: 'Bu gün zaten tamamlanmış.', alreadyCompleted: true });
    }

    const completedDay = await prisma.completedDay.create({
      data: {
        userId: user.id,
        dayNumber: dayNumber,
      },
    });

    res.status(201).json({
      message: 'Gün başarıyla tamamlandı.',
      completedDay,
    });
  } catch (error: any) {
    console.error('completeDay hatası:', error);
    res.status(500).json({ 
      error: 'Gün kaydedilirken sunucu hatası oluştu.',
      details: error.message || error.toString()
    });
  }
};

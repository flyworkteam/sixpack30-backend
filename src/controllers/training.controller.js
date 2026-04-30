import prisma from '../config/database.js';

/**
 * @route POST /api/training/progress
 */
export const saveProgress = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });
  
  const { exerciseId, duration, calories } = req.body;

  if (!exerciseId || typeof duration !== 'number') {
    return res.status(400).json({ error: 'Eksik veya hatalı parametre: exerciseId ve duration zorunludur.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
    });

    if (!user) {
      return res.status(404).json({ error: 'Karanlık sistem hatası: Kullanıcı backendde eşlenmemiş.' });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Tamamlanan egzersiz veritabanında bulunamadı.' });
    }

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
 * @route POST /api/training/complete-day
 */
export const completeDay = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });
  
  const { dayNumber, duration, calories } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    // Günün daha önce tamamlanıp tamamlanmadığını kontrol edelim
    const existingCompletedDay = await prisma.completedDay.findUnique({
      where: {
        userId_dayNumber: {
          userId: user.id,
          dayNumber: parseInt(dayNumber),
        },
      },
    });

    const completedDay = await prisma.completedDay.upsert({
      where: {
        userId_dayNumber: {
          userId: user.id,
          dayNumber: parseInt(dayNumber),
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        dayNumber: parseInt(dayNumber),
      },
    });

    // Eğer gün yeni tamamlanıyorsa veya daha önce Progress kaydı girilmediyse 
    // (İstatistiklerin doğru hesaplanması için bir Progress kaydı oluşturalım)
    if (!existingCompletedDay && duration && calories) {
      await prisma.progress.create({
        data: {
          userId: user.id,
          exerciseId: 1, // Varsayılan "Genel Antrenman" ID'si
          duration: parseInt(duration),
          calories: parseFloat(calories),
        },
      });
    }

    res.status(200).json({
      message: 'Gün başarıyla tamamlandı.',
      completedDay,
    });
  } catch (error) {
    console.error('completeDay hatası:', error);
    res.status(500).json({ 
      error: 'Gün kaydedilirken sunucu hatası oluştu.',
      details: error.message || error.toString()
    });
  }
};

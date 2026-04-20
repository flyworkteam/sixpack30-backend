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
  
  const { dayNumber } = req.body;

  if (typeof dayNumber !== 'number') {
    return res.status(400).json({ error: 'dayNumber zorunludur ve sayı olmalıdır.' });
  }

  try {
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
  } catch (error) {
    console.error('completeDay hatası:', error);
    res.status(500).json({ 
      error: 'Gün kaydedilirken sunucu hatası oluştu.',
      details: error.message || error.toString()
    });
  }
};

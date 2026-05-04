import prisma from '../config/database.js';
import { createNotification } from '../services/notification.service.js';
import { getCdnUrl } from '../utils/cdn.js';
import { getLang, localizeExercise } from '../utils/lang.js';

/**
 * @route POST /api/user/auth
 */
export const syncUserAuth = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Yetkilendirme yapılamadı.' });
  }

  const { uid, email, name, picture } = req.user;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    });

    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: {
        name: (name && (!existingUser?.name || existingUser.name === '' || existingUser.name === 'Guest')) ? name : undefined,
        // Firebase'den fotoğraf gelmişse; SQL'de yoksa VEYA zaten bir google fotoğrafıysa (güncellemek için) güncelleyelim
        // Eğer kullanıcı özel bir fotoğraf yüklemişse (örn: BunnyCDN), onu ezmeyelim.
        photoUrl: (picture && (!existingUser?.photoUrl || existingUser.photoUrl === '' || existingUser.photoUrl.includes('googleusercontent.com'))) ? picture : undefined,
      }, 
      create: {
        firebaseUid: uid,
        email: email || undefined,
        name: name || undefined,
        photoUrl: picture || undefined,
      },
    });

    console.log('******************************************');
    console.log(`>>> GİRİŞ DENEMESİ: ${email} (UID: ${uid})`);
    
    const questionnaireCount = await prisma.questionnaire.count({
      where: { userId: user.id }
    });

    console.log(`>>> VERİTABANI DURUMU: UserId ${user.id} için ${questionnaireCount} anket bulundu.`);
    console.log(`>>> YANIT: hasCompletedSurvey = ${questionnaireCount > 0}`);
    console.log('******************************************');

    res.status(200).json({
      message: 'Kullanıcı doğrulandı ve veritabanına işlendi.',
      user,
      hasCompletedSurvey: questionnaireCount > 0
    });
  } catch (error) {
    console.error('Kullanıcı sync hatası [FULL ERROR]:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
};

/**
 * @route GET /api/user/profile
 */
export const getProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
      include: { 
        questionnaires: { take: 1, orderBy: { createdAt: 'desc' } } 
      },
    });

    if (!user) {
      console.log(`>>> GET PROFILE: Kullanıcı bulunamadı (UID: ${req.user.uid})`);
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('getProfile [FULL ERROR]:', error);
    res.status(500).json({ error: 'Profil getirilemedi', details: error.message });
  }
};

/**
 * @route PUT /api/user/profile
 */
export const updateProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const { name, photoUrl, height, weight, goal, gender, birthYear, targetWeight, bodyType, targetBodyType, speed, experience, trainingType, activityLevel, trainingDays, trainingDuration, notificationsEnabled, healthConnected } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : user.name,
        photoUrl: photoUrl !== undefined ? photoUrl : user.photoUrl,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : user.notificationsEnabled,
        healthConnected: healthConnected !== undefined ? healthConnected : user.healthConnected,
      },
    });

    console.log('>>> KULLANICI GÜNCELLENDİ:', updatedUser.id);

    if (height || weight || goal || gender || birthYear || targetWeight || bodyType || targetBodyType || speed || experience || trainingType || activityLevel || trainingDays || trainingDuration) {
      console.log('>>> ANKET VERİSİ GÜNCELLENİYOR...');
      const existingQuestionnaire = await prisma.questionnaire.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      const questionnaireData = {
        weight: weight !== undefined ? weight : undefined,
        height: height !== undefined ? height : undefined,
        goal: goal !== undefined ? String(goal) : undefined,
        gender: gender !== undefined ? String(gender) : undefined,
        birthYear: birthYear !== undefined ? Number(birthYear) : undefined,
        targetWeight: targetWeight !== undefined ? Number(targetWeight) : undefined,
        bodyType: bodyType !== undefined ? Number(bodyType) : undefined,
        targetBodyType: targetBodyType !== undefined ? Number(targetBodyType) : undefined,
        speed: speed !== undefined ? Number(speed) : undefined,
        experience: experience !== undefined ? Number(experience) : undefined,
        trainingType: trainingType !== undefined ? Number(trainingType) : undefined,
        activityLevel: activityLevel !== undefined ? Number(activityLevel) : undefined,
        trainingDays: trainingDays !== undefined ? String(trainingDays) : undefined,
        trainingDuration: trainingDuration !== undefined ? Number(trainingDuration) : undefined,
      };

      if (existingQuestionnaire) {
        console.log('>>> MEVCUT ANKET GÜNCELLENİYOR ID:', existingQuestionnaire.id);
        await prisma.questionnaire.update({
          where: { id: existingQuestionnaire.id },
          data: questionnaireData,
        });
      } else {
        console.log('>>> YENİ ANKET OLUŞTURULUYOR...');
        await prisma.questionnaire.create({
          data: {
            userId: user.id,
            ...questionnaireData,
          },
        });

        await createNotification(
          user.id,
          'Artık Hazırsın! 🚀',
          'Bilgilerin başarıyla alındı. 30 günlük karın kası yolculuğuna başlamaya hazırsın!',
          'success'
        );
      }
    }

    // En güncel kullanıcı verisini anketleriyle birlikte alalım
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        questionnaires: { take: 1, orderBy: { createdAt: 'desc' } } 
      }
    });

    console.log(`>>> GÜNCELLEME BAŞARILI: Yeni İsim = ${finalUser.name}`);
    console.log('******************************************');

    res.status(200).json({ message: 'Profil başarıyla güncellendi.', user: finalUser });
  } catch (error) {
    console.error('updateProfile [FULL ERROR]:', error);
    res.status(500).json({ error: 'Profil güncellenemedi.', details: error.message });
  }
};

/**
 * @route GET /api/user/stats
 */
export const getUserStats = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
      include: {
        progresses: {
          include: { exercise: true },
          orderBy: { completedAt: 'desc' },
        },
        completedProgramDays: true,
        questionnaires: { take: 1, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const lang = getLang(req);
    const completedDays = user.completedProgramDays
      .map(cd => cd.dayNumber)
      .sort((a, b) => a - b);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const completedDatesSet = new Set(
      user.completedProgramDays.map(cd => cd.completedAt.toISOString().split('T')[0])
    );

    let streak = 0;
    if (completedDatesSet.has(todayStr) || completedDatesSet.has(yesterdayStr)) {
      let checkDate = new Date(completedDatesSet.has(todayStr) ? now : yesterday);
      while (completedDatesSet.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const totalDurationSec = user.progresses.reduce((sum, p) => sum + p.duration, 0);
    const totalDurationMin = Math.round(totalDurationSec / 60);
    const totalMoves = user.progresses.length * 8;

    const totalActivity = user.progresses.length;
    const completionRate = Math.min(Math.round((totalActivity / 30) * 100), 100);

    const gender = user?.questionnaires[0]?.gender || 'male';
    const recentExercises = user.progresses
      .filter(p => p.duration < p.exercise.duration)
      .slice(0, 5)
      .map(p => {
        const localizedEx = localizeExercise(p.exercise, lang, gender);
        const progressRatio = Math.min((p.duration / p.exercise.duration), 1.0);
        return {
          id: p.exercise.id,
          title: localizedEx.title,
          category: p.exercise.difficulty || 'Karın',
          imagePath: getCdnUrl(localizedEx.imagePath),
          progress: progressRatio,
          progressText: `${Math.round(progressRatio * 100)}%`
        };
      });

    const latestQuestionnaire = user.questionnaires[0] || null;
    const initialWeight = latestQuestionnaire?.weight || 70;
    const targetWeight = latestQuestionnaire?.targetWeight || 65;
    
    const caloriesBurned = user.progresses.reduce((sum, p) => sum + (p.calories || 0), 0);
    const daysSinceCreation = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    let maxExpectedLoss = Math.abs(initialWeight - targetWeight);
    if (maxExpectedLoss <= 0) maxExpectedLoss = 15; // Kilo alma veya aynı kalma hedefiyse bile değişim görünsün
    const totalWeightChange = Math.min(weightLossFromWorkouts + weightLossFromTime, maxExpectedLoss);
    
    const isGaining = targetWeight > initialWeight;
    const currentWeight = isGaining ? initialWeight + totalWeightChange : initialWeight - totalWeightChange;

    let initialFatRate = 24;
    if (latestQuestionnaire?.bodyType) {
      initialFatRate = Math.round(latestQuestionnaire.bodyType * 10) + 15;
    } else if (latestQuestionnaire?.gender === 'female') {
      initialFatRate = 30;
    }
    const fatRateReduction = totalWeightLoss * 0.5;
    const currentFatRate = Math.max(8, initialFatRate - fatRateReduction);

    const initialMuscleMass = currentWeight * 0.4;
    const muscleMassIncrease = totalActivity * 0.1;
    const currentMuscleMass = initialMuscleMass + muscleMassIncrease;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyActivity = await prisma.dailyActivity.findUnique({
      where: { userId_date: { userId: user.id, date: today } }
    });

    const steps = dailyActivity?.steps || 0;
    const bpm = Math.round(dailyActivity?.heartRate || 0);
    const sleepMinutes = dailyActivity?.sleepMinutes || 0;
    const sleepHours = Math.floor(sleepMinutes / 60);
    const sleepMins = Math.round(sleepMinutes % 60);
    const sleepDuration = `${sleepHours} Saat ${sleepMins} Dakika`;

    res.status(200).json({
      totalActivity,
      totalKcal: caloriesBurned,
      weightLost: parseFloat(totalWeightChange.toFixed(2)),
      streak,
      totalDuration: totalDurationMin,
      totalMoves,
      completionRate,
      initialWeight,
      targetWeight,
      weight: parseFloat(currentWeight.toFixed(2)),
      bpm,
      steps,
      waterIntake: user.waterIntake,
      fatRate: Math.round(currentFatRate),
      initialFatRate,
      initialMuscleMass: parseFloat(initialMuscleMass.toFixed(1)),
      sleepDuration,
      muscleMass: parseFloat(currentMuscleMass.toFixed(1)),
      completedDays,
      completedAtDates: Array.from(completedDatesSet),
      recentExercises
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'İstatistikler getirilemedi' });
  }
};

/**
 * @route PUT /api/user/stats/water
 */
export const updateWaterIntake = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const { amount } = req.body;

  if (amount === undefined || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Geçersiz miktar.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        waterIntake: amount
      }
    });

    res.status(200).json({
      message: 'Su tüketimi güncellendi.',
      waterIntake: updatedUser.waterIntake
    });
  } catch (error) {
    console.error('Water update error:', error);
    res.status(500).json({ error: 'Su tüketimi güncellenemedi.' });
  }
};
/**
 * @route POST /api/user/sync-health
 */
export const syncHealthData = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const { steps, calories, sleepMinutes, weight, heartRate, syncDate } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    let today;
    if (syncDate) {
      today = new Date(syncDate);
    } else {
      today = new Date();
    }
    today.setHours(0, 0, 0, 0);

    const dailyActivity = await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      },
      update: {
        steps: steps !== undefined ? steps : undefined,
        calories: calories !== undefined ? calories : undefined,
        sleepMinutes: sleepMinutes !== undefined ? sleepMinutes : undefined,
        weight: weight !== undefined ? weight : undefined,
        heartRate: heartRate !== undefined ? heartRate : undefined,
      },
      create: {
        userId: user.id,
        date: today,
        steps: steps || 0,
        calories: calories || 0,
        sleepMinutes: sleepMinutes || 0,
        weight: weight,
        heartRate: heartRate || 0,
      }
    });

    res.status(200).json({ message: 'Sağlık verileri güncellendi.', dailyActivity });
  } catch (error) {
    console.error('Health sync error:', error);
    res.status(500).json({ error: 'Sağlık verileri senkronize edilemedi.' });
  }
};

export const deleteProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    await prisma.user.delete({ where: { id: user.id } });

    res.status(200).json({ message: 'Profil başarıyla silindi.' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Profil silinemedi.' });
  }
};


export const updatePremiumStatus = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const { isPremium } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isPremium: !!isPremium }
    });

    res.status(200).json({
      message: 'Premium durumu güncellendi.',
      isPremium: updatedUser.isPremium
    });
  } catch (error) {
    console.error('Premium update error:', error);
    res.status(500).json({ error: 'Premium durumu güncellenemedi.' });
  }
};

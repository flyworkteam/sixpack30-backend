import type { Request, Response } from 'express';
import prisma from '../config/database';
import { createNotification } from '../services/notification.service';
import { getCdnUrl } from '../utils/cdn';
import { getLang, localizeExercise } from '../utils/lang';

/**
 * Kullanıcı Firebase ile frontend'den giriş yaptıktan sonra veya
 * yeni kayıt olduktan sonra çalışacak ana "Login / Auth Sync" metodu.
 * @route POST /api/user/auth
 */
export const syncUserAuth = async (req: Request, res: Response) => {
  // `req.user` bizim Firebase auth.middleware.ts tarafından doğrulanıp dolduruldu
  if (!req.user) {
    return res.status(401).json({ error: 'Yetkilendirme yapılamadı.' });
  }

  const { uid, email, name, picture } = req.user;

  try {
    // Kullanıcı MySQL sistemimizde var mı?
    // Ayrıca "upsert" kullanarak varsa çek, yoksa oluştur mantığını kuruyoruz.
    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: {}, 
      create: {
        firebaseUid: uid,
        email: email || undefined,
        name: name || undefined,
        photoUrl: picture || undefined,
      },
    });

    // [TEŞHİS LOGU] Giriş denemesi detayları
    console.log('******************************************');
    console.log(`>>> GİRİŞ DENEMESİ: ${email} (UID: ${uid})`);
    
    // Anket durumunu kesin olarak kontrol edelim
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
    console.error(error); // Ayrıca ham error da yazdırılsın
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
};

/**
 * Kullanıcının profil bilgilerini getirme
 * @route GET /api/user/profile
 */
export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
      include: { questionnaires: true }, // Varsa anket verilerini de getir
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Profil getirilemedi' });
  }
};

/**
 * Kullanıcı profil bilgilerini / anketini güncelleme
 * @route PUT /api/user/profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const { name, photoUrl, height, weight, goal, gender, birthYear, targetWeight, bodyType, targetBodyType, speed, experience, trainingType, activityLevel, trainingDays, trainingDuration, notificationsEnabled, healthConnected } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.user.uid } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    // [TEŞHİS LOGU] Profil güncelleme denemesi
    console.log('******************************************');
    console.log(`>>> PROFIL GÜNCELLEME: ${user.email} (ID: ${user.id})`);
    console.log('>>> GELEN VERİ:', JSON.stringify(req.body, null, 2));

    // Temel kullanıcı bilgilerini güncelle
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : user.name,
        photoUrl: photoUrl !== undefined ? photoUrl : user.photoUrl,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : user.notificationsEnabled,
        healthConnected: healthConnected !== undefined ? healthConnected : user.healthConnected,
      },
    });

    console.log(`>>> GÜNCELLEME BAŞARILI: Yeni İsim = ${updatedUser.name}`);
    console.log('******************************************');

    // Eğer anket bilgileri de gönderilmişse Questionnaire tablosuna ekle/güncelle
    if (height || weight || goal || gender || birthYear || targetWeight || bodyType || targetBodyType || speed || experience || trainingType || activityLevel || trainingDays || trainingDuration) {
      // Önce mevcut anket var mı kontrol edelim
      const existingQuestionnaire = await prisma.questionnaire.findFirst({
        where: { userId: user.id },
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
        await prisma.questionnaire.update({
          where: { id: existingQuestionnaire.id },
          data: questionnaireData,
        });
      } else {
        await prisma.questionnaire.create({
          data: {
            userId: user.id,
            ...questionnaireData,
          },
        });

        // BİLDİRİM GÖNDER (İlk anket tamamlandığında)
        await createNotification(
          user.id,
          'Anket Tamamlandı! 🎉',
          'Bilgilerin başarıyla alındı. 30 günlük karın kası yolculuğuna başlamaya hazırsın!',
          'success'
        );
      }
    }

    res.status(200).json({ message: 'Profil başarıyla güncellendi.', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
};

/**
 * Kullanıcı istatistiklerini getirme (Gerçek + Simüle edilmiş sağlık verileri)
 * @route GET /api/user/stats
 */
export const getUserStats = async (req: Request, res: Response) => {
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

    // GERÇEK VERİLER (Veritabanından)
    const lang = getLang(req);
    const completedDays = user.completedProgramDays
      .map(cd => cd.dayNumber)
      .sort((a, b) => a - b);

    // 1. Seriyi (Streak) hesapla (Takvim tarihlerine göre ardışık günleri say)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const completedDatesSet = new Set(
      user.completedProgramDays.map(cd => cd.completedAt.toISOString().split('T')[0])
    );

    let streak = 0;
    // Eğer bugün veya dün antrenman yapılmışsa seriyi kontrol et
    if (completedDatesSet.has(todayStr) || completedDatesSet.has(yesterdayStr)) {
      let checkDate = new Date(completedDatesSet.has(todayStr) ? now : yesterday);
      while (completedDatesSet.has(checkDate.toISOString().split('T')[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // 2. Toplam Süreyi (Dakika) ve Hareket Sayısını hesapla
    const totalDurationSec = user.progresses.reduce((sum, p) => sum + p.duration, 0);
    const totalDurationMin = Math.round(totalDurationSec / 60);
    const totalMoves = user.progresses.length * 8; // Ortalama her antrenman 8 hareket varsayımı

    // 3. Tamamlama Oranı (30 günlük program varsayımıyla)
    const totalActivity = user.progresses.length;
    const completionRate = Math.min(Math.round((totalActivity / 30) * 100), 100);

    // SON AKTİVİTELER (Kaldığın yerden devam et için - Sadece yarım kalmışları al)
    const recentExercises = user.progresses
      .filter(p => p.duration < p.exercise.duration) // Sadece süresi tamamlanmamış olanlar
      .slice(0, 5)
      .map(p => {
        const localizedEx = localizeExercise(p.exercise, lang);
        const progressRatio = Math.min((p.duration / p.exercise.duration), 1.0);
        return {
          id: p.exercise.id,
          title: localizedEx.title,
          category: p.exercise.difficulty || 'Karın',
          imagePath: getCdnUrl(p.exercise.imagePath),
          progress: progressRatio,
          progressText: `${Math.round(progressRatio * 100)}%`
        };
      });

    // --- Karın Odaklı Dinamik Hesaplama ---
    const latestQuestionnaire = user.questionnaires[0] || null;
    const initialWeight = latestQuestionnaire?.weight || 70;
    const targetWeight = latestQuestionnaire?.targetWeight || 65;
    
    // 1. Kilo Kaybı: Toplam yakılan kaloriye dayalı (7700 kcal = 1kg) + Metabolik baz (günlük 0.05kg)
    const caloriesBurned = user.progresses.reduce((sum, p) => sum + (p.calories || 0), 0);
    const daysSinceCreation = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Antrenmanlardan gelen kilo kaybı + zamanla gelen hafif metabolik etki
    const weightLossFromWorkouts = caloriesBurned / 7700;
    const weightLossFromTime = daysSinceCreation * 0.05;
    const totalWeightLoss = Math.min(weightLossFromWorkouts + weightLossFromTime, Math.max(0, initialWeight - targetWeight));
    
    const currentWeight = initialWeight - totalWeightLoss;

    // 2. Yağ Oranı: Kilo kaybına paralel düşüş (Her 1kg kayıp yağ oranını yaklaşık %0.5 düşürür diye varsayalım)
    let initialFatRate = 24;
    if (latestQuestionnaire?.bodyType) {
      initialFatRate = Math.round(latestQuestionnaire.bodyType * 10) + 15;
    } else if (latestQuestionnaire?.gender === 'female') {
      initialFatRate = 30;
    }
    const fatRateReduction = totalWeightLoss * 0.5;
    const currentFatRate = Math.max(8, initialFatRate - fatRateReduction); // Minimum %8'e kadar düşer

    // 3. Kas Kütlesi (Karın Odaklı): Tamamlanan aktivite sayısına göre artış
    // Her antrenman kas kütlesine yaklaşık 0.1kg reel katkı sağlar (simülasyon)
    const initialMuscleMass = currentWeight * 0.4; // Başlangıçta %40 kas
    const muscleMassIncrease = totalActivity * 0.1;
    const currentMuscleMass = initialMuscleMass + muscleMassIncrease;

    res.status(200).json({
      totalActivity,
      totalKcal: caloriesBurned,
      weightLost: parseFloat(totalWeightLoss.toFixed(1)),
      streak,
      totalDuration: totalDurationMin,
      totalMoves,
      completionRate,
      initialWeight,
      targetWeight,
      weight: parseFloat(currentWeight.toFixed(1)),
      bpm: 75, 
      steps: 5420 + (daysSinceCreation * 10),
      waterIntake: user.waterIntake,
      fatRate: Math.round(currentFatRate),
      initialFatRate,
      initialMuscleMass: parseFloat(initialMuscleMass.toFixed(1)),
      sleepDuration: "8 Saat", 
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
 * Kullanıcı su tüketimini güncelleme
 * @route PUT /api/user/stats/water
 */
export const updateWaterIntake = async (req: Request, res: Response) => {
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
 * Sağlık verilerini (Adım, Kalori, Uyku) senkronize etme
 * @route POST /api/user/sync-health
 */
export const syncHealthData = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const { steps, calories, sleepMinutes, weight } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid }
    });

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const today = new Date();
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
      },
      create: {
        userId: user.id,
        date: today,
        steps: steps || 0,
        calories: calories || 0,
        sleepMinutes: sleepMinutes || 0,
        weight: weight,
      }
    });

    res.status(200).json({
      message: 'Sağlık verileri başarıyla senkronize edildi.',
      dailyActivity
    });
  } catch (error) {
    console.error('Health sync error:', error);
    res.status(500).json({ error: 'Sağlık verileri senkronize edilemedi.' });
  }
};

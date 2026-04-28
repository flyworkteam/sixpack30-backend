import { PrismaClient } from '@prisma/client';
import { getCdnUrl } from '../utils/cdn.js';
import { getLang, localizeExercise } from '../utils/lang.js';

const prisma = new PrismaClient();

/**
 */
export const getWorkouts = async (req, res) => {
  const lang = getLang(req);
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
      include: { questionnaires: { take: 1, orderBy: { createdAt: 'desc' } } }
    });

    const gender = user?.questionnaires[0]?.gender || 'male';
    const exercises = await prisma.exercise.findMany();
    
    const localizedExercises = exercises.map(e => {
      const localized = localizeExercise(e, lang, gender);
      return {
        ...localized,
        imagePath: getCdnUrl(localized.imagePath)
      };
    });

    res.status(200).json(localizedExercises);
  } catch (error) {
    console.error('getWorkouts error:', error);
    res.status(500).json({ error: 'Antrenmanlar getirilemedi' });
  }
};

/**
 */
export const getWorkoutDetail = async (req, res) => {
  const { id } = req.params;
  const lang = getLang(req);
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.user.uid },
      include: { questionnaires: { take: 1, orderBy: { createdAt: 'desc' } } }
    });

    const gender = user?.questionnaires[0]?.gender || 'male';
    const exercise = await prisma.exercise.findUnique({
      where: { id: parseInt(id) }
    });
    if (!exercise) return res.status(404).json({ error: 'Egzersiz bulunamadı' });
    
    const localized = localizeExercise(exercise, lang, gender);
    const localizedExercise = {
      ...localized,
      imagePath: getCdnUrl(localized.imagePath)
    };

    res.status(200).json(localizedExercise);
  } catch (error) {
    console.error('getWorkoutDetail error:', error);
    res.status(500).json({ error: 'Detaylar getirilemedi' });
  }
};

import { PrismaClient } from '@prisma/client';
import { getCdnUrl } from '../utils/cdn.js';
import { getLang, localizeExercise } from '../utils/lang.js';

const prisma = new PrismaClient();

/**
 */
export const getWorkouts = async (req, res) => {
  const lang = getLang(req);
  try {
    const exercises = await prisma.exercise.findMany();
    
    const localizedExercises = exercises.map(e => ({
      ...localizeExercise(e, lang),
      imagePath: getCdnUrl(e.imagePath)
    }));

    res.status(200).json(localizedExercises);
  } catch (error) {
    res.status(500).json({ error: 'Antrenmanlar getirilemedi' });
  }
};

/**
 */
export const getWorkoutDetail = async (req, res) => {
  const { id } = req.params;
  const lang = getLang(req);
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: parseInt(id) }
    });
    if (!exercise) return res.status(404).json({ error: 'Egzersiz bulunamadı' });
    
    const localizedExercise = {
      ...localizeExercise(exercise, lang),
      imagePath: getCdnUrl(exercise.imagePath)
    };

    res.status(200).json(localizedExercise);
  } catch (error) {
    res.status(500).json({ error: 'Detaylar getirilemedi' });
  }
};

import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCdnUrl } from '../utils/cdn';
import { getLang, localizeExercise } from '../utils/lang';

const prisma = new PrismaClient();

/**
 * Tüm antrenman günlerini getirir (30 günlük program)
 */
export const getWorkouts = async (req: Request, res: Response) => {
  const lang = getLang(req);
  try {
    const exercises = await prisma.exercise.findMany();
    
    // Çevirileri ve CDN URL'lerini ekle
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
 * Belirli bir antrenmanın detaylarını getirir
 */
export const getWorkoutDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const lang = getLang(req);
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: parseInt(id) }
    });
    if (!exercise) return res.status(404).json({ error: 'Egzersiz bulunamadı' });
    
    // Çeviriyi ve CDN URL'ini ekle
    const localizedExercise = {
      ...localizeExercise(exercise, lang),
      imagePath: getCdnUrl(exercise.imagePath)
    };

    res.status(200).json(localizedExercise);
  } catch (error) {
    res.status(500).json({ error: 'Detaylar getirilemedi' });
  }
};

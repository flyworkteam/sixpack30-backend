import type { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * Veritabanında kayıtlı egzersizleri getirir.
 * Eğer kullanıcı ücretsiz bir hesaplaysa, sadece premium olmayan egzersizleri getirebiliriz.
 * Veya hepsini getirip kilitli (isPremium) olduğunu UI tarafında gösterebiliriz (daha modern yöntem).
 * @route GET /api/content/exercises
 */
export const getExercises = async (req: Request, res: Response) => {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: {
        createdAt: 'asc', // Sıralı gelmesi için
      },
    });

    res.status(200).json(exercises);
  } catch (error) {
    console.error('Egzersiz getirme hatası:', error);
    res.status(500).json({ error: 'Egzersizler listelenirken bir hata oluştu.' });
  }
};

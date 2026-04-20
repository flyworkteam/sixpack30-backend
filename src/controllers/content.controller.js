import prisma from '../config/database.js';

/**
 * @route GET /api/content/exercises
 */
export const getExercises = async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json(exercises);
  } catch (error) {
    console.error('Egzersiz getirme hatası:', error);
    res.status(500).json({ error: 'Egzersizler listelenirken bir hata oluştu.' });
  }
};

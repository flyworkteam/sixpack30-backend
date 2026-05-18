import prisma from '../../config/database.js';
import { panelConfig } from '../../panel/config.js';
import {
  endOfDayInTimezone,
  formatDateInTimezone,
  startOfDayInTimezone,
} from '../../panel/utils.js';

async function countActiveUsersBetween(start, end) {
  const [progressUsers, dayUsers, updatedUsers] = await Promise.all([
    prisma.progress.findMany({
      where: { completedAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.completedDay.findMany({
      where: { completedAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.user.findMany({
      where: { updatedAt: { gte: start, lte: end } },
      select: { id: true },
    }),
  ]);

  const ids = new Set([
    ...progressUsers.map((r) => r.userId),
    ...dayUsers.map((r) => r.userId),
    ...updatedUsers.map((r) => r.id),
  ]);
  return ids.size;
}

export const getPanelAnalyse = async (req, res) => {
  const tz = panelConfig.timezone;
  const days = panelConfig.dailyDays;
  const todayStr = formatDateInTimezone(new Date(), tz);
  const todayStart = startOfDayInTimezone(todayStr, tz);
  const todayEnd = endOfDayInTimezone(todayStr, tz);

  try {
    const [
      totalUsers,
      newUsersToday,
      totalWorkouts,
      publishedWorkouts,
      progressToday,
      completedDaysToday,
      activeProgressUsers,
      activeDayUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.exercise.count(),
      prisma.exercise.count({ where: { status: 'published' } }),
      prisma.progress.count({
        where: { completedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.completedDay.count({
        where: { completedAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.progress.findMany({
        where: { completedAt: { gte: todayStart, lte: todayEnd } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.completedDay.findMany({
        where: { completedAt: { gte: todayStart, lte: todayEnd } },
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const workoutsCompletedToday = progressToday + completedDaysToday;
    const activeWorkoutUsersToday = new Set([
      ...activeProgressUsers.map((x) => x.userId),
      ...activeDayUsers.map((x) => x.userId),
    ]).size;

    const loginsToday = await countActiveUsersBetween(todayStart, todayEnd);

    const daily = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = formatDateInTimezone(d, tz);
      const dayStart = startOfDayInTimezone(dateStr, tz);
      const dayEnd = endOfDayInTimezone(dateStr, tz);

      const [logins, newUsers, progressCount, dayCount, progressMinutes] =
        await Promise.all([
          countActiveUsersBetween(dayStart, dayEnd),
          prisma.user.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
          }),
          prisma.progress.count({
            where: { completedAt: { gte: dayStart, lte: dayEnd } },
          }),
          prisma.completedDay.count({
            where: { completedAt: { gte: dayStart, lte: dayEnd } },
          }),
          prisma.progress.aggregate({
            where: { completedAt: { gte: dayStart, lte: dayEnd } },
            _sum: { duration: true },
          }),
        ]);

      daily.push({
        date: dateStr,
        logins,
        newUsers,
        workoutsCompleted: progressCount + dayCount,
        workoutMinutes: Math.round((progressMinutes._sum.duration || 0) / 60),
      });
    }

    const topProgress = await prisma.progress.groupBy({
      by: ['exerciseId'],
      _count: { exerciseId: true },
      orderBy: { _count: { exerciseId: 'desc' } },
      take: 5,
    });

    const exerciseIds = topProgress.map((t) => t.exerciseId);
    const exercises = exerciseIds.length
      ? await prisma.exercise.findMany({ where: { id: { in: exerciseIds } } })
      : [];
    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    const workoutsSummary = {
      topWorkoutsByCompletions: topProgress.map((row) => ({
        workoutId: String(row.exerciseId),
        title: exerciseMap.get(row.exerciseId)?.title_tr ?? `Egzersiz ${row.exerciseId}`,
        completions: row._count.exerciseId,
      })),
    };

    res.status(200).json({
      contractVersion: '2',
      generatedAt: new Date().toISOString(),
      timezone: tz,
      summary: {
        totalUsers,
        loginsToday,
        newUsersToday,
        totalWorkouts,
        publishedWorkouts,
        workoutsCompletedToday,
        activeWorkoutUsersToday,
      },
      daily,
      workoutsSummary,
    });
  } catch (error) {
    console.error('[Panel] analyse error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Analiz verileri alınamadı.',
    });
  }
};

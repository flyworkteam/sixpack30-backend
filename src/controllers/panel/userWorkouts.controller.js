import prisma from '../../config/database.js';
import {
  mapCompletedDayToPanelUserWorkout,
  mapProgressToPanelUserWorkout,
} from '../../panel/mappers.js';
import {
  endOfDayInTimezone,
  panelError,
  panelItemResponse,
  panelListResponse,
  parseDateQuery,
  parsePagination,
  paginationMeta,
  shallowMergeExtras,
  startOfDayInTimezone,
} from '../../panel/utils.js';
import { panelConfig } from '../../panel/config.js';

async function loadExerciseMap(ids) {
  if (!ids.length) return new Map();
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: [...new Set(ids)] } },
  });
  return new Map(exercises.map((e) => [e.id, e]));
}

function buildProgressWhere(query) {
  const where = {};
  if (query.userId) where.userId = parseInt(query.userId, 10);
  if (query.workoutId) where.exerciseId = parseInt(query.workoutId, 10);
  const from = parseDateQuery(query.from);
  const to = parseDateQuery(query.to);
  if (from || to) {
    where.completedAt = {};
    if (from) {
      where.completedAt.gte = startOfDayInTimezone(from, panelConfig.timezone);
    }
    if (to) {
      where.completedAt.lte = endOfDayInTimezone(to, panelConfig.timezone);
    }
  }
  return where;
}

function buildCompletedDayWhere(query) {
  const where = {};
  if (query.userId) where.userId = parseInt(query.userId, 10);
  if (query.workoutId) where.dayNumber = parseInt(query.workoutId, 10);
  const from = parseDateQuery(query.from);
  const to = parseDateQuery(query.to);
  if (from || to) {
    where.completedAt = {};
    if (from) {
      where.completedAt.gte = startOfDayInTimezone(from, panelConfig.timezone);
    }
    if (to) {
      where.completedAt.lte = endOfDayInTimezone(to, panelConfig.timezone);
    }
  }
  return where;
}

function matchesStatus(item, statusFilter) {
  if (!statusFilter) return true;
  return item.status === statusFilter;
}

async function fetchMergedUserWorkouts(query, { userIdOnly } = {}) {
  const q = { ...query };
  if (userIdOnly) q.userId = String(userIdOnly);

  const progressWhere = buildProgressWhere(q);
  const dayWhere = buildCompletedDayWhere(q);
  const statusFilter = q.status;

  const [progressRows, dayRows] = await Promise.all([
    prisma.progress.findMany({
      where: progressWhere,
      orderBy: { completedAt: 'desc' },
      take: 500,
    }),
    prisma.completedDay.findMany({
      where: dayWhere,
      orderBy: { completedAt: 'desc' },
      take: 500,
    }),
  ]);

  const exerciseIds = [
    ...progressRows.map((p) => p.exerciseId),
    ...dayRows.map((d) => d.dayNumber),
  ];
  const exerciseMap = await loadExerciseMap(exerciseIds);

  let merged = [
    ...progressRows.map((p) =>
      mapProgressToPanelUserWorkout(p, exerciseMap.get(p.exerciseId))
    ),
    ...dayRows.map((d) =>
      mapCompletedDayToPanelUserWorkout(d, exerciseMap.get(d.dayNumber))
    ),
  ].filter((item) => matchesStatus(item, statusFilter));

  merged.sort((a, b) => {
    const ta = new Date(b.completedAt || b.startedAt || 0).getTime();
    const tb = new Date(a.completedAt || a.startedAt || 0).getTime();
    return ta - tb;
  });

  return merged;
}

export const listPanelUserWorkouts = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  try {
    const merged = await fetchMergedUserWorkouts(req.query);
    const total = merged.length;
    const data = merged.slice(skip, skip + limit);
    res.status(200).json(panelListResponse(data, paginationMeta(page, limit, total)));
  } catch (error) {
    console.error('[Panel] list user-workouts error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Oturum listesi alınamadı.' });
  }
};

export const listPanelUserWorkoutsByUser = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (Number.isNaN(userId)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz kullanıcı id.');
  }

  const { page, limit, skip } = parsePagination(req.query);

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return panelError(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');
    }

    const merged = await fetchMergedUserWorkouts(req.query, { userIdOnly: userId });
    const total = merged.length;
    const data = merged.slice(skip, skip + limit);
    res.status(200).json(panelListResponse(data, paginationMeta(page, limit, total)));
  } catch (error) {
    console.error('[Panel] list user workouts by user error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Kullanıcı oturumları alınamadı.' });
  }
};

export const getPanelUserWorkout = async (req, res) => {
  const { id } = req.params;

  try {
    if (id.startsWith('p_')) {
      const progressId = parseInt(id.slice(2), 10);
      const progress = await prisma.progress.findUnique({ where: { id: progressId } });
      if (!progress) {
        return panelError(res, 404, 'NOT_FOUND', 'Oturum bulunamadı.');
      }
      const exercise = await prisma.exercise.findUnique({
        where: { id: progress.exerciseId },
      });
      return res
        .status(200)
        .json(panelItemResponse(mapProgressToPanelUserWorkout(progress, exercise)));
    }

    if (id.startsWith('cd_')) {
      const dayId = parseInt(id.slice(3), 10);
      const completedDay = await prisma.completedDay.findUnique({ where: { id: dayId } });
      if (!completedDay) {
        return panelError(res, 404, 'NOT_FOUND', 'Oturum bulunamadı.');
      }
      const exercise = await prisma.exercise.findUnique({
        where: { id: completedDay.dayNumber },
      });
      return res
        .status(200)
        .json(panelItemResponse(mapCompletedDayToPanelUserWorkout(completedDay, exercise)));
    }

    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz oturum id formatı.');
  } catch (error) {
    console.error('[Panel] get user-workout error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Oturum detayı alınamadı.' });
  }
};

export const patchPanelUserWorkout = async (req, res) => {
  const { id } = req.params;
  const { status, extras } = req.body || {};

  try {
    if (!id.startsWith('p_')) {
      return panelError(
        res,
        400,
        'BAD_REQUEST',
        'Yalnızca progress kayıtları (p_*) düzenlenebilir.'
      );
    }

    const progressId = parseInt(id.slice(2), 10);
    const progress = await prisma.progress.findUnique({ where: { id: progressId } });
    if (!progress) {
      return panelError(res, 404, 'NOT_FOUND', 'Oturum bulunamadı.');
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: progress.exerciseId },
    });

    const mapped = mapProgressToPanelUserWorkout(progress, exercise);
    if (status) mapped.status = status;
    if (extras) mapped.extras = shallowMergeExtras(mapped.extras, extras);

    res.status(200).json(panelItemResponse(mapped));
  } catch (error) {
    console.error('[Panel] patch user-workout error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Oturum güncellenemedi.' });
  }
};

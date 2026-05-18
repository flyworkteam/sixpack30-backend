import prisma from '../../config/database.js';
import {
  mapExerciseToPanelWorkout,
  mapPanelWorkoutInputToExercise,
} from '../../panel/mappers.js';
import {
  panelError,
  panelItemResponse,
  panelListResponse,
  parsePagination,
  paginationMeta,
} from '../../panel/utils.js';

function buildWorkoutWhere(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;
  if (query.difficulty) {
    where.difficulty = { contains: query.difficulty };
  }
  const search = (query.search || '').trim();
  if (search) {
    where.OR = [
      { title_tr: { contains: search } },
      { title_en: { contains: search } },
      { description_tr: { contains: search } },
    ];
  }
  return where;
}

export const listPanelWorkouts = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = buildWorkoutWhere(req.query);

  try {
    const [items, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      prisma.exercise.count({ where }),
    ]);

    res
      .status(200)
      .json(panelListResponse(items.map(mapExerciseToPanelWorkout), paginationMeta(page, limit, total)));
  } catch (error) {
    console.error('[Panel] list workouts error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Antrenman listesi alınamadı.' });
  }
};

export const getPanelWorkout = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz antrenman id.');
  }

  try {
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      return panelError(res, 404, 'NOT_FOUND', 'Antrenman bulunamadı.');
    }
    res.status(200).json(panelItemResponse(mapExerciseToPanelWorkout(exercise)));
  } catch (error) {
    console.error('[Panel] get workout error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Antrenman detayı alınamadı.' });
  }
};

export const createPanelWorkout = async (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return panelError(res, 400, 'BAD_REQUEST', 'title alanı zorunludur.');
  }

  try {
    const data = mapPanelWorkoutInputToExercise(req.body);
    const exercise = await prisma.exercise.create({ data });
    res.status(201).json(panelItemResponse(mapExerciseToPanelWorkout(exercise)));
  } catch (error) {
    console.error('[Panel] create workout error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Antrenman oluşturulamadı.' });
  }
};

export const patchPanelWorkout = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz antrenman id.');
  }

  try {
    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      return panelError(res, 404, 'NOT_FOUND', 'Antrenman bulunamadı.');
    }

    const data = mapPanelWorkoutInputToExercise(req.body, existing);
    const exercise = await prisma.exercise.update({ where: { id }, data });
    res.status(200).json(panelItemResponse(mapExerciseToPanelWorkout(exercise)));
  } catch (error) {
    console.error('[Panel] patch workout error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Antrenman güncellenemedi.' });
  }
};

export const deletePanelWorkout = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz antrenman id.');
  }

  try {
    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      return panelError(res, 404, 'NOT_FOUND', 'Antrenman bulunamadı.');
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: { status: 'archived' },
    });

    res.status(200).json(panelItemResponse(mapExerciseToPanelWorkout(exercise)));
  } catch (error) {
    console.error('[Panel] delete workout error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Antrenman arşivlenemedi.' });
  }
};

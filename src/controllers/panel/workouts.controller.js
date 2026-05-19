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
import {
  isMultipartWorkoutRequest,
  parseWorkoutFormBody,
  uploadWorkoutMediaFiles,
} from '../../services/panelMedia.service.js';

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

function rejectDirectCdnUrls(body, res) {
  if (body.coverImageUrl || body.videoUrl || body.extras?.videoUrl) {
    panelError(
      res,
      400,
      'BAD_REQUEST',
      'Kapak ve video BunnyCDN\'e panelden değil API üzerinden yüklenmelidir. multipart/form-data ile coverImage ve/veya video dosyası gönderin.'
    );
    return true;
  }
  return false;
}

async function applyMediaAndRespond(res, exercise, files, statusCode = 200) {
  if (files && (files.coverImage?.length || files.video?.length)) {
    const mediaPaths = await uploadWorkoutMediaFiles(files, exercise.id);
    if (mediaPaths.imagePath || mediaPaths.videoPath) {
      exercise = await prisma.exercise.update({
        where: { id: exercise.id },
        data: mediaPaths,
      });
    }
  }

  return res.status(statusCode).json(panelItemResponse(mapExerciseToPanelWorkout(exercise)));
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
  const body = parseWorkoutFormBody(req.body);

  if (!isMultipartWorkoutRequest(req) && rejectDirectCdnUrls(body, res)) {
    return;
  }

  const { title } = body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return panelError(res, 400, 'BAD_REQUEST', 'title alanı zorunludur.');
  }

  try {
    const data = mapPanelWorkoutInputToExercise(body);
    let exercise = await prisma.exercise.create({ data });
    return await applyMediaAndRespond(res, exercise, req.files, 201);
  } catch (error) {
    console.error('[Panel] create workout error:', error);
    const message =
      error.message?.includes('CDN') || error.message?.includes('Kapak') || error.message?.includes('Video')
        ? error.message
        : 'Antrenman oluşturulamadı.';
    res.status(error.message?.includes('CDN') ? 503 : 500).json({
      error: error.message?.includes('CDN') ? 'CDN_ERROR' : 'INTERNAL_ERROR',
      message,
    });
  }
};

export const patchPanelWorkout = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz antrenman id.');
  }

  const body = parseWorkoutFormBody(req.body);

  if (!isMultipartWorkoutRequest(req) && rejectDirectCdnUrls(body, res)) {
    return;
  }

  try {
    const existing = await prisma.exercise.findUnique({ where: { id } });
    if (!existing) {
      return panelError(res, 404, 'NOT_FOUND', 'Antrenman bulunamadı.');
    }

    const data = mapPanelWorkoutInputToExercise(body, existing);
    let exercise = await prisma.exercise.update({ where: { id }, data });
    return await applyMediaAndRespond(res, exercise, req.files);
  } catch (error) {
    console.error('[Panel] patch workout error:', error);
    const message =
      error.message?.includes('CDN') || error.message?.includes('Kapak') || error.message?.includes('Video')
        ? error.message
        : 'Antrenman güncellenemedi.';
    res.status(error.message?.includes('CDN') ? 503 : 500).json({
      error: error.message?.includes('CDN') ? 'CDN_ERROR' : 'INTERNAL_ERROR',
      message,
    });
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

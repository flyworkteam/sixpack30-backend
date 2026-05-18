import prisma from '../../config/database.js';
import { mapUserToPanel } from '../../panel/mappers.js';
import {
  panelError,
  panelItemResponse,
  panelListResponse,
  parsePagination,
  paginationMeta,
  shallowMergeExtras,
} from '../../panel/utils.js';

async function getLatestQuestionnaire(userId) {
  return prisma.questionnaire.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export const listPanelUsers = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = (req.query.search || '').trim();

  try {
    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
            { firebaseUid: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const questionnaires = await Promise.all(
      users.map((u) => getLatestQuestionnaire(u.id))
    );

    const data = users.map((u, i) => mapUserToPanel(u, questionnaires[i]));

    res.status(200).json(panelListResponse(data, paginationMeta(page, limit, total)));
  } catch (error) {
    console.error('[Panel] list users error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Kullanıcı listesi alınamadı.' });
  }
};

export const getPanelUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz kullanıcı id.');
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return panelError(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');
    }
    const questionnaire = await getLatestQuestionnaire(user.id);
    res.status(200).json(panelItemResponse(mapUserToPanel(user, questionnaire)));
  } catch (error) {
    console.error('[Panel] get user error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Kullanıcı detayı alınamadı.' });
  }
};

export const patchPanelUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return panelError(res, 400, 'BAD_REQUEST', 'Geçersiz kullanıcı id.');
  }

  const { email, displayName, status, extras } = req.body || {};

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return panelError(res, 404, 'NOT_FOUND', 'Kullanıcı bulunamadı.');
    }

    const data = {};
    if (email !== undefined) data.email = email;
    if (displayName !== undefined) data.name = displayName;
    if (extras?.isPremium !== undefined) data.isPremium = Boolean(extras.isPremium);
    if (extras?.notificationsEnabled !== undefined) {
      data.notificationsEnabled = Boolean(extras.notificationsEnabled);
    }
    if (extras?.healthConnected !== undefined) {
      data.healthConnected = Boolean(extras.healthConnected);
    }

    const updated = await prisma.user.update({ where: { id }, data });
    const questionnaire = await getLatestQuestionnaire(updated.id);
    const mapped = mapUserToPanel(updated, questionnaire);

    if (extras) {
      mapped.extras = shallowMergeExtras(mapped.extras, extras);
    }
    if (status === 'banned') {
      mapped.status = 'banned';
      mapped.extras.adminNote = extras?.adminNote || 'Panel tarafından işaretlendi';
    } else if (status) {
      mapped.status = status;
    }

    res.status(200).json(panelItemResponse(mapped));
  } catch (error) {
    console.error('[Panel] patch user error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Kullanıcı güncellenemedi.' });
  }
};

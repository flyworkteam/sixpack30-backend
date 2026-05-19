import path from 'path';
import { uploadBufferToCdn, contentTypeFromExtension } from '../utils/storage.js';
import { getCdnUrl } from '../utils/cdn.js';

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

function extFromMime(mime, fallback = '.bin') {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
  };
  return map[mime] || fallback;
}

function validateFile(file, { allowedMimes, maxBytes, label }) {
  if (!file) return null;
  if (!allowedMimes.has(file.mimetype)) {
    throw new Error(`${label}: desteklenmeyen dosya türü (${file.mimetype}).`);
  }
  if (file.size > maxBytes) {
    throw new Error(`${label}: dosya boyutu limiti aşıldı.`);
  }
  return file;
}

function buildRemotePath(workoutId, kind, ext) {
  const safeExt = ext.startsWith('.') ? ext : `.${ext}`;
  const stamp = Date.now();
  return `exercises/${workoutId}/${kind}_${stamp}${safeExt}`;
}

async function uploadFile(file, workoutId, kind) {
  const ext =
    path.extname(file.originalname || '') ||
    extFromMime(file.mimetype, kind === 'cover' ? '.jpg' : '.mp4');
  const remotePath = buildRemotePath(workoutId, kind, ext);
  const contentType =
    file.mimetype || contentTypeFromExtension(ext);

  await uploadBufferToCdn(file.buffer, remotePath, contentType);
  return remotePath;
}

/**
 * Multer files → { imagePath?, videoPath? }
 */
export async function uploadWorkoutMediaFiles(files, workoutId) {
  const result = {};
  const cover = validateFile(files?.coverImage?.[0], {
    allowedMimes: IMAGE_MIME,
    maxBytes: MAX_IMAGE_BYTES,
    label: 'Kapak görseli',
  });
  const video = validateFile(files?.video?.[0], {
    allowedMimes: VIDEO_MIME,
    maxBytes: MAX_VIDEO_BYTES,
    label: 'Video',
  });

  if (cover) {
    result.imagePath = await uploadFile(cover, workoutId, 'cover');
  }
  if (video) {
    result.videoPath = await uploadFile(video, workoutId, 'video');
  }

  return result;
}

export function mediaUrlsFromPaths(imagePath, videoPath) {
  return {
    coverImageUrl: imagePath ? getCdnUrl(imagePath) : null,
    videoUrl: videoPath ? getCdnUrl(videoPath) : null,
  };
}

/**
 * multipart/form-data alanlarını JSON body formatına çevirir.
 */
export function parseWorkoutFormBody(body = {}) {
  const parsed = { ...body };

  if (typeof parsed.durationMinutes === 'string' && parsed.durationMinutes !== '') {
    parsed.durationMinutes = Number(parsed.durationMinutes);
  }
  if (typeof parsed.isPremium === 'string') {
    parsed.isPremium = parsed.isPremium === 'true';
  }
  if (typeof parsed.extras === 'string' && parsed.extras.trim()) {
    try {
      parsed.extras = JSON.parse(parsed.extras);
    } catch {
      parsed.extras = {};
    }
  }

  return parsed;
}

export function isMultipartWorkoutRequest(req) {
  const contentType = req.headers['content-type'] || '';
  return contentType.includes('multipart/form-data');
}

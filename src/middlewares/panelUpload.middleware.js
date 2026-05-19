import multer from 'multer';
import { panelError } from '../panel/utils.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024,
    files: 2,
  },
});

const workoutFields = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

export function panelWorkoutUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  workoutFields(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return panelError(res, 400, 'BAD_REQUEST', 'Dosya boyutu çok büyük (max 150MB video).');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return panelError(
        res,
        400,
        'BAD_REQUEST',
        'Beklenmeyen dosya alanı. Kullanın: coverImage, video.'
      );
    }
    return panelError(res, 400, 'BAD_REQUEST', err.message || 'Dosya yükleme hatası.');
  });
}

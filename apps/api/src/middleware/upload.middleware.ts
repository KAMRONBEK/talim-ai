import multer from 'multer';
import { env } from '../config/env.js';

const storage = multer.memoryStorage();

/**
 * Hard cap on upload size (MB). Keep in sync with nginx `client_max_body_size`.
 * Sits below the paid-plan `maxFileSizeMb` (300–500) so the per-plan check stays
 * the meaningful gate; kept at 120 because multer buffers the whole file in memory
 * and the API container is memory-limited (raising further needs disk streaming).
 */
export const UPLOAD_MAX_MB = 120;

export const upload = multer({
  storage,
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and slide files are allowed'));
    }
  },
});

export const uploadDir = env.UPLOAD_DIR;

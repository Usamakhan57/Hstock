import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ensureUploadDirectories } from '../config/uploads.js';
import { AppError } from '../utils/AppError.js';

ensureUploadDirectories();

function createStorage(subdir = 'temp') {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      const dest = path.join(env.uploadPath, subdir);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename(_req, file, cb) {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  });
}

/**
 * Upload middleware placeholder using local disk storage.
 * Business upload endpoints are not exposed in Phase 1.
 */
export function createUploadMiddleware({
  subdir = 'temp',
  fieldName = 'file',
  maxCount = 1,
} = {}) {
  const upload = multer({
    storage: createStorage(subdir),
    limits: {
      fileSize: env.uploadMaxFileSizeBytes,
    },
    fileFilter(_req, file, cb) {
      if (!file) {
        cb(new AppError('No file provided', 400, { code: 'NO_FILE' }));
        return;
      }
      cb(null, true);
    },
  });

  return maxCount > 1 ? upload.array(fieldName, maxCount) : upload.single(fieldName);
}

export const uploadSingleTemp = createUploadMiddleware({
  subdir: 'temp',
  fieldName: 'file',
  maxCount: 1,
});

export default {
  createUploadMiddleware,
  uploadSingleTemp,
};

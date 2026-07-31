import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ensureUploadDirectories } from '../config/uploads.js';
import { AppError } from '../utils/AppError.js';

ensureUploadDirectories();

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.txt',
  '.zip',
]);

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
 * Local disk upload middleware with MIME + extension allowlist.
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
      const ext = path.extname(file.originalname || '').toLowerCase();
      const mimeOk = ALLOWED_MIME.has(String(file.mimetype || '').toLowerCase());
      const extOk = ALLOWED_EXT.has(ext);
      if (!mimeOk || !extOk) {
        cb(new AppError('Unsupported file type', 400, {
          code: 'INVALID_FILE_TYPE',
          details: { mimetype: file.mimetype, extension: ext },
        }));
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
  ALLOWED_MIME,
  ALLOWED_EXT,
};

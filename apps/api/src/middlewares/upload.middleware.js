import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ensureUploadDirectories } from '../config/uploads.js';
import { AppError } from '../utils/AppError.js';
import {
  IMAGE_INVALID_TYPE_MESSAGE,
  IMAGE_TOO_LARGE_MESSAGE,
  IMAGE_UPLOAD_EXTENSIONS,
  IMAGE_UPLOAD_MIME_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
} from '../constants/uploads.js';

ensureUploadDirectories();

const ALLOWED_MIME = new Set([
  ...IMAGE_UPLOAD_MIME_TYPES,
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);

const ALLOWED_EXT = new Set([
  ...IMAGE_UPLOAD_EXTENSIONS,
  '.gif',
  '.pdf',
  '.txt',
  '.zip',
]);

const IMAGE_MIME = new Set(IMAGE_UPLOAD_MIME_TYPES);
const IMAGE_EXT = new Set(IMAGE_UPLOAD_EXTENSIONS);

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

function normalizeMime(mimetype = '') {
  const mime = String(mimetype || '').toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
  return mime;
}

/**
 * Local disk upload middleware with MIME + extension allowlist.
 */
export function createUploadMiddleware({
  subdir = 'temp',
  fieldName = 'file',
  maxCount = 1,
  allowedMime = ALLOWED_MIME,
  allowedExt = ALLOWED_EXT,
  maxFileSizeBytes = env.uploadMaxFileSizeBytes,
  invalidTypeMessage = 'Unsupported file type',
  tooLargeMessage = IMAGE_TOO_LARGE_MESSAGE,
} = {}) {
  const upload = multer({
    storage: createStorage(subdir),
    limits: {
      fileSize: maxFileSizeBytes,
    },
    fileFilter(_req, file, cb) {
      if (!file) {
        cb(new AppError('No file provided', 400, { code: 'NO_FILE' }));
        return;
      }
      const ext = path.extname(file.originalname || '').toLowerCase();
      const mime = normalizeMime(file.mimetype);
      const mimeOk = allowedMime.has(mime) || allowedMime.has(String(file.mimetype || '').toLowerCase());
      const extOk = allowedExt.has(ext);
      if (!mimeOk || !extOk) {
        cb(new AppError(invalidTypeMessage, 400, {
          code: 'INVALID_FILE_TYPE',
          details: { mimetype: file.mimetype, extension: ext },
        }));
        return;
      }
      cb(null, true);
    },
  });

  const middleware = maxCount > 1
    ? upload.array(fieldName, maxCount)
    : upload.single(fieldName);

  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new AppError(tooLargeMessage, 413, {
            code: 'FILE_TOO_LARGE',
            details: { maxBytes: maxFileSizeBytes },
          }));
          return;
        }
        next(new AppError(err.message || 'Upload failed', 400, {
          code: err.code || 'UPLOAD_ERROR',
        }));
        return;
      }
      next(err);
    });
  };
}

/** Product / media images: JPG, PNG, WEBP up to 25 MB. */
export function createImageUploadMiddleware(options = {}) {
  return createUploadMiddleware({
    subdir: 'products',
    fieldName: 'file',
    maxCount: 1,
    allowedMime: IMAGE_MIME,
    allowedExt: IMAGE_EXT,
    maxFileSizeBytes: Math.max(env.uploadMaxFileSizeBytes, MAX_IMAGE_UPLOAD_BYTES),
    invalidTypeMessage: IMAGE_INVALID_TYPE_MESSAGE,
    tooLargeMessage: IMAGE_TOO_LARGE_MESSAGE,
    ...options,
  });
}

export const uploadSingleTemp = createUploadMiddleware({
  subdir: 'temp',
  fieldName: 'file',
  maxCount: 1,
});

export default {
  createUploadMiddleware,
  createImageUploadMiddleware,
  uploadSingleTemp,
  ALLOWED_MIME,
  ALLOWED_EXT,
};

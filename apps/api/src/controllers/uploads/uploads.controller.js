import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

function publicUploadUrl(subdir, filename) {
  const base = String(env.APP_URL || env.FRONTEND_URL || '').replace(/\/$/, '');
  const relative = `/uploads/${subdir}/${filename}`;
  // Prefer absolute URL when APP_URL is configured; relative still works via nginx.
  return base ? `${base}${relative}` : relative;
}

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400, { code: 'NO_FILE' });
  }

  const subdir = 'products';
  const url = publicUploadUrl(subdir, req.file.filename);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Image uploaded',
    data: {
      url,
      path: `/uploads/${subdir}/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    },
  });
});

export default {
  uploadProductImage,
};

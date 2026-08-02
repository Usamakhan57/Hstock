/**
 * Product/media image upload helpers.
 * Validates JPG/PNG/WEBP ≤ 25 MB, then POSTs multipart to /uploads/images.
 */
import apiClient from './apiClient';
import { ApiError, normalizeApiError } from './apiErrors';

export const MAX_IMAGE_UPLOAD_MB = 25;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function extensionOf(name = '') {
  const idx = String(name).lastIndexOf('.');
  return idx >= 0 ? String(name).slice(idx).toLowerCase() : '';
}

function normalizeMime(type = '') {
  const mime = String(type || '').toLowerCase();
  return mime === 'image/jpg' ? 'image/jpeg' : mime;
}

export function validateImageFile(file) {
  if (!file) {
    throw new ApiError('Please choose an image to upload.', {
      status: 400,
      code: 'NO_FILE',
    });
  }

  const mime = normalizeMime(file.type);
  const ext = extensionOf(file.name);
  const mimeOk = ALLOWED_IMAGE_MIME_TYPES.includes(mime);
  const extOk = !ext || ALLOWED_EXT.has(ext);

  if (!mimeOk || !extOk) {
    throw new ApiError('Only JPG, PNG, and WEBP images are allowed.', {
      status: 400,
      code: 'INVALID_FILE_TYPE',
    });
  }

  if (Number(file.size || 0) > MAX_IMAGE_UPLOAD_BYTES) {
    throw new ApiError(`Image is too large. Maximum allowed size is ${MAX_IMAGE_UPLOAD_MB} MB.`, {
      status: 413,
      code: 'FILE_TOO_LARGE',
    });
  }

  return true;
}

/**
 * Upload a single product image via multipart.
 * @returns {Promise<{ url: string, path?: string, size?: number, mimetype?: string }>}
 */
export async function uploadProductImage(file) {
  validateImageFile(file);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/uploads/images', formData, {
      // Let the browser/axios set multipart boundary.
      headers: { 'Content-Type': undefined },
      maxBodyLength: MAX_IMAGE_UPLOAD_BYTES * 2,
      maxContentLength: MAX_IMAGE_UPLOAD_BYTES * 2,
    });
    const body = response.data;
    if (body && typeof body === 'object' && body.success === false) {
      throw new ApiError(body.message || 'Upload failed', {
        status: response.status,
        code: body.code || 'UPLOAD_FAILED',
        errors: body.errors,
        data: body.data,
      });
    }
    const data = body?.data || body;
    if (!data?.url && !data?.path) {
      throw new ApiError('Upload failed. No image URL returned.', {
        status: 500,
        code: 'UPLOAD_FAILED',
      });
    }
    return {
      url: data.url || data.path,
      path: data.path || data.url,
      size: data.size,
      mimetype: data.mimetype,
      filename: data.filename,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw normalizeApiError(error);
  }
}

export default {
  MAX_IMAGE_UPLOAD_MB,
  MAX_IMAGE_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  validateImageFile,
  uploadProductImage,
};

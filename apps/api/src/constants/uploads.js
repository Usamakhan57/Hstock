/** Shared upload limits and image MIME allowlist. */

export const MAX_IMAGE_UPLOAD_MB = 25;
export const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const IMAGE_UPLOAD_EXTENSIONS = Object.freeze([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export const IMAGE_TOO_LARGE_MESSAGE = `Image is too large. Maximum allowed size is ${MAX_IMAGE_UPLOAD_MB} MB.`;
export const IMAGE_INVALID_TYPE_MESSAGE = 'Only JPG, PNG, and WEBP images are allowed.';

export default {
  MAX_IMAGE_UPLOAD_MB,
  MAX_IMAGE_UPLOAD_BYTES,
  IMAGE_UPLOAD_MIME_TYPES,
  IMAGE_UPLOAD_EXTENSIONS,
  IMAGE_TOO_LARGE_MESSAGE,
  IMAGE_INVALID_TYPE_MESSAGE,
};

import { describe, expect, it } from 'vitest';
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_MB,
  validateImageFile,
} from './imageUpload';

function fakeFile({ name, type, size }) {
  return { name, type, size };
}

describe('imageUpload validation', () => {
  it('accepts jpg/png/webp under the 25 MB limit', () => {
    expect(() => validateImageFile(fakeFile({
      name: 'a.jpg',
      type: 'image/jpeg',
      size: 5 * 1024 * 1024,
    }))).not.toThrow();
    expect(() => validateImageFile(fakeFile({
      name: 'b.png',
      type: 'image/png',
      size: 24 * 1024 * 1024,
    }))).not.toThrow();
    expect(() => validateImageFile(fakeFile({
      name: 'c.webp',
      type: 'image/webp',
      size: MAX_IMAGE_UPLOAD_BYTES,
    }))).not.toThrow();
  });

  it('rejects oversized images with a friendly message', () => {
    expect(() => validateImageFile(fakeFile({
      name: 'big.jpg',
      type: 'image/jpeg',
      size: MAX_IMAGE_UPLOAD_BYTES + 1,
    }))).toThrow(new RegExp(`${MAX_IMAGE_UPLOAD_MB} MB`, 'i'));
  });

  it('rejects unsupported types', () => {
    expect(() => validateImageFile(fakeFile({
      name: 'x.gif',
      type: 'image/gif',
      size: 1024,
    }))).toThrow(/JPG|PNG|WEBP/i);
  });
});

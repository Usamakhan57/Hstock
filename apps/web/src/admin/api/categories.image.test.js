import { beforeEach, describe, expect, it, vi } from 'vitest';

const uploadProductImage = vi.fn(async () => ({
  url: 'https://cdn.example.com/uploads/category-abc.webp',
  path: '/uploads/category-abc.webp',
}));

vi.mock('../../lib/imageUpload', () => ({
  uploadProductImage: (...args) => uploadProductImage(...args),
}));

vi.mock('../../lib/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../../services/catalogCache', () => ({
  hydrateCatalog: vi.fn(async () => ({})),
}));

vi.mock('../../services/categoryTree', () => ({
  getDescendants: vi.fn(() => []),
}));

vi.mock('./adminMappers', () => ({
  fetchAllPages: vi.fn(async () => []),
  idOf: (value) => value?._id || value?.id || value || null,
}));

const {
  prepareCategoryApiBody,
  resolveCategoryImageRef,
  toApiBody,
} = await import('./categories.js');

describe('category image payload normalization', () => {
  beforeEach(() => {
    uploadProductImage.mockClear();
  });

  it('keeps existing http(s) URLs without uploading', async () => {
    const url = 'https://placehold.co/600x400/png';
    const body = await prepareCategoryApiBody(
      { name: 'Accounts', description: 'Only desc', image: url, ogImage: '' },
      { previous: { image: url, ogImage: '' } },
    );
    expect(body.image).toBe(url);
    expect(body.ogImage).toBeNull();
    expect(uploadProductImage).not.toHaveBeenCalled();
    expect(String(body.image).length).toBeLessThan(4000);
    expect(String(body.image).startsWith('data:')).toBe(false);
  });

  it('uploads data-URL images and sends only the returned URL', async () => {
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    // Simulate the media-library base64 payload (well over Zod's 4000 cap).
    const hugeDataUrl = `data:image/png;base64,${'iVBORw0KGgo'.repeat(500)}`;

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: async () => new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
    });

    try {
      expect(hugeDataUrl.length).toBeGreaterThan(4000);
      expect(tinyPng.startsWith('data:')).toBe(true);

      const body = await prepareCategoryApiBody({
        name: 'Accounts',
        image: hugeDataUrl,
      });

      expect(uploadProductImage).toHaveBeenCalledTimes(1);
      expect(body.image).toBe('https://cdn.example.com/uploads/category-abc.webp');
      expect(String(body.image).length).toBeLessThan(4000);
      expect(String(body.image).startsWith('data:')).toBe(false);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('accepts relative /uploads paths', async () => {
    const path = '/uploads/categories/facebook.png';
    expect(await resolveCategoryImageRef(path)).toBe(path);
    expect(uploadProductImage).not.toHaveBeenCalled();
  });

  it('unwraps upload metadata objects to a URL', async () => {
    const resolved = await resolveCategoryImageRef({
      url: 'https://cdn.example.com/x.png',
      size: 12,
      mimetype: 'image/png',
    });
    expect(resolved).toBe('https://cdn.example.com/x.png');
  });

  it('rejects non-URL objects without a url string', async () => {
    await expect(resolveCategoryImageRef({ foo: 1 })).rejects.toThrow(/URL string/i);
  });

  it('toApiBody never embeds objects into image', () => {
    const body = toApiBody({
      name: 'X',
      image: 'https://cdn.example.com/ok.png',
      ogImage: '',
    });
    expect(body.image).toBe('https://cdn.example.com/ok.png');
    expect(body.ogImage).toBeNull();
  });
});

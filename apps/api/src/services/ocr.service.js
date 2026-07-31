/**
 * Image OCR for dispute evidence screenshots.
 * Uses tesseract.js by default; tests may inject a mock via setOcrImplementation.
 */

import { createWorker } from 'tesseract.js';
import { logger } from '../config/logger.js';
import { assertSafeRemoteImageUrl } from '../utils/urlSafety.js';

const FETCH_TIMEOUT_MS = 15_000;

/** @type {null | ((source: { url?: string, buffer?: Buffer }) => Promise<{ text: string, confidence?: number|null }>)} */
let customOcrImpl = null;

let workerPromise = null;

export function setOcrImplementation(fn) {
  customOcrImpl = typeof fn === 'function' ? fn : null;
}

export function resetOcrImplementation() {
  customOcrImpl = null;
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng');
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function fetchImageBuffer(url) {
  const safeUrl = await assertSafeRemoteImageUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(safeUrl, {
      signal: controller.signal,
      redirect: 'manual',
      headers: { Accept: 'image/*,application/octet-stream' },
    });
    if (response.status >= 300 && response.status < 400) {
      throw new Error('Redirects are not allowed for OCR image fetch');
    }
    if (!response.ok) {
      throw new Error(`OCR image fetch failed with status ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
      throw new Error('OCR source is not an image');
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 15 * 1024 * 1024) {
      throw new Error('OCR image exceeds size limit');
    }
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timer);
  }
}

async function defaultTesseractOcr({ url, buffer } = {}) {
  let image = buffer;
  if (!image && url) {
    image = await fetchImageBuffer(url);
  }
  if (!image) {
    throw new Error('No image data provided for OCR');
  }

  const worker = await getWorker();
  const result = await worker.recognize(image);
  return {
    text: result?.data?.text || '',
    confidence: typeof result?.data?.confidence === 'number'
      ? result.data.confidence
      : null,
  };
}

/**
 * Extract text from an image URL or buffer.
 * @returns {Promise<{ text: string, confidence: number|null, skipped?: boolean, error?: string }>}
 */
export async function extractTextFromImage(source = {}) {
  try {
    const impl = customOcrImpl || defaultTesseractOcr;
    const result = await impl(source);
    return {
      text: String(result?.text || ''),
      confidence: result?.confidence ?? null,
    };
  } catch (error) {
    logger.warn('OCR extraction failed', {
      message: error.message,
      url: source.url || null,
    });
    return {
      text: '',
      confidence: null,
      skipped: false,
      error: error.message,
    };
  }
}

export async function shutdownOcrWorker() {
  if (workerPromise) {
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch {
      // ignore
    }
    workerPromise = null;
  }
}

export default {
  extractTextFromImage,
  setOcrImplementation,
  resetOcrImplementation,
  shutdownOcrWorker,
};

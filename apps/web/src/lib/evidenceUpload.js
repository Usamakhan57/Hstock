/**
 * Client-side evidence helpers.
 * Backend accepts evidence/attachment URL arrays (no dedicated media upload route yet).
 * Files are read as data URLs with progress callbacks for UX.
 */

export function isUsableEvidenceUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://')
    || url.startsWith('https://')
    || url.startsWith('data:');
}

export function readFileAsDataUrl(file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    reader.onload = () => {
      if (typeof onProgress === 'function') onProgress(100);
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => reject(new Error('Upload failed. Please try another file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadEvidenceFiles(files, { onItemProgress } = {}) {
  const list = Array.from(files || []);
  const results = [];
  for (let i = 0; i < list.length; i += 1) {
    const file = list[i];
    try {
      const url = await readFileAsDataUrl(file, {
        onProgress: (pct) => onItemProgress?.(i, pct, file),
      });
      if (!isUsableEvidenceUrl(url)) {
        throw new Error('Could not prepare file for upload.');
      }
      results.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${i}`,
        url,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: url,
        ocrFlagged: false,
      });
    } catch (error) {
      results.push({
        id: `${file.name}-error-${i}`,
        error: error.message || 'Upload failed',
        name: file.name,
      });
    }
  }
  return results;
}

export default {
  isUsableEvidenceUrl,
  readFileAsDataUrl,
  uploadEvidenceFiles,
};

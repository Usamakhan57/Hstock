import fs from 'node:fs';
import path from 'node:path';
import { env } from './env.js';

export const uploadSubdirs = ['products', 'avatars', 'documents', 'temp'];

export function ensureUploadDirectories() {
  fs.mkdirSync(env.uploadPath, { recursive: true });
  for (const subdir of uploadSubdirs) {
    fs.mkdirSync(path.join(env.uploadPath, subdir), { recursive: true });
  }
}

export const uploadConfig = {
  root: env.uploadPath,
  maxFileSizeBytes: env.uploadMaxFileSizeBytes,
  subdirs: uploadSubdirs,
};

export default uploadConfig;

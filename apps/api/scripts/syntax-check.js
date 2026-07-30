import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules',
  'logs',
  'uploads',
  'coverage',
  'dist',
  '.git',
  '.cache',
]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith('.js') || entry.endsWith('.cjs') || entry.endsWith('.mjs')) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(apiRoot);
let failed = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    failed += 1;
    process.stderr.write(`FAIL ${path.relative(apiRoot, file)}\n`);
    process.stderr.write(result.stderr || result.stdout || '');
  } else {
    process.stdout.write(`OK   ${path.relative(apiRoot, file)}\n`);
  }
}

if (failed > 0) {
  process.stderr.write(`\nSyntax check failed: ${failed}/${files.length} files\n`);
  process.exit(1);
}

process.stdout.write(`\nSyntax check passed: ${files.length} files\n`);

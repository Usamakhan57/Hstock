import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const artifactPath = resolve(process.cwd(), 'dist/apps/web/.llm-manifest.json');
const manifest = {
  generatedAt: new Date().toISOString(),
  app: 'ApnaStore',
  status: 'generated',
  entries: [
    { name: 'frontend', type: 'vite-react' },
    { name: 'marketplace', type: 'enterprise-storefront' },
  ],
};

mkdirSync(dirname(artifactPath), { recursive: true });
writeFileSync(artifactPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

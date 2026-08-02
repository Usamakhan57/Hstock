import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMarketplaceCategorySeedRows,
  MARKETPLACE_SERVICE_GROUPS,
} from '../../src/data/marketplaceCategories.js';

test('seed rows include required marketplace services without duplicate slugs', () => {
  const rows = buildMarketplaceCategorySeedRows();
  const slugs = rows.map((r) => r.slug);
  assert.equal(new Set(slugs).size, slugs.length);

  const names = new Set(rows.map((r) => r.name));
  for (const required of [
    'Social Accounts',
    'Instagram Accounts',
    'Gmail Accounts',
    'Netflix',
    'Steam',
    'Canva',
    'Domains',
    'VPN',
    'SaaS',
    'AI Tools',
    'Other Digital Assets',
  ]) {
    assert.equal(names.has(required), true, `missing ${required}`);
  }
});

test('every seeded service is homepage-ready and active', () => {
  const rows = buildMarketplaceCategorySeedRows();
  assert.ok(rows.length > MARKETPLACE_SERVICE_GROUPS.length);
  for (const row of rows) {
    assert.equal(row.status, 'active');
    assert.equal(row.showOnHomepage, true);
    assert.ok(row.slug);
    assert.ok(row.icon);
  }
});

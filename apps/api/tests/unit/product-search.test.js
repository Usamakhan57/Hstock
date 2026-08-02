import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeSearchQuery,
  scoreProductAgainstTokens,
  sortProductsBySearchRelevance,
  buildTokenMatchClause,
} from '../../src/helpers/productSearch.helper.js';

test('tokenizeSearchQuery drops generic account words', () => {
  assert.deepEqual(tokenizeSearchQuery('Instagram account'), ['instagram']);
  assert.deepEqual(tokenizeSearchQuery('Gmail'), ['gmail']);
  assert.deepEqual(tokenizeSearchQuery('Facebook'), ['facebook']);
  assert.deepEqual(tokenizeSearchQuery('TikTok'), ['tiktok']);
});

test('tokenizeSearchQuery keeps category-style queries when all tokens are stop-like', () => {
  // "digital" / "assets" are intentionally searchable category terms
  assert.deepEqual(tokenizeSearchQuery('digital assets'), ['digital', 'assets']);
});

test('score prefers title and platform matches', () => {
  const gmail = { title: 'Old Gmail 2021-2024', assetPlatform: 'gmail', shortDescription: 'Aged Gmail' };
  const ig = { title: 'Instagram Aged Accounts', assetPlatform: 'instagram', shortDescription: 'IG profiles' };
  const tokens = tokenizeSearchQuery('Instagram account');
  assert.ok(scoreProductAgainstTokens(ig, tokens) > scoreProductAgainstTokens(gmail, tokens));
  assert.equal(scoreProductAgainstTokens(gmail, tokens), 0);
});

test('sortProductsBySearchRelevance ranks Instagram above Gmail for Instagram query', () => {
  const products = [
    { title: 'Old Gmail 2021-2024', assetPlatform: 'gmail', createdAt: '2026-01-02' },
    { title: 'Instagram Business', assetPlatform: 'instagram', createdAt: '2026-01-01' },
  ];
  const ranked = sortProductsBySearchRelevance(products, tokenizeSearchQuery('Instagram'));
  assert.equal(ranked[0].assetPlatform, 'instagram');
});

test('buildTokenMatchClause includes taxonomy ids', () => {
  const clause = buildTokenMatchClause('gmail', {
    categoryIds: ['c1'],
    tagIds: ['t1'],
  });
  assert.equal(clause.$or.length, 7);
  assert.deepEqual(clause.$or[5], { category: { $in: ['c1'] } });
  assert.deepEqual(clause.$or[6], { tags: { $in: ['t1'] } });
});

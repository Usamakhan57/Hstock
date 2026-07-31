import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAssetIdentifier } from '../../src/helpers/asset.helper.js';

test('normalizes email case and spaces', () => {
  assert.equal(
    normalizeAssetIdentifier('  AMANKHAN@gmail.com  ', { productType: 'email_accounts' }),
    'amankhan@gmail.com',
  );
  assert.equal(
    normalizeAssetIdentifier('AmanKhan@Gmail.com', { assetPlatform: 'email' }),
    normalizeAssetIdentifier('amankhan@gmail.com', { assetPlatform: 'email' }),
  );
});

test('normalizes instagram usernames and URLs', () => {
  assert.equal(
    normalizeAssetIdentifier('@AmanKhan', { productType: 'instagram' }),
    'instagram:amankhan',
  );
  assert.equal(
    normalizeAssetIdentifier('https://www.Instagram.com/AmanKhan/', {
      productType: 'social_accounts',
      assetPlatform: 'instagram',
    }),
    'instagram:amankhan',
  );
});

test('normalizes tiktok and telegram', () => {
  assert.equal(
    normalizeAssetIdentifier('@CoolCreator', { productType: 'tiktok' }),
    'tiktok:coolcreator',
  );
  assert.equal(
    normalizeAssetIdentifier('https://t.me/CoolCreator', { assetPlatform: 'telegram' }),
    'telegram:coolcreator',
  );
});

test('normalizes domains and websites', () => {
  assert.equal(
    normalizeAssetIdentifier('HTTPS://WWW.Example.com/', { productType: 'domains' }),
    'domain:example.com',
  );
  assert.equal(
    normalizeAssetIdentifier('https://www.example.com/shop/', { productType: 'websites' }),
    'url:example.com/shop',
  );
  assert.equal(
    normalizeAssetIdentifier('example.com/shop///', { productType: 'websites' }),
    'url:example.com/shop',
  );
});

test('collapses spaces and strips trailing slashes for generic assets', () => {
  assert.equal(
    normalizeAssetIdentifier('  My   Repo   Name/  ', { productType: 'source_code' }),
    'my repo name',
  );
});

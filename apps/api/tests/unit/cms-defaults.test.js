import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CMS_KEYS,
  CMS_DEFAULTS,
  CMS_KEY_LIST,
  DEFAULT_POPULAR_TAGS,
  DEFAULT_CONTACT,
} from '../../src/constants/cmsDefaults.js';

describe('cms defaults', () => {
  it('defines marketplace-relevant popular tags in the required order', () => {
    const labels = DEFAULT_POPULAR_TAGS.tags.map((t) => t.label);
    assert.deepEqual(labels, [
      'Gmail Accounts',
      'Instagram Accounts',
      'Yahoo Accounts',
      'Facebook Accounts',
      'TikTok Accounts',
      'Twitter/X Accounts',
      'Discord Accounts',
      'Business Email',
    ]);
    assert.equal(labels.includes('Adobe'), false);
    assert.equal(labels.includes('AI Tools'), false);
    assert.equal(labels.includes('AOL Accounts'), false);
    DEFAULT_POPULAR_TAGS.tags.forEach((tag, index) => {
      assert.equal(tag.enabled, true);
      assert.equal(tag.sortOrder, index + 1);
      assert.ok(tag.url.startsWith('/'));
      assert.ok(tag.id);
      assert.ok(tag.label);
    });
  });

  it('includes full contact CMS fields for the storefront', () => {
    const required = [
      'email',
      'phone',
      'whatsapp',
      'office',
      'address',
      'businessHours',
      'googleMapsUrl',
      'formTitle',
      'formDescription',
      'supportHours',
    ];
    for (const key of required) {
      assert.ok(key in DEFAULT_CONTACT, `missing ${key}`);
    }
    assert.ok(Array.isArray(DEFAULT_CONTACT.businessHours));
    assert.ok(DEFAULT_CONTACT.businessHours.length > 0);
  });

  it('registers every CMS key with a default payload', () => {
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.POPULAR_TAGS));
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.CONTACT));
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.FOOTER));
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.HOMEPAGE));
    for (const key of CMS_KEY_LIST) {
      assert.equal(typeof CMS_DEFAULTS[key], 'object');
      assert.ok(CMS_DEFAULTS[key]);
    }
  });
});

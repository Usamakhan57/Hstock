import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CMS_KEYS,
  CMS_DEFAULTS,
  CMS_KEY_LIST,
  PUBLIC_CMS_KEYS,
  ADMIN_ONLY_CMS_KEYS,
  DEFAULT_POPULAR_TAGS,
  DEFAULT_CONTACT,
} from '../../src/constants/cmsDefaults.js';
import { sanitizeCmsDataForPublic } from '../../src/services/cms.sanitize.js';

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
  });

  it('includes full contact CMS fields without placeholder phone numbers', () => {
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
    assert.equal(DEFAULT_CONTACT.phone, '');
    assert.equal(DEFAULT_CONTACT.office, '');
    assert.ok(!String(DEFAULT_CONTACT.office).includes('Remote-first'));
  });

  it('registers every CMS key including banners', () => {
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.POPULAR_TAGS));
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.BANNERS));
    assert.ok(CMS_KEY_LIST.includes(CMS_KEYS.EMAIL_TEMPLATES));
    for (const key of CMS_KEY_LIST) {
      assert.equal(typeof CMS_DEFAULTS[key], 'object');
      assert.ok(CMS_DEFAULTS[key]);
    }
  });

  it('keeps email_templates admin-only and out of public keys', () => {
    assert.ok(ADMIN_ONLY_CMS_KEYS.includes(CMS_KEYS.EMAIL_TEMPLATES));
    assert.equal(PUBLIC_CMS_KEYS.includes(CMS_KEYS.EMAIL_TEMPLATES), false);
    assert.ok(PUBLIC_CMS_KEYS.includes(CMS_KEYS.HOMEPAGE));
    assert.ok(PUBLIC_CMS_KEYS.includes(CMS_KEYS.BANNERS));
  });
});

describe('cms public sanitization', () => {
  it('strips draft FAQs, static pages, hero slides and disabled popups', () => {
    const faqs = sanitizeCmsDataForPublic(CMS_KEYS.FAQS, {
      items: [
        { id: '1', question: 'Published?', status: 'published' },
        { id: '2', question: 'Draft?', status: 'draft' },
      ],
    });
    assert.equal(faqs.items.length, 1);
    assert.equal(faqs.items[0].id, '1');

    const pages = sanitizeCmsDataForPublic(CMS_KEYS.STATIC_PAGES, {
      items: [
        { id: 'p1', slug: 'about', status: 'published' },
        { id: 'p2', slug: 'secret', status: 'draft' },
      ],
    });
    assert.equal(pages.items.length, 1);

    const slides = sanitizeCmsDataForPublic(CMS_KEYS.HERO_SLIDES, {
      items: [
        { id: 's1', status: 'active' },
        { id: 's2', status: 'draft' },
      ],
    });
    assert.equal(slides.items.length, 1);

    const popups = sanitizeCmsDataForPublic(CMS_KEYS.POPUPS, {
      items: [
        { id: 'pop1', enabled: true, headline: 'On' },
        { id: 'pop2', enabled: false, headline: 'Off' },
      ],
    });
    assert.equal(popups.items.length, 1);
    assert.equal(popups.items[0].id, 'pop1');
  });

  it('returns null for email_templates on public sanitize', () => {
    assert.equal(sanitizeCmsDataForPublic(CMS_KEYS.EMAIL_TEMPLATES, { items: [] }), null);
  });
});

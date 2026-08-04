import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const { User } = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { CMS_KEYS } = await import('../../src/constants/cmsDefaults.js');
const { invalidateCmsCache } = await import('../../src/services/cms.service.js');

async function createAdminToken(email = 'cms-admin@example.com') {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'CMS Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });

  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });

  assert.equal(login.status, 200, JSON.stringify(login.body));
  return login.body.data.accessToken;
}

before(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await resetDb();
  invalidateCmsCache();
});

after(async () => {
  await teardownTestDb();
});

test('public CMS never exposes email_templates or draft list items', async () => {
  const adminToken = await createAdminToken();

  await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.FAQS}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        items: [
          { id: 'faq-pub', question: 'Public Q', answer: 'A', status: 'published', sortOrder: 1 },
          { id: 'faq-draft', question: 'Secret Q', answer: 'Secret A', status: 'draft', sortOrder: 2 },
        ],
      },
    });

  await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.HERO_SLIDES}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        items: [
          { id: 'slide-live', title: 'Live', status: 'active', sortOrder: 1 },
          { id: 'slide-draft', title: 'Draft', status: 'draft', sortOrder: 2 },
        ],
      },
    });

  const denied = await request(app).get(`/api/v1/cms/${CMS_KEYS.EMAIL_TEMPLATES}`);
  assert.equal(denied.status, 401);

  const bundle = await request(app).get('/api/v1/cms');
  assert.equal(bundle.status, 200);
  assert.equal(bundle.body.data[CMS_KEYS.EMAIL_TEMPLATES], undefined);

  const faqs = await request(app).get(`/api/v1/cms/${CMS_KEYS.FAQS}`);
  assert.equal(faqs.status, 200);
  const faqIds = (faqs.body.data.data.items || []).map((i) => i.id);
  assert.deepEqual(faqIds, ['faq-pub']);

  const slides = await request(app).get(`/api/v1/cms/${CMS_KEYS.HERO_SLIDES}`);
  assert.equal(slides.status, 200);
  const slideIds = (slides.body.data.data.items || []).map((i) => i.id);
  assert.deepEqual(slideIds, ['slide-live']);

  const adminFaqs = await request(app)
    .get(`/api/v1/cms/admin/${CMS_KEYS.FAQS}`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminFaqs.status, 200);
  assert.equal(adminFaqs.body.data.data.items.length, 2);
});

test('Admin Save → Mongo → public API → refresh → still works after cache clear', async () => {
  const adminToken = await createAdminToken('cms-flow@example.com');

  const save = await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.POPULAR_TAGS}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        tags: [
          { id: 'pt-gmail', label: 'Gmail Accounts', url: '/shop?search=Gmail', enabled: true, sortOrder: 1 },
          { id: 'pt-ig', label: 'Instagram Accounts', url: '/shop?search=Instagram', enabled: true, sortOrder: 2 },
        ],
      },
    });
  assert.equal(save.status, 200, JSON.stringify(save.body));
  assert.ok(save.body.data.version >= 1);

  const heroSave = await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.HOMEPAGE}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        sections: [
          {
            key: 'hero',
            type: 'hero',
            enabled: true,
            sortOrder: 1,
            title: 'Live Hero Title From Admin',
            subtitle: 'Live subtitle',
            description: 'Live description from Mongo',
            searchPlaceholder: 'Search live…',
            badgeText: 'Live badge',
            buttonText: 'Shop Live',
            buttonUrl: '/shop',
            secondaryButtonText: 'Sell Live',
            secondaryButtonUrl: '/become-a-seller',
            backgroundImage: '',
            trustItems: [{ id: 't1', label: 'Escrow Live' }],
          },
        ],
        stats: [{ id: 'stat-1', value: 42, suffix: '+', label: 'Live Stats' }],
        heroStats: [{ id: 'hs-1', value: '99+', label: 'Hero Stat', icon: 'star' }],
        whyFeatures: [{ id: 'why-1', icon: 'shield', title: 'Why Live', description: 'From CMS' }],
      },
    });
  assert.equal(heroSave.status, 200, JSON.stringify(heroSave.body));

  const publicTags = await request(app).get(`/api/v1/cms/${CMS_KEYS.POPULAR_TAGS}`);
  assert.equal(publicTags.status, 200);
  assert.equal(publicTags.body.data.data.tags[0].label, 'Gmail Accounts');
  assert.equal(publicTags.body.data.data.tags.some((t) => t.label === 'Adobe'), false);

  const publicHome = await request(app).get(`/api/v1/cms/${CMS_KEYS.HOMEPAGE}`);
  assert.equal(publicHome.status, 200);
  const hero = publicHome.body.data.data.sections.find((s) => s.key === 'hero');
  assert.equal(hero.title, 'Live Hero Title From Admin');
  assert.equal(hero.searchPlaceholder, 'Search live…');
  assert.equal(publicHome.body.data.data.stats[0].label, 'Live Stats');

  // Simulate second browser / server restart: clear memory cache, re-read.
  invalidateCmsCache();
  const afterRestart = await request(app).get(`/api/v1/cms/${CMS_KEYS.HOMEPAGE}`);
  assert.equal(afterRestart.body.data.data.sections.find((s) => s.key === 'hero').title, 'Live Hero Title From Admin');

  const versionsA = await request(app).get('/api/v1/cms/versions');
  assert.equal(versionsA.status, 200);
  const v1 = versionsA.body.data.versions[CMS_KEYS.HOMEPAGE].version;

  await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.HOMEPAGE}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        ...publicHome.body.data.data,
        sections: [
          {
            ...hero,
            title: 'Updated For Browser B',
          },
        ],
      },
    });

  const versionsB = await request(app).get('/api/v1/cms/versions');
  const v2 = versionsB.body.data.versions[CMS_KEYS.HOMEPAGE].version;
  assert.ok(v2 > v1);

  const browserB = await request(app).get(`/api/v1/cms/${CMS_KEYS.HOMEPAGE}`);
  assert.equal(browserB.body.data.data.sections.find((s) => s.key === 'hero').title, 'Updated For Browser B');
});

test('banners and social persist in Mongo via CMS', async () => {
  const adminToken = await createAdminToken('cms-banner@example.com');

  const bannerSave = await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.BANNERS}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        items: [
          {
            id: 'ban-live',
            title: 'Mongo Banner',
            position: 'homepage',
            status: 'active',
            link: '/shop',
            buttonText: 'Go',
          },
          {
            id: 'ban-draft',
            title: 'Hidden Banner',
            position: 'homepage',
            status: 'draft',
          },
        ],
      },
    });
  assert.equal(bannerSave.status, 200);

  const socialSave = await request(app)
    .put(`/api/v1/cms/${CMS_KEYS.SOCIAL}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      data: {
        instagram: 'https://instagram.com/apnastore-live',
        x: 'https://x.com/apnastore-live',
        facebook: '',
        youtube: '',
        tiktok: '',
        pinterest: '',
        linkedin: '',
        github: '',
      },
    });
  assert.equal(socialSave.status, 200);

  const publicBanners = await request(app).get(`/api/v1/cms/${CMS_KEYS.BANNERS}`);
  assert.equal(publicBanners.body.data.data.items.length, 1);
  assert.equal(publicBanners.body.data.data.items[0].title, 'Mongo Banner');

  const publicSocial = await request(app).get(`/api/v1/cms/${CMS_KEYS.SOCIAL}`);
  assert.equal(publicSocial.body.data.data.instagram, 'https://instagram.com/apnastore-live');
});

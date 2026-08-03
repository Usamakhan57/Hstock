import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { resetDb, setupTestDb, teardownTestDb } from '../helpers/setup.js';

const { default: app } = await import('../../src/app.js');
const {
  User,
  SellerProfile,
  DisputeChat,
  DisputeChatMessage,
  DisputeChatBlockedAttempt,
  DisputeChatViolation,
  DisputeChatAuditLog,
} = await import('../../src/models/index.js');
const { hashPassword } = await import('../../src/utils/password.js');
const { USER_ROLES } = await import('../../src/constants/roles.js');
const { CONTACT_FILTER_MESSAGE } = await import('../../src/constants/disputeChat.js');
const {
  setOcrImplementation,
  resetOcrImplementation,
} = await import('../../src/services/ocr.service.js');

async function createAdminToken(email = 'chat-admin@example.com') {
  await User.create({
    email,
    passwordHash: await hashPassword('Password123!'),
    name: 'Chat Admin',
    roles: [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN],
    emailVerified: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email, password: 'Password123!' });
  return login.body.data.accessToken;
}

async function createSeller(email = 'chat-seller@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/seller/register')
    .send({
      name: 'Chat Seller',
      email,
      password: 'Password123!',
      storeName: `Store ${email}`,
    });
  const sellerId = register.body.data.seller._id;
  await SellerProfile.findByIdAndUpdate(sellerId, { status: 'approved' });
  return { token: register.body.data.accessToken, sellerId };
}

async function createBuyer(email = 'chat-buyer@example.com') {
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Chat Buyer',
      email,
      password: 'Password123!',
      // Avoid sparse unique username:null collisions across multiple buyers
      username: `buyer_${email.split('@')[0].replace(/[^a-z0-9]/gi, '_')}`,
    });
  assert.equal(register.status, 201, JSON.stringify(register.body));
  return {
    token: register.body.data.accessToken,
    userId: register.body.data.user?._id || register.body.data.user?.id,
  };
}

async function createLiveProduct(adminToken, sellerToken) {
  const category = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Cat ${Date.now()}` });
  const product = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({
      title: 'Chat Product',
      description: 'Digital item',
      shortDescription: 'Item',
      price: 50,
      productType: 'license_keys',
      category: category.body.data._id,
      stock: 3,
      deliveryType: 'manual',
      digital: {
        downloadType: 'manual',
        automatic: false,
        manual: true,
        downloadUrl: 'https://files.example.com/key.txt',
        fileType: 'txt',
      },
    });
  await request(app)
    .post(`/api/v1/products/${product.body.data._id}/submit`)
    .set('Authorization', `Bearer ${sellerToken}`);
  await request(app)
    .post(`/api/v1/products/${product.body.data._id}/moderate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ approvalStatus: 'approved' });
  return product.body.data;
}

async function openPaidDispute() {
  const adminToken = await createAdminToken();
  const { token: sellerToken } = await createSeller();
  const { token: buyerToken } = await createBuyer();
  const product = await createLiveProduct(adminToken, sellerToken);

  const buy = await request(app)
    .post('/api/v1/orders/buy-now')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ productId: product._id });

  await request(app)
    .post(`/api/v1/payments/cryptomus/sandbox/${buy.body.data.cryptomus.uuid}`)
    .send({});

  const dispute = await request(app)
    .post('/api/v1/disputes')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({
      orderId: buy.body.data.order._id,
      reason: 'Delivery issue',
      description: 'The delivered license keys do not activate on my account.',
    });

  assert.equal(dispute.status, 201, JSON.stringify(dispute.body));
  return {
    adminToken,
    sellerToken,
    buyerToken,
    disputeId: dispute.body.data._id,
    orderId: buy.body.data.order._id,
    chatId: dispute.body.data.chat,
  };
}

before(async () => {
  await setupTestDb();
});

beforeEach(async () => {
  await resetDb();
  // Deterministic OCR for evidence screenshots (no network / tesseract in CI)
  setOcrImplementation(async ({ url } = {}) => {
    if (String(url).includes('with-contact')) {
      return {
        text: 'Contact support via WhatsApp +923001234567 or email recovery@gmail.com',
        confidence: 90,
      };
    }
    if (String(url).includes('login-failed') || String(url).includes('checkpoint')) {
      return {
        text: 'Login failed. Wrong password. Facebook checkpoint. Try again.',
        confidence: 88,
      };
    }
    return { text: 'Account settings dashboard', confidence: 85 };
  });
});

after(async () => {
  resetOcrImplementation();
  await teardownTestDb();
});

test('opening a dispute auto-creates a private secure chat', async () => {
  const ctx = await openPaidDispute();
  assert.ok(ctx.chatId);

  const chat = await DisputeChat.findById(ctx.chatId).lean();
  assert.ok(chat);
  assert.equal(String(chat.dispute), String(ctx.disputeId));
  assert.equal(chat.status, 'open');

  const messages = await DisputeChatMessage.find({ chat: chat._id }).lean();
  assert.ok(messages.length >= 2); // system + opening statement

  const audits = await DisputeChatAuditLog.find({
    action: 'chat_created',
    chat: chat._id,
  });
  assert.equal(audits.length, 1);
});

test('only buyer/seller/assigned admin can access chat', async () => {
  const ctx = await openPaidDispute();

  // Outsider buyer (different account, not a party to this dispute)
  const outsider = await createBuyer(`outsider-${Date.now()}@example.com`);
  const denied = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat`)
    .set('Authorization', `Bearer ${outsider.token}`);
  assert.equal(denied.status, 403);

  const buyerOk = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`);
  assert.equal(buyerOk.status, 200);

  const sellerOk = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat`)
    .set('Authorization', `Bearer ${ctx.sellerToken}`);
  assert.equal(sellerOk.status, 200);

  // Unassigned admin cannot access until assigned
  const otherAdmin = await User.create({
    email: 'other-admin@example.com',
    passwordHash: await hashPassword('Password123!'),
    name: 'Other Admin',
    roles: [USER_ROLES.ADMIN],
    emailVerified: true,
  });
  const otherLogin = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'other-admin@example.com', password: 'Password123!' });
  const unassigned = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat`)
    .set('Authorization', `Bearer ${otherLogin.body.data.accessToken}`);
  assert.equal(unassigned.status, 403);
  assert.ok(otherAdmin._id);

  const assign = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/assign`)
    .set('Authorization', `Bearer ${otherLogin.body.data.accessToken}`);
  assert.equal(assign.status, 200);

  const assignedOk = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat`)
    .set('Authorization', `Bearer ${otherLogin.body.data.accessToken}`);
  assert.equal(assignedOk.status, 200);
});

test('blocks contact info and does not save the message', async () => {
  const ctx = await openPaidDispute();
  const before = await DisputeChatMessage.countDocuments({
    chat: ctx.chatId,
    role: { $ne: 'system' },
  });

  const blocked = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'Message me on WhatsApp +923001234567' });

  assert.equal(blocked.status, 400);
  assert.equal(blocked.body.message, CONTACT_FILTER_MESSAGE);
  assert.equal(blocked.body.code, 'CONTACT_INFO_BLOCKED');

  const after = await DisputeChatMessage.countDocuments({
    chat: ctx.chatId,
    role: { $ne: 'system' },
  });
  assert.equal(after, before);

  const attempts = await DisputeChatBlockedAttempt.find({ chat: ctx.chatId });
  assert.equal(attempts.length, 1);
  assert.ok(attempts[0].originalMessage.includes('WhatsApp'));
  assert.ok(attempts[0].detectedRules.length >= 1);
  assert.ok(attempts[0].ip !== undefined);
});

test('blocks obfuscated telegram and email attempts', async () => {
  const ctx = await openPaidDispute();

  const tg = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/messages`)
    .set('Authorization', `Bearer ${ctx.sellerToken}`)
    .send({ body: 't e l e g r a m @cooluser' });
  assert.equal(tg.status, 400);

  const email = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'mail me aman @ gmail . com please' });
  assert.equal(email.status, 400);
});

test('allows clean messages and attachment allowlist', async () => {
  const ctx = await openPaidDispute();

  const ok = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({
      body: 'Here is a screenshot of the activation error.',
      attachments: ['https://cdn.example.com/evidence/screen.png'],
    });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));

  const exe = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({
      body: 'Please run this tool.',
      attachments: ['https://cdn.example.com/tool.exe'],
    });
  assert.equal(exe.status, 400);
  assert.equal(exe.body.code, 'ATTACHMENT_REJECTED');
});

test('account evidence screenshots are stored and never auto-blocked', async () => {
  const ctx = await openPaidDispute();

  const evidence = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({
      body: 'Screenshot of login failed and Facebook checkpoint.',
      attachments: [
        'https://cdn.example.com/evidence/login-failed.png',
        'https://cdn.example.com/evidence/checkpoint.png',
      ],
    });

  assert.equal(evidence.status, 201, JSON.stringify(evidence.body));
  assert.equal(evidence.body.data.attachments.length, 2);

  // Buyer response must not expose OCR moderator fields
  assert.equal(evidence.body.data.attachments[0].ocrFindings, undefined);
  assert.equal(evidence.body.data.moderatorWarningBadge, undefined);

  const stored = await DisputeChatMessage.findById(evidence.body.data._id).lean();
  assert.equal(stored.attachments[0].ocrStatus, 'completed');
  assert.equal(stored.hasFlaggedAttachments, false);
});

test('OCR contact findings flag screenshots for admin review without rejecting', async () => {
  const ctx = await openPaidDispute();

  const flagged = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({
      body: 'Here is the recovery email screen from the account.',
      attachments: ['https://cdn.example.com/evidence/with-contact-recovery.png'],
    });

  assert.equal(flagged.status, 201, JSON.stringify(flagged.body));

  const stored = await DisputeChatMessage.findById(flagged.body.data._id).lean();
  assert.equal(stored.hasFlaggedAttachments, true);
  assert.equal(stored.moderatorWarningBadge, true);
  assert.equal(stored.attachments[0].flaggedForReview, true);
  assert.equal(stored.attachments[0].warningBadge, true);
  assert.ok(stored.attachments[0].ocrFindings.length >= 1);
  assert.equal(stored.attachments[0].adminReviewStatus, 'pending');

  await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/assign`)
    .set('Authorization', `Bearer ${ctx.adminToken}`);

  const list = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat/flagged-attachments`)
    .set('Authorization', `Bearer ${ctx.adminToken}`);
  assert.equal(list.status, 200);
  assert.ok(list.body.data.length >= 1);
  assert.equal(list.body.data[0].warningBadge, true);

  const attachmentId = stored.attachments[0]._id;
  const review = await request(app)
    .post(
      `/api/v1/disputes/${ctx.disputeId}/chat/messages/${stored._id}/attachments/${attachmentId}/review`,
    )
    .set('Authorization', `Bearer ${ctx.adminToken}`)
    .send({ decision: 'cleared', note: 'Legitimate recovery email evidence' });

  assert.equal(review.status, 200, JSON.stringify(review.body));

  const after = await DisputeChatMessage.findById(stored._id).lean();
  assert.equal(after.attachments[0].adminReviewStatus, 'cleared');
  assert.equal(after.attachments[0].flaggedForReview, false);
  assert.equal(after.attachments[0].warningBadge, false);
});

test('repeat violations: warning → mute → notify admin', async () => {
  const ctx = await openPaidDispute();

  const v1 = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'whatsapp me please' });
  assert.equal(v1.status, 400);
  assert.equal(v1.body.errors?.actionTaken || v1.body.details?.actionTaken, 'warning');

  // details may be in errors field depending on response helper
  const action1 = v1.body.errors?.actionTaken || v1.body.details?.actionTaken;
  assert.equal(action1, 'warning');

  const v2 = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'use telegram instead' });
  assert.equal(v2.status, 400);
  const action2 = v2.body.errors?.actionTaken || v2.body.details?.actionTaken;
  assert.equal(action2, 'mute');

  const muted = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'Is there any update on my case?' });
  assert.equal(muted.status, 403);
  assert.equal(muted.body.code, 'CHAT_MUTED');

  // Clear mute to test 3rd violation path via direct model adjust
  await DisputeChatViolation.updateOne(
    {},
    { $set: { mutedUntil: null, count: 2 } },
  );
  await DisputeChat.updateOne({ _id: ctx.chatId }, { $set: { mutes: [] } });

  const v3 = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'discord.gg/invite' });
  assert.equal(v3.status, 400);
  const action3 = v3.body.errors?.actionTaken || v3.body.details?.actionTaken;
  assert.equal(action3, 'notify_admin');

  const violation = await DisputeChatViolation.findOne({}).lean();
  assert.equal(violation.adminNotified, true);
  assert.ok(violation.count >= 3);
});

test('admin can view blocked attempts and audit log after assign', async () => {
  const ctx = await openPaidDispute();

  await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'email me at test@yahoo.com' });

  await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/assign`)
    .set('Authorization', `Bearer ${ctx.adminToken}`);

  const blocked = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat/blocked-attempts`)
    .set('Authorization', `Bearer ${ctx.adminToken}`);
  assert.equal(blocked.status, 200);
  assert.ok(blocked.body.data.length >= 1);
  assert.ok(blocked.body.data[0].originalMessage.includes('yahoo.com'));

  const audit = await request(app)
    .get(`/api/v1/disputes/${ctx.disputeId}/chat/audit`)
    .set('Authorization', `Bearer ${ctx.adminToken}`);
  assert.equal(audit.status, 200);
  assert.ok(audit.body.data.some((e) => e.action === 'message_blocked'));
});

test('edit and delete are audited', async () => {
  const ctx = await openPaidDispute();

  const sent = await request(app)
    .post(`/api/v1/disputes/${ctx.disputeId}/chat/messages`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'The activation screen shows an invalid key error.' });
  assert.equal(sent.status, 201);
  const messageId = sent.body.data._id;

  const edited = await request(app)
    .patch(`/api/v1/disputes/${ctx.disputeId}/chat/messages/${messageId}`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`)
    .send({ body: 'Updated: activation fails with code 42.' });
  assert.equal(edited.status, 200);

  const deleted = await request(app)
    .delete(`/api/v1/disputes/${ctx.disputeId}/chat/messages/${messageId}`)
    .set('Authorization', `Bearer ${ctx.buyerToken}`);
  assert.equal(deleted.status, 200);

  const audits = await DisputeChatAuditLog.find({
    chat: ctx.chatId,
    action: { $in: ['message_edited', 'message_deleted'] },
  }).lean();
  assert.ok(audits.some((a) => a.action === 'message_edited'));
  assert.ok(audits.some((a) => a.action === 'message_deleted'));
});

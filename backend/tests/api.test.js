import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createDB } from 'mysql-memory-server';

let mysqlDb;
let server;
let base;
let adminToken;

const call = async (method, url, { body, token, form } = {}) => {
  const headers = {};
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}/api${url}`, { method, headers, body: payload });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
};

before(async () => {
  // A throwaway real MySQL 8.4 server (downloaded once, then cached) — the API creates its tables in it.
  mysqlDb = await createDB({ version: '8.4.x', dbName: 'db_masmin', downloadBinaryOnce: true, logLevel: 'ERROR' });
  process.env.NODE_ENV = 'test';
  Object.assign(process.env, { DB_HOST: '127.0.0.1', DB_PORT: String(mysqlDb.port), DB_USER: mysqlDb.username, DB_PASSWORD: '', DB_NAME: mysqlDb.dbName });
  process.env.JWT_SECRET = 'test-secret-test-secret';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD = 'correct-horse-battery';
  process.env.DEEPGRAM_API_KEY = ''; // API tests use the sandbox scorecard — never spend real credits
  process.env.ANTHROPIC_API_KEY = '';
  process.env.SANDBOX_MODE = 'true';
  process.env.PAYMENT_MODE = 'sandbox';
  process.env.UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-uploads-'));

  const { assertEnv } = await import('../src/config/env.js');
  const { connectDb } = await import('../src/config/db.js');
  const { seedDefaults } = await import('../src/seed/index.js');
  const { createApp } = await import('../src/app.js');
  assertEnv();
  await connectDb();
  await seedDefaults();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  const { disconnectDb } = await import('../src/config/db.js');
  await disconnectDb();
  await mysqlDb?.stop();
});

describe('public config', () => {
  test('returns seeded settings, payment mode and footer pages', async () => {
    const { status, body } = await call('GET', '/public/config');
    assert.equal(status, 200);
    assert.equal(body.pricing.telephony.licenseRate, 1500);
    assert.equal(body.payment.mode, 'sandbox');
    assert.equal(body.sandbox, true);
    assert.equal(body.footerPages.length, 5);
    assert.ok(body.chatbot.rules.length > 10);
    assert.equal(body.email, undefined, 'email/SMTP settings must never be public');
  });

  test('serves a legal page and 404s an unknown one', async () => {
    const ok = await call('GET', '/public/pages/refund-policy');
    assert.equal(ok.status, 200);
    assert.equal(ok.body.title, 'Refund & Cancellation Policy');
    assert.equal((await call('GET', '/public/pages/nope')).status, 404);
  });
});

describe('forms', () => {
  test('contact form persists and validates', async () => {
    const bad = await call('POST', '/public/contact', { body: { name: '', organization: 'x', email: 'nope' } });
    assert.equal(bad.status, 400);
    const ok = await call('POST', '/public/contact', { body: { name: 'Asha', organization: 'Acme', email: 'asha@acme.in', message: 'hi' } });
    assert.equal(ok.status, 201);
  });

  test('pricing lead rejects personal email, accepts work email', async () => {
    const lead = { name: 'A', organization: 'B', email: 'a@gmail.com', phone: '9876543210', callType: 'Collections', monthlyVolume: 'Under 5,000 calls/month', qaSetup: 'No formal QA process today' };
    assert.equal((await call('POST', '/public/leads', { body: lead })).status, 400);
    assert.equal((await call('POST', '/public/leads', { body: { ...lead, email: 'a@acme.in' } })).status, 201);
  });
});

async function verifiedToken(email) {
  const sent = await call('POST', '/otp/send', { body: { purpose: 'checkout', email } });
  assert.equal(sent.status, 200);
  assert.match(sent.body.devOtp, /^\d{4}$/);
  const bad = await call('POST', '/otp/verify', { body: { purpose: 'checkout', target: email, code: sent.body.devOtp === '0000' ? '1111' : '0000' } });
  assert.equal(bad.status, 400);
  const ok = await call('POST', '/otp/verify', { body: { purpose: 'checkout', target: email, code: sent.body.devOtp } });
  assert.equal(ok.status, 200);
  return ok.body.verifyToken;
}

const customer = (email) => ({ company: 'Acme Pvt Ltd', contact: 'Asha', gstNumber: '27ABCDE1234F1Z5', phone: '9876543210', email });

const placeOrder = (payload, file) => {
  const form = new FormData();
  form.append('payload', JSON.stringify(payload));
  if (file) form.append('scopeOfWork', new Blob(['scope']), file);
  return call('POST', '/orders', { form });
};

describe('checkout', () => {
  test('quote is computed server-side, promo applied before GST', async () => {
    const q = await call('POST', '/checkout/quote', { body: { productKey: 'cloud-telephony', config: { lic: 1, chan: 0, did: 0 }, promoCode: 'callmaster10' } });
    assert.equal(q.status, 200);
    assert.equal(q.body.subtotal, 1500);
    assert.equal(q.body.discountAmount, 150);
    assert.equal(q.body.gst, 243);
    assert.equal(q.body.total, 1593);
    const bad = await call('POST', '/checkout/quote', { body: { productKey: 'cloud-telephony', config: { lic: 1 }, promoCode: 'NOPE' } });
    assert.equal(bad.status, 400);
  });

  test('dialer tiers and the >20 seat cutoff', async () => {
    const t = (qty) => call('POST', '/checkout/quote', { body: { productKey: 'dialers', config: { qty } } });
    assert.equal((await t(3)).body.subtotal, 4500);
    assert.equal((await t(8)).body.subtotal, 9600);
    assert.equal((await t(15)).body.subtotal, 16500);
    assert.equal((await t(21)).status, 400);
  });

  test('enterprise plans cannot be bought online', async () => {
    const r = await call('POST', '/checkout/quote', { body: { productKey: 'email-automation', config: { planKey: 'enterprise' } } });
    assert.equal(r.status, 400);
  });

  test('full purchase: OTP → order → sandbox payment, with a tampered total ignored', async () => {
    const email = 'buyer@acme.in';
    const verifyToken = await verifiedToken(email);
    const res = await placeOrder({
      productKey: 'whatsapp-api', config: { planKey: 'growth', qty: 2, total: 1 }, promoCode: 'CALLMASTER10', customer: customer(email), verifyToken,
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.quote.subtotal, 25998);
    assert.equal(res.body.quote.total, Math.round(25998 * 0.9) + Math.round(Math.round(25998 * 0.9) * 0.18));
    assert.match(res.body.orderId, /^CM-WH-[A-Z0-9]{6}$/);

    const wrongToken = await call('POST', `/orders/${res.body.orderId}/sandbox-pay`, { body: { accessToken: 'x' } });
    assert.equal(wrongToken.status, 404);
    const paid = await call('POST', `/orders/${res.body.orderId}/sandbox-pay`, { body: { accessToken: res.body.accessToken } });
    assert.equal(paid.status, 200);
    const again = await call('POST', `/orders/${res.body.orderId}/sandbox-pay`, { body: { accessToken: res.body.accessToken } });
    assert.equal(again.status, 409);
  });

  test('order requires a verified email', async () => {
    const res = await placeOrder({ productKey: 'dialers', config: { qty: 2 }, customer: customer('x@acme.in'), verifyToken: 'not-a-real-token' });
    assert.equal(res.status, 403);
  });

  test('voice bot order requires the scope-of-work file and stores it', async () => {
    const email = 'voice@acme.in';
    const verifyToken = await verifiedToken(email);
    const payload = { productKey: 'voice-bot', config: { languages: ['Tamil', 'Tamil', 'Bengali'] }, customer: customer(email), verifyToken };
    assert.equal((await placeOrder(payload)).status, 400);
    const ok = await placeOrder(payload, 'scope.pdf');
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.equal(ok.body.quote.subtotal, 30000 + 2 * 15000);
  });
});

describe('demos', () => {
  const audioForm = (fields, name = 'call.mp3') => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', new Blob(['audio-bytes']), name);
    return form;
  };

  test('audit: the visitor is saved at step 1, then the recording is attached to that same record', async () => {
    const reg = await call('POST', '/demos/audit/register', { body: { name: 'Asha', company: 'Acme', email: 'Asha@Gmail.com' } });
    assert.equal(reg.status, 201, JSON.stringify(reg.body));
    const { id, accessToken } = reg.body;
    assert.ok(id && accessToken);

    // nothing uploaded yet — but the person is already stored
    const early = await call('GET', `/demos/audit/${id}?token=${accessToken}`);
    assert.equal(early.body.status, 'registered');

    // pressing Continue again (same session, or the same email) updates the row instead of duplicating it
    const again = await call('POST', '/demos/audit/register', { body: { name: 'Asha R', company: 'Acme Ltd', email: 'asha@gmail.com', id, accessToken } });
    assert.equal(again.body.id, id);
    const reused = await call('POST', '/demos/audit/register', { body: { name: 'Asha R', company: 'Acme Ltd', email: 'asha@gmail.com' } });
    assert.equal(reused.body.id, id);
    const token = reused.body.accessToken;
    assert.notEqual(token, accessToken); // every registration rotates the secret

    // step 2 needs the current token
    const denied = await call('POST', `/demos/audit/${id}/submit`, { form: audioForm({ accessToken, lob: 'Collections', rights: 'true' }) });
    assert.equal(denied.status, 404);
    assert.equal((await call('POST', `/demos/audit/999999/submit`, { form: audioForm({ accessToken: token, lob: 'Collections', rights: 'true' }) })).status, 404);
    assert.equal((await call('POST', `/demos/audit/${id}/submit`, { form: audioForm({ accessToken: token, lob: 'Collections', rights: 'false' }) })).status, 400);

    const res = await call('POST', `/demos/audit/${id}/submit`, { form: audioForm({ accessToken: token, lob: 'Collections', rights: 'true' }) });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.id, id);
    assert.equal(res.body.status, 'completed'); // no API keys in tests → immediate sandbox scorecard
    assert.equal(res.body.results.framework, 'RESO');
    assert.equal(res.body.results.mock, true);
    assert.equal(res.body.results.parameters.length, 8);

    // the uploader can fetch the report with the token — and nobody else can
    const ok = await call('GET', `/demos/audit/${id}?token=${token}`);
    assert.equal(ok.body.status, 'completed');
    assert.equal((await call('GET', `/demos/audit/${id}?token=wrong`)).status, 404);
    assert.equal((await call('GET', `/demos/audit/${id}`)).status, 404);
    // a finished call cannot be submitted twice
    assert.equal((await call('POST', `/demos/audit/${id}/submit`, { form: audioForm({ accessToken: token, lob: 'Collections', rights: 'true' }) })).status, 409);
  });

  test('voice: saved at step 5, one trial per number counts only placed calls', async () => {
    const phone = '9123456780';
    const cfg = { industry: 'FMCG', callType: 'Inbound', gender: 'Female', language: 'Hindi', name: 'A', company: 'B', email: 'a@b.in' };
    const reg = await call('POST', '/demos/voice/register', { body: cfg });
    assert.equal(reg.status, 201, JSON.stringify(reg.body));

    // being registered does not use up the free trial
    const sent = await call('POST', '/otp/send', { body: { purpose: 'voice-demo', phone } });
    assert.equal(sent.status, 200);
    const v = await call('POST', '/otp/verify', { body: { purpose: 'voice-demo', target: phone, code: sent.body.devOtp } });

    const call1 = { ...cfg, phone, consent: true, verifyToken: v.body.verifyToken, demoId: reg.body.id, demoToken: 'not-the-token' };
    assert.equal((await call('POST', '/demos/voice', { body: call1 })).status, 404); // wrong session token
    const placed = await call('POST', '/demos/voice', { body: { ...call1, demoToken: reg.body.accessToken } });
    assert.equal(placed.status, 201, JSON.stringify(placed.body));
    assert.equal(placed.body.id, reg.body.id); // the same record was completed, no duplicate

    assert.equal((await call('POST', '/demos/voice', { body: { ...call1, demoToken: reg.body.accessToken } })).status, 409);
    assert.equal((await call('POST', '/otp/send', { body: { purpose: 'voice-demo', phone } })).status, 409);
  });
});

describe('admin', () => {
  test('rejects anonymous access and bad credentials', async () => {
    assert.equal((await call('GET', '/admin/orders')).status, 401);
    assert.equal((await call('POST', '/admin/auth/login', { body: { email: 'admin@example.com', password: 'wrong' } })).status, 401);
  });

  test('login, dashboard and lists', async () => {
    const login = await call('POST', '/admin/auth/login', { body: { email: 'admin@example.com', password: 'correct-horse-battery' } });
    assert.equal(login.status, 200);
    adminToken = login.body.token;
    assert.equal(login.body.admin.passwordHash, undefined);

    const stats = await call('GET', '/admin/stats', { token: adminToken });
    assert.equal(stats.status, 200);
    assert.equal(stats.body.totals.paidOrders, 1);
    assert.ok(stats.body.totals.revenue > 0);
    assert.equal(stats.body.series.length, 14);

    const orders = await call('GET', '/admin/orders?status=paid', { token: adminToken });
    assert.equal(orders.body.total, 1);
    assert.equal(orders.body.items[0].accessToken, undefined);

    const leads = await call('GET', '/admin/leads?q=acme', { token: adminToken });
    assert.equal(leads.body.total, 1);

    const csv = await call('GET', '/admin/orders/export.csv', { token: adminToken });
    assert.equal(csv.status, 200);
    assert.match(csv.body, /Order ID/);
  });

  test('changing a price in settings changes the quote immediately', async () => {
    const all = (await call('GET', '/admin/settings', { token: adminToken })).body;
    const pricing = structuredClone(all.pricing);
    pricing.telephony.licenseRate = 2000;
    const put = await call('PUT', '/admin/settings/pricing', { token: adminToken, body: pricing });
    assert.equal(put.status, 200, JSON.stringify(put.body));
    const q = await call('POST', '/checkout/quote', { body: { productKey: 'cloud-telephony', config: { lic: 2 } } });
    assert.equal(q.body.subtotal, 4000);

    pricing.dialers.tiers = [{ min: 1, max: 10, rate: 1 }, { min: 5, max: 20, rate: 2 }];
    assert.equal((await call('PUT', '/admin/settings/pricing', { token: adminToken, body: pricing })).status, 400);
    await call('POST', '/admin/settings/pricing/reset', { token: adminToken });
  });

  test('order status, notes and a custom page + promo code', async () => {
    const order = (await call('GET', '/admin/orders', { token: adminToken })).body.items[0];
    const patched = await call('PATCH', `/admin/orders/${order.id}`, { token: adminToken, body: { status: 'fulfilled', notes: 'provisioned' } });
    assert.equal(patched.body.status, 'fulfilled');
    assert.equal((await call('PATCH', `/admin/orders/${order.id}`, { token: adminToken, body: { status: 'bogus' } })).status, 400);

    const page = await call('POST', '/admin/pages', { token: adminToken, body: { slug: 'careers', title: 'Careers', sections: [{ heading: 'Join us', body: 'We are hiring' }] } });
    assert.equal(page.status, 201);
    assert.equal((await call('GET', '/public/pages/careers')).status, 200);
    assert.equal((await call('POST', '/admin/pages', { token: adminToken, body: { slug: 'pricing', title: 'x', sections: [] } })).status, 400);

    const promo = await call('POST', '/admin/promos', { token: adminToken, body: { code: 'save20', percent: 20 } });
    assert.equal(promo.status, 201);
    const q = await call('POST', '/checkout/quote', { body: { productKey: 'dialers', config: { qty: 1 }, promoCode: 'SAVE20' } });
    assert.equal(q.body.discountAmount, 300);
  });

  test('email settings: password is masked, kept on re-save, and validated', async () => {
    const all = (await call('GET', '/admin/settings', { token: adminToken })).body;
    const email = structuredClone(all.email);
    Object.assign(email.smtp, { host: 'smtp.example.com', user: 'me@example.com', pass: 'hunter2-hunter2' });
    email.notifyTo = 'boss@example.com, sales@example.com';
    const saved = await call('PUT', '/admin/settings/email', { token: adminToken, body: email });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.smtp.pass, '********');
    const reread = (await call('GET', '/admin/settings', { token: adminToken })).body.email;
    assert.equal(reread.smtp.pass, '********');
    assert.ok(!JSON.stringify(reread).includes('hunter2'));

    email.smtp.pass = '********'; // what the browser sends back when the password field is untouched
    assert.equal((await call('PUT', '/admin/settings/email', { token: adminToken, body: email })).status, 200);
    const { getEmailSettings } = await import('../src/services/settings.service.js');
    assert.equal((await getEmailSettings()).smtp.pass, 'hunter2-hunter2');

    email.notifyTo = 'not-an-email';
    assert.equal((await call('PUT', '/admin/settings/email', { token: adminToken, body: email })).status, 400);
    assert.equal((await call('POST', '/admin/email/test', { token: adminToken, body: { to: 'bad' } })).status, 400);
    await call('POST', '/admin/settings/email/reset', { token: adminToken });
  });

  test('cannot delete yourself or the last super admin', async () => {
    const me = (await call('GET', '/admin/auth/me', { token: adminToken })).body.admin;
    assert.equal((await call('DELETE', `/admin/users/${me.id}`, { token: adminToken })).status, 400);
  });
});

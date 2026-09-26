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
  // The suite must never send real email, whatever backend/.env holds.
  Object.assign(process.env, { SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', NOTIFY_EMAIL: '' });
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
    const ok = await call('POST', '/public/contact', { body: { name: 'Asha', organization: 'Acme', email: 'asha@acme.in', phone: '9876543210', message: 'hi' } });
    assert.equal(ok.status, 201);
  });

  test('pricing lead rejects personal email, accepts work email', async () => {
    const lead = { name: 'A', organization: 'B', email: 'a@gmail.com', phone: '9876543210', callType: 'Collections', monthlyVolume: 'Under 5,000 calls/month', qaSetup: 'No formal QA process today' };
    assert.equal((await call('POST', '/public/leads', { body: lead })).status, 400);
    assert.equal((await call('POST', '/public/leads', { body: { ...lead, email: 'a@acme.in' } })).status, 201);
  });
});

async function verifiedToken(email, purpose = 'checkout') {
  const sent = await call('POST', '/otp/send', { body: { purpose, email } });
  assert.equal(sent.status, 200);
  assert.match(sent.body.devOtp, /^\d{4}$/);
  const bad = await call('POST', '/otp/verify', { body: { purpose, target: email, code: sent.body.devOtp === '0000' ? '1111' : '0000' } });
  assert.equal(bad.status, 400);
  const ok = await call('POST', '/otp/verify', { body: { purpose, target: email, code: sent.body.devOtp } });
  assert.equal(ok.status, 200);
  return ok.body.verifyToken;
}

const customer = (email) => ({ company: 'Acme Pvt Ltd', contact: 'Asha', gstNumber: '27ABCDE1234F1Z5', phone: '9876543210', email });

const placeOrder = (payload, file) => {
  const form = new FormData();
  form.append('payload', JSON.stringify({ dpdpConsent: true, ...payload }));
  if (file) form.append('scopeOfWork', new Blob(['scope']), file);
  return call('POST', '/orders', { form });
};

describe('checkout', () => {
  test('quote is computed server-side, promo applied before GST', async () => {
    const q = await call('POST', '/checkout/quote', { body: { productKey: 'cloud-telephony', config: { lic: 1, chan: 0, did: 0 }, promoCode: 'mcn247x' } });
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
      productKey: 'whatsapp-api', config: { planKey: 'growth', qty: 2, total: 1 }, promoCode: 'MCN247X', customer: customer(email), verifyToken,
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
    const vt = await verifiedToken('asha@gmail.com', 'audit-demo'); // any address works, but only after its owner enters the emailed code
    assert.equal((await call('POST', '/demos/audit/register', { body: { name: 'Asha', company: 'Acme', email: 'Asha@Gmail.com' } })).status, 400, 'no code, no registration');
    assert.equal((await call('POST', '/demos/audit/register', { body: { name: 'Mallory', company: 'Evil', email: 'victim@acme.in', verifyToken: vt } })).status, 403, 'a code for one address cannot register another');
    const reg = await call('POST', '/demos/audit/register', { body: { name: 'Asha', company: 'Acme', email: 'Asha@Gmail.com', verifyToken: vt } });
    assert.equal(reg.status, 201, JSON.stringify(reg.body));
    const { id, accessToken } = reg.body;
    assert.ok(id && accessToken);

    // nothing uploaded yet — but the person is already stored
    const early = await call('GET', `/demos/audit/${id}?token=${accessToken}`);
    assert.equal(early.body.status, 'registered');

    // pressing Continue again (same session, or the same email) updates the row instead of duplicating it
    const again = await call('POST', '/demos/audit/register', { body: { name: 'Asha R', company: 'Acme Ltd', email: 'asha@gmail.com', verifyToken: vt, id, accessToken } });
    assert.equal(again.body.id, id);
    const reused = await call('POST', '/demos/audit/register', { body: { name: 'Asha R', company: 'Acme Ltd', email: 'asha@gmail.com', verifyToken: vt } });
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

  test('API keys: masked, encrypted, kept on re-save, applied without restart, super-admin only', async () => {
    const { getAuditConfig, isAuditLive } = await import('../src/services/audit/config.js');
    const { getSetting } = await import('../src/services/settings.service.js');

    // nothing configured: no keys in the test environment → sample scorecards, not live
    assert.equal(await isAuditLive(), false);
    assert.equal((await call('GET', '/public/config')).body.audit.live, false);
    const before = (await call('GET', '/admin/settings', { token: adminToken })).body.integrations;
    assert.equal(before.deepgram.apiKey, '');

    // save both keys from the panel
    const next = structuredClone(before);
    next.deepgram.apiKey = 'dg-secret-key-1234567890abcd';
    next.anthropic.apiKey = 'sk-ant-secret-key-9876543210wxyz';
    const saved = await call('PUT', '/admin/settings/integrations', { token: adminToken, body: next });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.deepgram.apiKey, '********abcd'); // last 4 only
    assert.equal(saved.body.anthropic.apiKey, '********wxyz');

    // never leaked: not in any admin response, not public, and encrypted in the database
    const listed = JSON.stringify((await call('GET', '/admin/settings', { token: adminToken })).body);
    assert.ok(!listed.includes('dg-secret-key') && !listed.includes('sk-ant-secret'));
    assert.equal((await call('GET', '/public/config')).body.integrations, undefined);
    assert.match((await getSetting('integrations')).deepgram.apiKey, /^enc:v1:/);

    // effective immediately (no restart) and reported as coming from the admin panel
    const cfg = await getAuditConfig();
    assert.equal(cfg.deepgramKey, 'dg-secret-key-1234567890abcd');
    assert.equal(cfg.deepgramSource, 'admin panel');
    assert.equal(await isAuditLive(), true);
    assert.equal((await call('GET', '/public/config')).body.audit.live, true);
    const status = (await call('GET', '/admin/integrations/status', { token: adminToken })).body;
    assert.deepEqual([status.deepgram.last4, status.anthropic.last4, status.live], ['abcd', 'wxyz', true]);
    assert.ok(!JSON.stringify(status).includes('secret'));

    // saving again with the untouched mask keeps the stored key; a model change alone doesn't lose it
    const again = structuredClone(saved.body);
    again.anthropic.model = 'claude-sonnet-5';
    await call('PUT', '/admin/settings/integrations', { token: adminToken, body: again });
    assert.equal((await getAuditConfig()).anthropicKey, 'sk-ant-secret-key-9876543210wxyz');

    // replacing a key takes effect on the next call
    again.deepgram.apiKey = 'dg-brand-new-key-000000zzzz';
    await call('PUT', '/admin/settings/integrations', { token: adminToken, body: again });
    assert.equal((await getAuditConfig()).deepgramKey, 'dg-brand-new-key-000000zzzz');

    // keys with spaces are rejected
    again.deepgram.apiKey = 'has a space';
    assert.equal((await call('PUT', '/admin/settings/integrations', { token: adminToken, body: again })).status, 400);
    again.deepgram.apiKey = 'dg-brand-new-key-000000zzzz';

    // "Test connection" uses the saved key against the provider (stubbed here — no real network call)
    const realFetch = globalThis.fetch;
    const seen = [];
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.startsWith('https://api.deepgram.com')) { seen.push(['deepgram', init.headers.Authorization]); return new Response(JSON.stringify({ email: 'owner@example.com' }), { status: 200 }); }
      if (u.startsWith('https://api.anthropic.com')) { seen.push(['anthropic', init.headers['x-api-key']]); return new Response(JSON.stringify({ data: [{ id: 'claude-sonnet-5' }] }), { status: 200 }); }
      return realFetch(url, init);
    };
    try {
      const dg = await call('POST', '/admin/integrations/test', { token: adminToken, body: { service: 'deepgram' } });
      assert.equal(dg.body.ok, true);
      assert.match(dg.body.message, /owner@example.com/);
      assert.equal((await call('POST', '/admin/integrations/test', { token: adminToken, body: { service: 'anthropic' } })).body.ok, true);
      assert.deepEqual(seen, [['deepgram', 'Token dg-brand-new-key-000000zzzz'], ['anthropic', 'sk-ant-secret-key-9876543210wxyz']]);

      // provider says the key is bad → a clear message that does not echo the key
      globalThis.fetch = async (url, init) => (String(url).startsWith('https://api.deepgram.com') ? new Response('Invalid credentials.', { status: 401 }) : realFetch(url, init));
      const bad = await call('POST', '/admin/integrations/test', { token: adminToken, body: { service: 'deepgram' } });
      assert.equal(bad.body.ok, false);
      assert.match(bad.body.message, /rejected this key/);
      assert.ok(!bad.body.message.includes('dg-brand-new-key'));
    } finally { globalThis.fetch = realFetch; }
    assert.equal((await call('POST', '/admin/integrations/test', { token: adminToken, body: { service: 'nope' } })).status, 400);

    // only a super admin may view status / change keys
    const email = 'plain.admin@example.com';
    const made = await call('POST', '/admin/users', { token: adminToken, body: { name: 'Plain', email, role: 'admin', password: 'plain-admin-pass' } });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    const plainToken = (await call('POST', '/admin/auth/login', { body: { email, password: 'plain-admin-pass' } })).body.token;
    assert.equal((await call('PUT', '/admin/settings/integrations', { token: plainToken, body: again })).status, 403);
    assert.equal((await call('POST', '/admin/settings/integrations/reset', { token: plainToken })).status, 403);
    assert.equal((await call('GET', '/admin/integrations/status', { token: plainToken })).status, 403);
    assert.equal((await call('POST', '/admin/integrations/test', { token: plainToken, body: { service: 'deepgram' } })).status, 403);
    await call('DELETE', '/admin/users/' + made.body.id, { token: adminToken });

    // clearing the keys falls back to .env (blank in tests) → back to sample mode
    const cleared = await call('POST', '/admin/settings/integrations/reset', { token: adminToken });
    assert.equal(cleared.status, 200);
    assert.equal(await isAuditLive(), false);
    assert.equal((await getAuditConfig()).deepgramSource, 'none');
  });

  test('cannot delete yourself or the last super admin', async () => {
    const me = (await call('GET', '/admin/auth/me', { token: adminToken })).body.admin;
    assert.equal((await call('DELETE', `/admin/users/${me.id}`, { token: adminToken })).status, 400);
  });
});

describe('customer accounts & cancellation', () => {
  const ctOrder = async (email) => {
    const verifyToken = await verifiedToken(email);
    const res = await placeOrder({ productKey: 'cloud-telephony', config: { lic: 1, chan: 0, did: 0 }, customer: customer(email), verifyToken });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const paid = await call('POST', `/orders/${res.body.orderId}/sandbox-pay`, { body: { accessToken: res.body.accessToken } });
    assert.equal(paid.status, 200, JSON.stringify(paid.body));
    return { ...res.body, paid: paid.body };
  };

  test('checkout requires the DPDP consent', async () => {
    const email = 'consent@acme.in';
    const verifyToken = await verifiedToken(email);
    const form = new FormData();
    form.append('payload', JSON.stringify({ productKey: 'dialers', config: { qty: 1 }, customer: customer(email), verifyToken }));
    const res = await call('POST', '/orders', { form });
    assert.equal(res.status, 400);
    assert.match(res.body.error.message, /read and understood/);
  });

  test('a paid order creates a dashboard account; the customer signs in, must change the password, then sees and cancels orders', async () => {
    const email = 'cloud@acme.in';
    const a = await ctOrder(email);
    assert.equal(a.paid.welcomeOffer, true);
    assert.equal(a.paid.cancellation.windowDays, 3);
    assert.equal(a.paid.account.created, true);
    const { username, tempPassword } = a.paid.account;
    assert.match(username, /@callmaster-account$/);
    assert.ok(tempPassword);

    assert.equal((await call('POST', '/customer/login', { body: { login: username, password: 'wrong' } })).status, 401);
    const login = await call('POST', '/customer/login', { body: { login: email, password: tempPassword } }); // e-mail works too
    assert.equal(login.status, 200, JSON.stringify(login.body));
    assert.equal(login.body.account.mustChangePassword, true);
    assert.equal(login.body.account.passwordHash, undefined);
    const token = login.body.token;

    assert.equal((await call('GET', '/customer/orders', { token })).status, 403);
    assert.equal((await call('GET', '/customer/me', { token })).status, 200);
    assert.equal((await call('POST', '/customer/change-password', { token, body: { currentPassword: 'nope', newPassword: 'a-new-password-1' } })).status, 400);
    assert.equal((await call('POST', '/customer/change-password', { token, body: { currentPassword: tempPassword, newPassword: 'a-new-password-1' } })).status, 200);

    // a second purchase by the same buyer reuses the account instead of creating another
    const b = await ctOrder(email);
    assert.equal(b.paid.account.created, false);
    assert.equal(b.paid.account.tempPassword, undefined);
    assert.equal(b.paid.account.username, username);

    const relogin = await call('POST', '/customer/login', { body: { login: username, password: 'a-new-password-1' } });
    assert.equal(relogin.body.account.mustChangePassword, false);
    const orders = await call('GET', '/customer/orders', { token: relogin.body.token });
    assert.equal(orders.body.orders.length, 2);
    assert.ok(orders.body.orders.every((o) => o.cancellable === true && o.accessToken === undefined));

    const cancelled = await call('POST', `/customer/orders/${a.orderId}/cancel`, { token: relogin.body.token });
    assert.equal(cancelled.status, 200, JSON.stringify(cancelled.body));
    assert.equal(cancelled.body.refundDays, 7);
    assert.equal((await call('POST', `/customer/orders/${a.orderId}/cancel`, { token: relogin.body.token })).status, 409);
    const after = (await call('GET', '/customer/orders', { token: relogin.body.token })).body.orders;
    assert.equal(after.find((o) => o.orderId === a.orderId).status, 'cancelled');

    // the other order: cancelled with the checkout token straight after paying
    const viaCheckout = await call('POST', `/orders/${b.orderId}/cancel`, { body: { accessToken: b.accessToken } });
    assert.equal(viaCheckout.status, 200, JSON.stringify(viaCheckout.body));
  });

  test('cancel-request form: generic answer, nothing leaked, admin closes the loop', async () => {
    const email = 'form@acme.in';
    const o = await ctOrder(email);
    const wrong = await call('POST', '/orders/cancel-request', { body: { orderId: o.orderId, email: 'someone-else@acme.in' } });
    const right = await call('POST', '/orders/cancel-request', { body: { orderId: o.orderId, email } });
    assert.equal(wrong.status, 201);
    assert.equal(right.status, 201);
    assert.deepEqual(wrong.body, right.body, 'the answer must not reveal whether the order exists');
    assert.equal((await call('POST', '/orders/cancel-request', { body: { orderId: '', email: 'bad' } })).status, 400);

    const list = (await call('GET', '/admin/cancellations', { token: adminToken })).body;
    const mine = list.items.find((r) => r.orderRef === o.orderId && r.matched);
    assert.ok(mine && mine.status === 'requested' && mine.eligible === true);
    assert.ok(list.items.some((r) => r.email === 'someone-else@acme.in' && r.matched === false));

    const approved = await call('PATCH', `/admin/cancellations/${mine.id}`, { token: adminToken, body: { status: 'approved' } });
    assert.equal(approved.status, 200);
    let order = (await call('GET', `/admin/orders?q=${o.orderId}`, { token: adminToken })).body.items[0];
    assert.equal(order.status, 'cancelled');
    await call('PATCH', `/admin/cancellations/${mine.id}`, { token: adminToken, body: { status: 'refunded' } });
    order = (await call('GET', `/admin/orders?q=${o.orderId}`, { token: adminToken })).body.items[0];
    assert.equal(order.status, 'refunded');
    assert.equal((await call('PATCH', `/admin/cancellations/${mine.id}`, { token: adminToken, body: { status: 'bogus' } })).status, 400);
  });

  test('only paid Cloud Telephony orders inside the window can be cancelled', async () => {
    const email = 'dialer@acme.in';
    const verifyToken = await verifiedToken(email);
    const res = await placeOrder({ productKey: 'dialers', config: { qty: 1 }, customer: customer(email), verifyToken });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    await call('POST', `/orders/${res.body.orderId}/sandbox-pay`, { body: { accessToken: res.body.accessToken } });
    assert.equal((await call('POST', `/orders/${res.body.orderId}/cancel`, { body: { accessToken: res.body.accessToken } })).status, 409);
    assert.equal((await call('POST', `/orders/${res.body.orderId}/cancel`, { body: { accessToken: 'x' } })).status, 404);
  });

  test('admin can list customers, reset a password and disable an account', async () => {
    const customers = (await call('GET', '/admin/customers', { token: adminToken })).body;
    assert.ok(customers.total >= 2);
    assert.equal(customers.items[0].passwordHash, undefined);
    const acct = customers.items.find((c) => c.email === 'cloud@acme.in');
    const reset = await call('POST', `/admin/customers/${acct.id}/reset-password`, { token: adminToken });
    assert.equal(reset.status, 200);
    const login = await call('POST', '/customer/login', { body: { login: acct.email, password: reset.body.tempPassword } });
    assert.equal(login.body.account.mustChangePassword, true);
    await call('PATCH', `/admin/customers/${acct.id}/active`, { token: adminToken, body: { active: false } });
    assert.equal((await call('POST', '/customer/login', { body: { login: acct.email, password: reset.body.tempPassword } })).status, 401);
    assert.equal((await call('GET', '/customer/me', { token: login.body.token })).status, 401);
  });
});

describe('white papers & branding', () => {
  const upload = (url, name, type) => {
    const form = new FormData();
    form.append('file', new Blob(['%PDF-1.4 test'], { type }), name);
    return call('POST', url, { token: adminToken, form });
  };

  test('unlock saves the lead; the PDF is only reachable through a short-lived link', async () => {
    const cfg = (await call('GET', '/public/config')).body;
    assert.equal(cfg.whitepapers.length, 2);
    assert.ok(cfg.whitepapers.every((p) => p.available === false && p.file === undefined));
    const { slug } = cfg.whitepapers[0];

    assert.equal((await call('POST', `/public/whitepapers/${slug}/unlock`, { body: { name: 'A', email: 'a@gmail.com' } })).status, 400);
    assert.equal((await call('POST', '/public/whitepapers/nope/unlock', { body: { name: 'A', email: 'a@acme.in' } })).status, 404);

    // no PDF uploaded yet: the lead is still saved, the visitor is told it is being finalised
    const none = await call('POST', `/public/whitepapers/${slug}/unlock`, { body: { name: 'Asha', email: 'asha@acme.in' } });
    assert.equal(none.status, 201);
    assert.equal(none.body.available, false);

    const papers = (await call('GET', '/admin/whitepapers', { token: adminToken })).body.items;
    const paper = papers.find((p) => p.slug === slug);
    assert.equal((await upload(`/admin/whitepapers/${paper.id}/file`, 'notes.txt', 'text/plain')).status, 400);
    const up = await upload(`/admin/whitepapers/${paper.id}/file`, 'paper.pdf', 'application/pdf');
    assert.equal(up.status, 200, JSON.stringify(up.body));
    assert.equal((await call('GET', '/public/config')).body.whitepapers.find((p) => p.slug === slug).available, true);

    const ok = await call('POST', `/public/whitepapers/${slug}/unlock`, { body: { name: 'Ravi', email: 'ravi@acme.in' } });
    assert.equal(ok.body.available, true);
    const pdf = await fetch(`${base}${ok.body.url}`);
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.equal((await fetch(`${base}/api/public/whitepapers/download?token=garbage`)).status, 401);

    const leads = (await call('GET', '/admin/whitepaper-leads', { token: adminToken })).body;
    assert.equal(leads.total, 2);
    assert.equal(leads.items.find((l) => l.email === 'ravi@acme.in').delivered, true);
    assert.equal(leads.items.find((l) => l.email === 'asha@acme.in').delivered, false);
    assert.equal((await call('GET', '/admin/whitepaper-leads/export.csv', { token: adminToken })).status, 200);
    assert.equal((await call('GET', '/admin/whitepaper-leads')).status, 401);

    const removed = await call('DELETE', `/admin/whitepapers/${paper.id}/file`, { token: adminToken });
    assert.equal(removed.body.file, null);
  });

  test('white paper CRUD from the admin panel', async () => {
    const made = await call('POST', '/admin/whitepapers', { token: adminToken, body: { slug: 'new-paper', title: 'New paper', description: 'd' } });
    assert.equal(made.status, 201, JSON.stringify(made.body));
    assert.equal((await call('PUT', `/admin/whitepapers/${made.body.id}`, { token: adminToken, body: { slug: 'new-paper', title: 'Renamed', active: false } })).body.active, false);
    assert.ok(!(await call('GET', '/public/config')).body.whitepapers.some((p) => p.slug === 'new-paper'), 'inactive papers are hidden');
    assert.equal((await call('DELETE', `/admin/whitepapers/${made.body.id}`, { token: adminToken })).status, 200);
  });

  test('logo upload is served publicly and can be removed', async () => {
    assert.equal((await call('GET', '/public/branding/logo')).status, 404);
    const up = await upload('/admin/branding/logo', 'logo.png', 'image/png');
    assert.equal(up.status, 200, JSON.stringify(up.body));
    assert.equal((await call('GET', '/public/config')).body.site.logoFile, up.body.logoFile);
    assert.equal((await fetch(`${base}/api/public/branding/logo`)).status, 200);
    assert.equal((await upload('/admin/branding/logo', 'logo.exe', 'application/octet-stream')).status, 400);
    assert.equal((await call('DELETE', '/admin/branding/logo', { token: adminToken })).status, 200);
    assert.equal((await call('GET', '/public/branding/logo')).status, 404);
  });
});

describe('settings screens added for the redesign', () => {
  test('the shipped chatbot settings save unchanged, including the idle nudge', async () => {
    const chatbot = (await call('GET', '/admin/settings', { token: adminToken })).body.chatbot;
    assert.equal(chatbot.nudge.enabled, true);
    assert.ok(chatbot.rules.some((r) => r.reply.includes('{{site.promoCodeExample}}')));
    chatbot.nudge.idleSeconds = 20;
    const saved = await call('PUT', '/admin/settings/chatbot', { token: adminToken, body: chatbot });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.equal((await call('GET', '/public/config')).body.chatbot.nudge.idleSeconds, 20);
    chatbot.nudge.idleSeconds = 2; // too aggressive
    assert.equal((await call('PUT', '/admin/settings/chatbot', { token: adminToken, body: chatbot })).status, 400);
    await call('POST', '/admin/settings/chatbot/reset', { token: adminToken });
  });

  test('site settings: new fields validate, and the logo can only change through its own endpoint', async () => {
    const site = (await call('GET', '/admin/settings', { token: adminToken })).body.site;
    assert.equal(site.promoCodeExample, 'MCN247X');
    assert.equal(site.cancellationWindowDays, 3);
    assert.equal((await call('PUT', '/admin/settings/site', { token: adminToken, body: { ...site, cancellationWindowDays: 0 } })).status, 400);
    const saved = await call('PUT', '/admin/settings/site', { token: adminToken, body: { ...site, cancellationWindowDays: 5, logoFile: 'sneaky.png' } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.cancellationWindowDays, 5);
    assert.equal(saved.body.logoFile, '', 'the form cannot set the logo');
    // a longer window is honoured by the cancellation rules straight away
    const { getCancellationPolicy } = await import('../src/services/cancellation.service.js');
    assert.equal((await getCancellationPolicy()).windowDays, 5);
    await call('POST', '/admin/settings/site/reset', { token: adminToken });
    assert.equal((await getCancellationPolicy()).windowDays, 3);
  });

  test('insights page copy is editable and public', async () => {
    const insights = (await call('GET', '/admin/settings', { token: adminToken })).body.insights;
    insights.title = 'Field Notes';
    assert.equal((await call('PUT', '/admin/settings/insights', { token: adminToken, body: insights })).status, 200);
    assert.equal((await call('GET', '/public/config')).body.insights.title, 'Field Notes');
    await call('POST', '/admin/settings/insights/reset', { token: adminToken });
  });
});

describe('book a call, contact rules and hero video (v3 redesign)', () => {
  const person = { name: 'Priya Nair', organization: 'Zenith BPO', email: 'priya@zenithbpo.in', phone: '9876543210' };

  test('the contact form now needs a work email and a 10-digit phone', async () => {
    const base = { name: 'Asha', organization: 'Acme', message: 'hi' };
    assert.equal((await call('POST', '/public/contact', { body: { ...base, email: 'asha@gmail.com', phone: '9876543210' } })).status, 400);
    assert.equal((await call('POST', '/public/contact', { body: { ...base, email: 'asha@acme.in', phone: '12345' } })).status, 400);
    assert.equal((await call('POST', '/public/contact', { body: { ...base, email: 'asha@acme.in', phone: '9876543210' } })).status, 201);
  });

  test('offered slots are weekdays in IST starting tomorrow, and a booked slot is taken', async () => {
    const { body } = await call('GET', '/public/appointments/slots');
    assert.equal(body.timezone, 'IST');
    assert.equal(body.days.length, 5);
    assert.deepEqual(body.days[0].times.map((t) => t.time), ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM']);
    for (const d of body.days) { const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay(); assert.ok(dow >= 1 && dow <= 5, `${d.date} is a weekday`); }
    const todayIst = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
    assert.ok(body.days[0].date > todayIst, 'never offers today');

    const { date } = body.days[0];
    const bad = await call('POST', '/public/appointments', { body: { ...person, email: 'priya@gmail.com', date, time: '10:00 AM', source: 'home' } });
    assert.equal(bad.status, 400);
    assert.equal((await call('POST', '/public/appointments', { body: { ...person, date, time: '3:17 PM', source: 'home' } })).status, 400, 'not an offered time');
    assert.equal((await call('POST', '/public/appointments', { body: { ...person, date: '2020-01-06', time: '10:00 AM', source: 'home' } })).status, 400, 'not an offered day');

    const ok = await call('POST', '/public/appointments', { body: { ...person, date, time: '10:00 AM', source: 'home' } });
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.match(ok.body.label, /at 10:00 AM IST$/);
    const again = await call('POST', '/public/appointments', { body: { ...person, name: 'Someone Else', email: 'other@zenithbpo.in', date, time: '10:00 AM', source: 'contact' } });
    assert.equal(again.status, 409);
    const after = (await call('GET', '/public/appointments/slots')).body.days[0].times;
    assert.equal(after.find((t) => t.time === '10:00 AM').available, false);
    assert.equal(after.find((t) => t.time === '11:30 AM').available, true);
  });

  test('admin sees the booking, can update it, and a cancelled slot is bookable again', async () => {
    const list = (await call('GET', '/admin/appointments', { token: adminToken })).body;
    assert.equal(list.total, 1);
    const a = list.items[0];
    assert.equal(a.source, 'home');
    assert.equal(a.status, 'booked');
    assert.equal((await call('GET', '/admin/appointments')).status, 401);
    assert.equal((await call('PATCH', `/admin/appointments/${a.id}`, { token: adminToken, body: { status: 'nope' } })).status, 400);
    const confirmed = await call('PATCH', `/admin/appointments/${a.id}`, { token: adminToken, body: { status: 'confirmed', notes: 'called back' } });
    assert.equal(confirmed.body.status, 'confirmed');
    assert.equal((await call('GET', '/admin/appointments/export.csv', { token: adminToken })).status, 200);

    await call('PATCH', `/admin/appointments/${a.id}`, { token: adminToken, body: { status: 'cancelled' } });
    const day = (await call('GET', '/public/appointments/slots')).body.days[0];
    assert.equal(day.times.find((t) => t.time === '10:00 AM').available, true);
  });

  test('booking hours and capacity come from Site settings', async () => {
    const site = (await call('GET', '/admin/settings', { token: adminToken })).body.site;
    assert.equal(site.emails.care, 'care@callmaster.ai');
    const put = await call('PUT', '/admin/settings/site', { token: adminToken, body: { ...site, bookingTimes: ['9:00 AM', '4:30 PM'], bookingDaysAhead: 3 } });
    assert.equal(put.status, 200, JSON.stringify(put.body));
    const { days } = (await call('GET', '/public/appointments/slots')).body;
    assert.equal(days.length, 3);
    assert.deepEqual(days[0].times.map((t) => t.time), ['9:00 AM', '4:30 PM']);
    assert.equal((await call('PUT', '/admin/settings/site', { token: adminToken, body: { ...site, bookingTimes: ['noon'] } })).status, 400);
    await call('POST', '/admin/settings/site/reset', { token: adminToken });
  });

  test('hero video: upload, stream publicly, survive a Home settings save, remove', async () => {
    assert.equal((await call('GET', '/public/branding/hero-video')).status, 404);
    const up = (name, type) => { const form = new FormData(); form.append('file', new Blob(['not-really-a-video'], { type }), name); return call('POST', '/admin/branding/hero-video', { token: adminToken, form }); };
    assert.equal((await up('clip.exe', 'application/octet-stream')).status, 400);
    const ok = await up('clip.mp4', 'video/mp4');
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal((await call('GET', '/public/config')).body.home.heroVideoFile, ok.body.heroVideoFile);
    const res = await fetch(`${base}/api/public/branding/hero-video`, { headers: { Range: 'bytes=0-3' } });
    assert.equal(res.status, 206, 'range requests are honoured so the video can stream/seek');

    const home = (await call('GET', '/admin/settings', { token: adminToken })).body.home;
    const saved = await call('PUT', '/admin/settings/home', { token: adminToken, body: { ...home, heroVideoFile: 'sneaky.mp4', title: 'A new headline' } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.heroVideoFile, ok.body.heroVideoFile, 'the form cannot change the video');
    assert.equal(saved.body.title, 'A new headline');
    await call('POST', '/admin/settings/home/reset', { token: adminToken });
    assert.equal((await call('GET', '/public/config')).body.home.heroVideoFile, ok.body.heroVideoFile, 'reset keeps the video');
    assert.equal((await call('DELETE', '/admin/branding/hero-video', { token: adminToken })).status, 200);
    assert.equal((await call('GET', '/public/branding/hero-video')).status, 404);
  });
});

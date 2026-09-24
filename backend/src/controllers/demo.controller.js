import { env, auditIsLive } from '../config/env.js';
import { Demos } from '../repositories/demos.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { fileMeta, removeUploaded } from '../middleware/common.js';
import { FRAMEWORK_BY_LOB } from '../services/audit/rubrics.js';
import { buildMockAudit } from '../services/audit/mock.js';
import { splitAuditError, startAuditJob } from '../services/audit/pipeline.js';
import { assertVerified } from '../services/otp.service.js';
import { requestDemoCall } from '../services/integrations.service.js';
import { notifyTeam } from '../services/mail.service.js';
import { randomToken, safeEqual } from '../utils/helpers.js';

const DAY = 24 * 3600 * 1000;
const STATUS_COLUMN = { audit: 'audit_status', voice: 'call_status' };

/**
 * Saves (or refreshes) the visitor as soon as they finish the first step of a demo wizard.
 *  - the same browser session going Back and editing → the same row is updated
 *  - an unfinished registration for the same email in the last 24 h → reused, so repeated clicks never duplicate
 *  - otherwise a new row
 * Returns { id, accessToken }; the token is what later steps must present.
 */
async function saveRegistration(type, { id, accessToken, fields, ip }) {
  const token = randomToken(16);
  const create = () => (type === 'audit' ? Demos.registerAudit : Demos.registerVoice)({ ...fields, accessToken: token, ip });

  if (id) {
    const s = await Demos.findSession(id, type);
    if (s && s.access_token && safeEqual(s.access_token, String(accessToken || '')) && s[STATUS_COLUMN[type]] === 'registered') {
      await Demos.updateRegistration(id, { ...fields, accessToken: token });
      return { id: s.id, accessToken: token };
    }
  }
  const open = await Demos.findOpenRegistration(type, fields.email, new Date(Date.now() - DAY));
  if (open) {
    await Demos.updateRegistration(open.id, { ...fields, accessToken: token });
    return { id: open.id, accessToken: token };
  }
  return { id: (await create()).id, accessToken: token };
}

/** Loads a wizard session and checks the caller holds its token. */
async function ownedSession(id, type, token) {
  const s = await Demos.findSession(id, type);
  if (!s || !s.access_token || !safeEqual(s.access_token, String(token || ''))) throw ApiError.notFound('Session not found — please start again');
  return s;
}

// ---------------------------------------------------------------- Insights (call audit)
export const registerAuditDemo = asyncHandler(async (req, res) => {
  const { id, accessToken, ...fields } = req.body;
  const session = await saveRegistration('audit', { id, accessToken, fields, ip: req.ip });
  res.status(201).json({ ok: true, ...session });
});

/**
 * multipart: file + accessToken, lob, rights — attached to the registered visitor.
 * With the Deepgram + Anthropic keys configured the audit runs in the background and the browser polls
 * GET /demos/audit/:id; without them a sandbox scorecard is returned immediately.
 */
export const submitAuditDemo = asyncHandler(async (req, res) => {
  try {
    if (!req.file) throw ApiError.badRequest('Upload a call recording to continue');
    const session = await ownedSession(req.params.id, 'audit', req.body.accessToken);
    if (!['registered', 'failed'].includes(session.audit_status)) throw ApiError.conflict('This call has already been submitted.');

    const { lob } = req.body;
    const live = auditIsLive();
    if (live && env.audit.maxPerEmailPerDay > 0) {
      const used = await Demos.countAuditsByEmailSince(session.email, new Date(Date.now() - DAY));
      if (used >= env.audit.maxPerEmailPerDay) {
        throw new ApiError(429, `This email has reached today's limit of ${env.audit.maxPerEmailPerDay} call audits. Please try again tomorrow, or talk to our team for full access.`);
      }
    }

    const base = { lob, framework: FRAMEWORK_BY_LOB[lob], file: fileMeta(req.file) };
    const who = { Email: session.email, LOB: lob, File: req.file.originalname };

    if (!live) {
      const { results, transcript } = buildMockAudit(lob);
      await Demos.submitAudit(session.id, { ...base, status: 'completed', results, transcript });
      notifyTeam('demo', 'Insights demo run (sandbox scorecard)', who, session.email);
      return res.status(201).json({ ok: true, id: session.id, status: 'completed', results, transcript });
    }

    await Demos.submitAudit(session.id, { ...base, status: 'processing' });
    startAuditJob(session.id);
    notifyTeam('demo', 'Insights demo run', who, session.email);
    return res.status(201).json({ ok: true, id: session.id, status: 'processing', stage: 'transcribing' });
  } catch (err) {
    removeUploaded(req.file);
    throw err;
  }
});

/** Polled by the uploader's browser. The access token proves it is the uploader. */
export const getAuditStatus = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store'); // job status changes every few seconds — never serve a cached copy
  const demo = await Demos.findAuditForPoll(req.params.id);
  if (!demo || !demo.accessToken || !safeEqual(demo.accessToken, String(req.query.token || ''))) throw ApiError.notFound('Audit not found');
  if (demo.status === 'completed') return res.json({ status: 'completed', results: demo.results, transcript: demo.transcript });
  if (demo.status === 'failed') return res.json({ status: 'failed', error: splitAuditError(demo.error).publicMessage || 'We could not audit this call right now. Please try again.' });
  return res.json({ status: demo.status === 'registered' ? 'registered' : 'processing', stage: demo.stage || 'transcribing' });
});

// ---------------------------------------------------------------- Voice Bot demo call
export const registerVoiceDemo = asyncHandler(async (req, res) => {
  const { id, accessToken, ...fields } = req.body;
  const session = await saveRegistration('voice', { id, accessToken, fields, ip: req.ip });
  res.status(201).json({ ok: true, ...session });
});

export const createVoiceDemo = asyncHandler(async (req, res) => {
  const { demoId, demoToken, verifyToken, ...d } = req.body;
  assertVerified(verifyToken, d.phone, 'voice-demo');

  if (env.demoLimitEnabled && (await Demos.voiceTrialUsed(d.phone))) {
    throw ApiError.conflict('This number has already used its one-time trial.');
  }
  // The visitor was saved at step 5; finish that same row (falls back to a new row for older clients).
  const registered = demoId ? await ownedSession(demoId, 'voice', demoToken) : null;
  if (registered && registered.call_status !== 'registered') throw ApiError.conflict('This demo call was already placed.');

  const call = await requestDemoCall({
    phone: d.phone, industry: d.industry, callType: d.callType, gender: d.gender, language: d.language,
    name: d.name, company: d.company, email: d.email,
  });
  if (call.status === 'failed') throw new ApiError(502, 'We could not place the demo call right now. Please try again shortly.');

  let id;
  if (registered) {
    await Demos.completeVoice(registered.id, { ...d, callStatus: call.status });
    id = registered.id;
  } else {
    id = (await Demos.createVoice({ ...d, callStatus: call.status, ip: req.ip })).id;
  }
  notifyTeam('demo', 'Voice Bot demo call', {
    Name: d.name, Organization: d.company, Email: d.email, Phone: d.phone,
    Bot: `${d.language}, ${d.gender}, ${d.callType} · ${d.industry}`,
  }, d.email);
  res.status(201).json({ ok: true, id, callStatus: call.status });
});

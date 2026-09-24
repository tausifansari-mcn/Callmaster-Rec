import { env } from '../config/env.js';
import { isAuditLive } from '../services/audit/config.js';
import { Contacts } from '../repositories/contacts.js';
import { Demos } from '../repositories/demos.js';
import { Leads } from '../repositories/leads.js';
import { Pages } from '../repositories/pages.js';
import { Whitepapers } from '../repositories/whitepapers.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getAllSettings } from '../services/settings.service.js';
import { publicPaymentConfig } from '../services/payment.service.js';
import { notifyTeam, sendContactAutoReply } from '../services/mail.service.js';
import { sendOtp, verifyOtp } from '../services/otp.service.js';

/** Everything the site needs to render, in one round trip. */
export const getConfig = asyncHandler(async (_req, res) => {
  const [settings, footerPages, live, papers] = await Promise.all([getAllSettings(), Pages.listFooter(), isAuditLive(), Whitepapers.listActive()]);
  res.json({
    ...settings,
    footerPages,
    payment: publicPaymentConfig(),
    sandbox: env.sandboxMode,
    limits: { uploadMaxMb: env.uploadMaxMb },
    audit: { live },
    whitepapers: papers.map((p) => ({ slug: p.slug, title: p.title, description: p.description, available: Boolean(p.file) })),
  });
});

export const getPage = asyncHandler(async (req, res) => {
  const page = await Pages.findPublishedBySlug(req.params.slug);
  if (!page) throw ApiError.notFound('Page not found');
  res.json({ slug: page.slug, title: page.title, sections: page.sections, updatedAt: page.updatedAt });
});

export const submitContact = asyncHandler(async (req, res) => {
  const c = req.body;
  await Contacts.create({ ...c, ip: req.ip });
  // Fire-and-forget: a mail problem must never make the visitor's submission fail (it is already saved).
  notifyTeam('contact', 'New contact message', {
    Name: c.name, Organization: c.organization, Email: c.email, Phone: c.phone, Interest: c.interest, Message: c.message,
  }, c.email);
  sendContactAutoReply(c);
  res.status(201).json({ ok: true });
});

export const submitLead = asyncHandler(async (req, res) => {
  const l = req.body;
  await Leads.create({ ...l, source: 'insights-pricing', ip: req.ip });
  notifyTeam('lead', 'New pricing request — Deep Customer Insights', {
    Name: l.name, Organization: l.organization, Email: l.email, Phone: l.phone,
    'Call type': l.callType, Volume: l.monthlyVolume, 'QA setup': l.qaSetup,
  }, l.email);
  res.status(201).json({ ok: true });
});

// ---------------------------------------------------------------- OTP
export const otpSend = asyncHandler(async (req, res) => {
  const { purpose } = req.body;
  const target = purpose === 'voice-demo' ? req.body.phone : req.body.email;

  if (purpose === 'voice-demo' && env.demoLimitEnabled && (await Demos.voiceTrialUsed(target))) {
    throw ApiError.conflict('This number has already used its one-time trial.');
  }
  const result = await sendOtp({ target, purpose });
  res.json({ ok: true, ...result });
});

export const otpVerify = asyncHandler(async (req, res) => {
  const verifyToken = await verifyOtp(req.body);
  res.json({ ok: true, verifyToken });
});

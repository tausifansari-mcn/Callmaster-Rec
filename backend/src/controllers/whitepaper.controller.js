import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Customers } from '../repositories/customers.js';
import { Cancellations } from '../repositories/cancellations.js';
import { Orders } from '../repositories/orders.js';
import { WhitepaperLeads, Whitepapers } from '../repositories/whitepapers.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { UPLOAD_KINDS, fileMeta, removeUploaded } from '../middleware/common.js';
import { getSetting, saveSetting } from '../services/settings.service.js';
import { issueTempPassword } from '../services/customer.service.js';
import { notifyTeam } from '../services/mail.service.js';
import { handlers } from './resourceHandlers.js';

const removeStored = (kind, storedName) => {
  if (!storedName) return;
  fs.promises.unlink(path.join(env.uploadDir, kind, path.basename(storedName))).catch(() => {});
};
const filePath = (kind, storedName) => path.join(env.uploadDir, kind, path.basename(storedName));

// ---------------------------------------------------------------- public: white papers
/** Saves the visitor's name + work email, then hands back a short-lived link to the PDF (if one has been uploaded). */
export const unlockWhitepaper = asyncHandler(async (req, res) => {
  const paper = await Whitepapers.findActiveBySlug(req.params.slug);
  if (!paper) throw ApiError.notFound('This white paper is not available');
  const { name, email } = req.body;
  const available = Boolean(paper.file && fs.existsSync(filePath(UPLOAD_KINDS.whitepapers, paper.file.storedName)));

  await WhitepaperLeads.create({ whitepaperId: paper.id, whitepaperTitle: paper.title, name, email, delivered: available, ip: req.ip });
  notifyTeam('lead', `White paper request — ${paper.title}`, { Name: name, Email: email, 'White paper': paper.title, Delivered: available ? 'yes' : 'no PDF uploaded yet' }, email);

  if (!available) return res.status(201).json({ ok: true, available: false, title: paper.title });
  const token = jwt.sign({ kind: 'wp-download', wp: paper.id }, env.jwtSecret, { expiresIn: '10m' });
  return res.status(201).json({ ok: true, available: true, title: paper.title, url: `/api/public/whitepapers/download?token=${encodeURIComponent(token)}` });
});

export const downloadWhitepaper = asyncHandler(async (req, res) => {
  let payload;
  try {
    payload = jwt.verify(String(req.query.token || ''), env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('This download link has expired. Please request the paper again.');
  }
  if (payload.kind !== 'wp-download') throw ApiError.unauthorized();
  const paper = await Whitepapers.findById(payload.wp);
  if (!paper?.file || !fs.existsSync(filePath(UPLOAD_KINDS.whitepapers, paper.file.storedName))) throw ApiError.notFound('This white paper is not available');
  await Whitepapers.incrementDownloads(paper.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${paper.slug}.pdf"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(filePath(UPLOAD_KINDS.whitepapers, paper.file.storedName));
});

// ---------------------------------------------------------------- public: logo
export const getLogo = asyncHandler(async (_req, res) => {
  const site = await getSetting('site');
  if (!site.logoFile || !fs.existsSync(filePath(UPLOAD_KINDS.branding, site.logoFile))) throw ApiError.notFound('No logo uploaded');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(filePath(UPLOAD_KINDS.branding, site.logoFile));
});

// ---------------------------------------------------------------- public: hero video (streams with Range support)
export const getHeroVideo = asyncHandler(async (_req, res) => {
  const home = await getSetting('home');
  if (!home.heroVideoFile || !fs.existsSync(filePath(UPLOAD_KINDS.branding, home.heroVideoFile))) throw ApiError.notFound('No hero video uploaded');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(filePath(UPLOAD_KINDS.branding, home.heroVideoFile));
});

// ---------------------------------------------------------------- admin: logo & hero video
/** Points a branding setting (site.logoFile / home.heroVideoFile) at a new file and deletes the one it replaces. */
async function setBrandingFile(req, settingKey, field, value) {
  const current = await getSetting(settingKey);
  const previous = current[field];
  await saveSetting(settingKey, { ...current, [field]: value }, req.admin.email);
  if (previous && previous !== value) removeStored(UPLOAD_KINDS.branding, previous);
}
const setLogoFile = (req, logoFile) => setBrandingFile(req, 'site', 'logoFile', logoFile);

export const uploadHeroVideoFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose a video to upload');
  await setBrandingFile(req, 'home', 'heroVideoFile', req.file.filename);
  res.json({ ok: true, heroVideoFile: req.file.filename });
});

export const deleteHeroVideo = asyncHandler(async (req, res) => {
  await setBrandingFile(req, 'home', 'heroVideoFile', '');
  res.json({ ok: true });
});

export const uploadLogoFile = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose an image to upload');
  await setLogoFile(req, req.file.filename);
  res.json({ ok: true, logoFile: req.file.filename });
});

export const deleteLogo = asyncHandler(async (req, res) => {
  await setLogoFile(req, '');
  res.json({ ok: true });
});

// ---------------------------------------------------------------- admin: white papers
export const listWhitepapers = asyncHandler(async (_req, res) => res.json({ items: await Whitepapers.listAll() }));

export const createWhitepaper = asyncHandler(async (req, res) => res.status(201).json(await Whitepapers.create(req.body)));

export const updateWhitepaper = asyncHandler(async (req, res) => {
  if (!(await Whitepapers.findById(req.params.id))) throw ApiError.notFound();
  res.json(await Whitepapers.update(req.params.id, req.body));
});

export const deleteWhitepaper = asyncHandler(async (req, res) => {
  const paper = await Whitepapers.findById(req.params.id);
  if (!paper) throw ApiError.notFound();
  await Whitepapers.remove(paper.id);
  removeStored(UPLOAD_KINDS.whitepapers, paper.file?.storedName);
  res.json({ ok: true });
});

export const uploadWhitepaperPdf = asyncHandler(async (req, res) => {
  try {
    const paper = await Whitepapers.findById(req.params.id);
    if (!paper) throw ApiError.notFound();
    if (!req.file) throw ApiError.badRequest('Choose a PDF to upload');
    const updated = await Whitepapers.setFile(paper.id, fileMeta(req.file));
    removeStored(UPLOAD_KINDS.whitepapers, paper.file?.storedName);
    res.json(updated);
  } catch (err) {
    removeUploaded(req.file);
    throw err;
  }
});

export const removeWhitepaperPdf = asyncHandler(async (req, res) => {
  const paper = await Whitepapers.findById(req.params.id);
  if (!paper) throw ApiError.notFound();
  const updated = await Whitepapers.setFile(paper.id, null);
  removeStored(UPLOAD_KINDS.whitepapers, paper.file?.storedName);
  res.json(updated);
});

export const whitepaperLeadsResource = handlers(WhitepaperLeads, {
  csvColumns: [
    { label: 'Created', key: 'createdAt' }, { label: 'Status', key: 'status' }, { label: 'White paper', key: 'whitepaper' },
    { label: 'Name', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'PDF delivered', value: (r) => (r.delivered ? 'yes' : 'no') }, { label: 'Notes', key: 'notes' },
  ],
});

// ---------------------------------------------------------------- admin: cancellations
export const cancellationsResource = handlers(Cancellations, {
  csvColumns: [
    { label: 'Created', key: 'createdAt' }, { label: 'Status', key: 'status' }, { label: 'Order ID', key: 'orderRef' }, { label: 'Email', key: 'email' },
    { label: 'Source', key: 'source' }, { label: 'Order matched', value: (r) => (r.matched ? 'yes' : 'no') }, { label: 'Inside window', value: (r) => (r.eligible ? 'yes' : 'no') },
    { label: 'Refund', key: 'refundAmount' }, { label: 'Notes', key: 'notes' },
  ],
  // Keep the order in step with the request: approving cancels it, marking the refund as paid closes it out.
  afterPatch: async (request) => {
    if (!request.orderPk) return;
    if (request.status === 'approved') await Orders.markCancelled(request.orderPk);
    if (request.status === 'refunded') { await Orders.markCancelled(request.orderPk); await Orders.markRefunded(request.orderPk); }
  },
});

// ---------------------------------------------------------------- admin: customer accounts
export const customersResource = handlers(Customers);

export const setCustomerActive = asyncHandler(async (req, res) => {
  const account = await Customers.findById(req.params.id);
  if (!account) throw ApiError.notFound();
  await Customers.setActive(account.id, Boolean(req.body.active));
  res.json(await Customers.findById(account.id));
});

/** New temporary password, shown once to the admin (never stored in the clear); the customer must change it at next sign-in. */
export const resetCustomerPassword = asyncHandler(async (req, res) => {
  const account = await Customers.findById(req.params.id);
  if (!account) throw ApiError.notFound();
  res.json({ ok: true, username: account.username, tempPassword: await issueTempPassword(account.id) });
});

import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { Contacts } from '../repositories/contacts.js';
import { Demos } from '../repositories/demos.js';
import { Leads } from '../repositories/leads.js';
import { Orders } from '../repositories/orders.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { UPLOAD_KINDS } from '../middleware/common.js';
import { toCsv } from '../utils/helpers.js';
import { sendReplyToContact } from '../services/mail.service.js';

const removeFile = (kind, storedName) => {
  if (!storedName) return;
  fs.promises.unlink(path.join(env.uploadDir, kind, path.basename(storedName))).catch(() => {});
};

/** Wires a repository's list / get / patch / delete / CSV export to HTTP handlers. */
function handlers(repo, { csvColumns, cleanup }) {
  return {
    list: asyncHandler(async (req, res) => res.json(await repo.list(req.query))),
    get: asyncHandler(async (req, res) => res.json(await repo.get(req.params.id))),
    update: asyncHandler(async (req, res) => res.json(await repo.patch(req.params.id, req.body))),
    remove: asyncHandler(async (req, res) => {
      const doc = await repo.remove(req.params.id);
      cleanup?.(doc);
      res.json({ ok: true });
    }),
    exportCsv: asyncHandler(async (req, res) => {
      const rows = await repo.all(req.query);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${req.path.split('/')[1] || 'export'}-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(`﻿${toCsv(rows, csvColumns)}`);
    }),
  };
}

export const ordersResource = handlers(Orders, {
  csvColumns: [
    { label: 'Order ID', key: 'orderId' }, { label: 'Created', key: 'createdAt' }, { label: 'Status', key: 'status' },
    { label: 'Product', key: 'product' }, { label: 'Plan', key: 'plan' }, { label: 'Subtotal', key: 'subtotal' },
    { label: 'Discount code', key: 'discountCode' }, { label: 'Discount', key: 'discountAmount' }, { label: 'GST', key: 'gst' },
    { label: 'Total', key: 'total' }, { label: 'Company', value: (r) => r.customer.company }, { label: 'Contact', value: (r) => r.customer.contact },
    { label: 'Email', value: (r) => r.customer.email }, { label: 'Phone', value: (r) => r.customer.phone }, { label: 'GST number', value: (r) => r.customer.gstNumber },
  ],
  cleanup: (o) => removeFile(UPLOAD_KINDS.sow, o.scopeOfWork?.storedName),
});

export const leadsResource = handlers(Leads, {
  csvColumns: [
    { label: 'Created', key: 'createdAt' }, { label: 'Status', key: 'status' }, { label: 'Name', key: 'name' },
    { label: 'Organization', key: 'organization' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
    { label: 'Call type', key: 'callType' }, { label: 'Monthly volume', key: 'monthlyVolume' }, { label: 'QA setup', key: 'qaSetup' },
    { label: 'Notes', key: 'notes' },
  ],
});

export const contactsResource = handlers(Contacts, {
  csvColumns: [
    { label: 'Created', key: 'createdAt' }, { label: 'Status', key: 'status' }, { label: 'Name', key: 'name' },
    { label: 'Organization', key: 'organization' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
    { label: 'Interest', key: 'interest' }, { label: 'Message', key: 'message' }, { label: 'Notes', key: 'notes' },
  ],
});

/** Emails a reply to the person who wrote in and marks the message as replied. */
export const replyToContact = asyncHandler(async (req, res) => {
  const contact = await Contacts.get(req.params.id);
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();
  if (!subject || !message) throw ApiError.badRequest('Enter a subject and a message');
  const result = await sendReplyToContact({ to: contact.email, subject, message, replyTo: req.admin.email });
  if (!result.sent) throw ApiError.badRequest(`The email could not be sent: ${result.reason}`);
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const entry = `[${stamp} UTC] Reply sent by ${req.admin.email}: ${subject}`;
  const note = contact.notes ? `${contact.notes}

${entry}` : entry;
  res.json(await Contacts.patch(req.params.id, { status: 'replied', notes: note }));
});

export const demosResource = handlers(Demos, {
  csvColumns: [
    { label: 'Created', key: 'createdAt' }, { label: 'Type', key: 'type' }, { label: 'Name', key: 'name' },
    { label: 'Company', key: 'company' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
    { label: 'LOB', key: 'lob' }, { label: 'Framework', key: 'framework' }, { label: 'Score', value: (r) => r.results?.score },
    { label: 'Industry', key: 'industry' }, { label: 'Call type', key: 'callType' }, { label: 'Gender', key: 'gender' },
    { label: 'Language', key: 'language' }, { label: 'Call status', key: 'callStatus' },
  ],
  cleanup: (d) => removeFile(UPLOAD_KINDS.audio, d.file?.storedName),
});

export const downloadFile = asyncHandler(async (req, res) => {
  const { kind, filename } = req.params;
  if (!Object.values(UPLOAD_KINDS).includes(kind)) throw ApiError.notFound();
  const full = path.join(env.uploadDir, kind, path.basename(filename));
  if (!fs.existsSync(full)) throw ApiError.notFound('File no longer exists (it may have passed the retention window)');
  res.download(full);
});

// ---------------------------------------------------------------- dashboard
const PAID = "('paid','fulfilled')";

export const stats = asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 13 * 24 * 3600 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const series = (table) => query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS n FROM ${table} WHERE created_at >= ? GROUP BY d`, [since]);
  const count = async (sql) => (await query(sql))[0].n;

  const [paidOrders, revenueRow, leads, newLeads, contacts, newContacts, demoTypes, demoRegistered, byProduct, recentOrders, recentLeads, recentContacts, oSeries, lSeries, cSeries] = await Promise.all([
    count(`SELECT COUNT(*) AS n FROM orders WHERE status IN ${PAID}`),
    query(`SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status IN ${PAID}`),
    count('SELECT COUNT(*) AS n FROM leads'),
    count("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'"),
    count('SELECT COUNT(*) AS n FROM contacts'),
    count("SELECT COUNT(*) AS n FROM contacts WHERE status = 'new'"),
    // "registered" = finished step 1 but never uploaded a call / placed the demo — counted separately from real runs
    query("SELECT type, COUNT(*) AS n FROM demo_sessions WHERE NOT (audit_status <=> 'registered' OR call_status = 'registered') GROUP BY type"),
    count("SELECT COUNT(*) AS n FROM demo_sessions WHERE audit_status = 'registered' OR call_status = 'registered'"),
    query(`SELECT product, COUNT(*) AS n, SUM(total) AS total FROM orders WHERE status IN ${PAID} GROUP BY product ORDER BY total DESC`),
    Orders.list({ limit: 6 }),
    Leads.list({ limit: 6 }),
    Contacts.list({ limit: 6 }),
    series('orders'), series('leads'), series('contacts'),
  ]);

  const days = [];
  for (let i = 13; i >= 0; i -= 1) days.push(new Date(Date.now() - i * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const pick = (rows) => Object.fromEntries(rows.map((x) => [x.d, x.n]));
  const [o, l, c] = [pick(oSeries), pick(lSeries), pick(cSeries)];

  res.json({
    totals: {
      paidOrders,
      revenue: revenueRow[0].total,
      leads, newLeads, contacts, newContacts,
      auditDemos: demoTypes.find((d) => d.type === 'audit')?.n || 0,
      voiceDemos: demoTypes.find((d) => d.type === 'voice')?.n || 0,
      demoRegistered,
    },
    byProduct: byProduct.map((p) => ({ product: p.product, orders: p.n, revenue: p.total })),
    series: days.map((date) => ({ date, orders: o[date] || 0, leads: l[date] || 0, contacts: c[date] || 0 })),
    recent: { orders: recentOrders.items, leads: recentLeads.items, contacts: recentContacts.items },
  });
});

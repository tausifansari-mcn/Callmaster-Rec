import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml, money } from '../utils/helpers.js';
import { getEmailSettings } from './settings.service.js';

// ---------------------------------------------------------------- configuration
/**
 * Effective mail configuration: what the admin saved under "Email & notifications" wins,
 * with SMTP_* / MAIL_FROM / NOTIFY_EMAIL from backend/.env as the fallback.
 */
export async function getMailConfig() {
  const s = await getEmailSettings();
  const useDb = Boolean(s.smtp.host);
  const smtp = useDb
    ? { host: s.smtp.host, port: Number(s.smtp.port) || 587, secure: Boolean(s.smtp.secure), user: s.smtp.user, pass: s.smtp.pass }
    : { ...env.smtp };
  const fromEmail = s.fromEmail || (useDb ? s.smtp.user : '');
  const from = fromEmail ? `"${(s.fromName || 'CallMaster').replace(/"/g, '')}" <${fromEmail}>` : env.smtp.from;
  const notifyTo = (s.notifyTo || env.notifyEmail || '').split(',').map((x) => x.trim()).filter(Boolean);
  return { configured: Boolean(smtp.host), source: useDb ? 'admin panel' : '.env', smtp, from, notifyTo, notify: s.notify, autoReply: s.autoReply };
}

let cached = { key: '', transporter: null };
function transporterFor(smtp) {
  const key = JSON.stringify(smtp);
  if (cached.key !== key) {
    cached = {
      key,
      transporter: nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
        // Requests (OTP, contact form) wait on this, so fail fast rather than hang on a bad host.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      }),
    };
  }
  return cached.transporter;
}

/** Never throws: callers decide whether a failed send matters. `reason` carries the SMTP error for the admin UI. */
export async function sendMail({ to, subject, html, text, replyTo, icalEvent }) {
  if (!to || (Array.isArray(to) && !to.length)) return { sent: false, reason: 'no-recipient' };
  const cfg = await getMailConfig();
  if (!cfg.configured) {
    console.log(`[mail] SMTP not configured — would send to ${[].concat(to).join(', ')}: "${subject}"`);
    return { sent: false, reason: 'SMTP is not configured yet' };
  }
  try {
    await transporterFor(cfg.smtp).sendMail({ from: cfg.from, to, subject, html, text, replyTo, icalEvent });
    return { sent: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

const shell = (title, body) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1a1d26">
<h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>${body}
<p style="color:#7a8094;font-size:12px;margin-top:24px">CallMaster</p></div>`;

const textToHtml = (t) => escapeHtml(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const fill = (tpl, vars) => String(tpl).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');

// ---------------------------------------------------------------- customer-facing mail
export function sendOtpEmail(to, code) {
  return sendMail({
    to,
    subject: `Your CallMaster verification code: ${code}`,
    text: `Your CallMaster verification code is ${code}. It expires in 10 minutes.`,
    html: shell('Verify your email', `<p>Your verification code is</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${escapeHtml(code)}</p><p>It expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`),
  });
}

/**
 * Welcome + receipt sent after payment. `extra` carries the dashboard account (username and, for a brand-new
 * account, the temporary password) and the cancellation policy so Cloud Telephony buyers see their refund window.
 */
export function sendOrderReceipt(order, extra = {}) {
  const { account, created, tempPassword, policy } = extra;
  const rows = (order.mode === 'cart' ? order.rows : [{ label: `${order.product} — ${order.plan}`, sub: `${order.qty} × ${money(order.unitPrice)}${order.unit}`, value: order.subtotal }])
    .map((r) => `<tr><td style="padding:4px 0">${escapeHtml(r.label)}${r.sub ? ` <span style="color:#7a8094">(${escapeHtml(r.sub)})</span>` : ''}</td><td style="text-align:right">${money(r.value)}</td></tr>`)
    .join('');
  const loginUrl = `${env.publicSiteUrl}/account`;
  const isCT = order.productKey === 'cloud-telephony';

  const accountBlock = account
    ? `<p><b>Your account is ready.</b> Manage billing and your subscription anytime from the CallMaster dashboard: <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a></p>${
      created
        ? `<p style="font-family:monospace;background:#eefaf5;border:1px solid #bfe8d8;border-radius:6px;padding:8px 10px">Username: ${escapeHtml(account.username)}<br>Temporary password: ${escapeHtml(tempPassword)} (you'll be asked to change this on first login)</p>`
        : `<p>This order was added to your existing account (username <b>${escapeHtml(account.username)}</b>).</p>`}`
    : '';
  const ctBlock = isCT && policy
    ? `<p><b>Your welcome offer:</b> for your first billing month, we'll audit 2% of your call volume through Deep Customer Insights and share the results with you at no extra cost.</p>
<p><b>Cancellation &amp; refunds:</b> you can cancel within ${policy.windowDays} days of this purchase for a full refund, processed to your original payment method within ${policy.refundDays} working days. You can cancel from your dashboard: <a href="${escapeHtml(loginUrl)}">${escapeHtml(loginUrl)}</a>.</p>`
    : '';

  const text = [
    `Hi ${order.customer.contact},`,
    `Thanks for purchasing ${order.product} (${order.plan}). We've received your payment of ${money(order.total)} against Order ${order.orderId}.`,
    account ? `Your dashboard: ${loginUrl}\nUsername: ${account.username}${created ? `\nTemporary password: ${tempPassword} (change it on first login)` : ''}` : '',
    isCT && policy ? `Welcome offer: we'll audit 2% of your first billing month's calls at no extra cost. Cancel within ${policy.windowDays} days for a full refund (processed within ${policy.refundDays} working days).` : '',
  ].filter(Boolean).join('\n\n');

  return sendMail({
    to: order.customer.email,
    subject: `Welcome to CallMaster — your ${order.product} purchase is confirmed`,
    text,
    html: shell('Welcome to CallMaster', `<p>Hi ${escapeHtml(order.customer.contact)},</p>
<p>Thanks for purchasing <b>${escapeHtml(order.product)}</b> (${escapeHtml(order.plan)}). We've received your payment of <b>${money(order.total)}</b> against Order <b>${escapeHtml(order.orderId)}</b> — your receipt is below.</p>
<table style="width:100%;border-collapse:collapse">${rows}
${order.discountAmount ? `<tr><td>Discount (${escapeHtml(order.discountCode)})</td><td style="text-align:right">−${money(order.discountAmount)}</td></tr>` : ''}
<tr><td>GST (${order.gstRate}%)</td><td style="text-align:right">${money(order.gst)}</td></tr>
<tr><td style="border-top:1px solid #ddd;padding-top:8px"><b>Total paid</b></td><td style="border-top:1px solid #ddd;padding-top:8px;text-align:right"><b>${money(order.total)}</b></td></tr></table>
${accountBlock}${ctBlock}
<p>Questions? Just reply to this email or reach the helpline from the site. Our team will reach out on ${escapeHtml(order.customer.phone)} if any setup step needs you.</p>`),
  });
}

/** Confirmation to the email registered on the order (never to an address typed into a public form). */
export function sendCancellationEmail({ order, eligible, approved, policy }) {
  const amount = money(order.total);
  const body = approved
    ? `<p>Order <b>${escapeHtml(order.orderId)}</b> has been cancelled. A refund of <b>${amount}</b> will reach your original payment method within ${policy.refundDays} working days.</p>`
    : eligible
      ? `<p>We've received your cancellation request for order <b>${escapeHtml(order.orderId)}</b>. It is inside the ${policy.windowDays}-day cancellation window, so it qualifies for a full refund of <b>${amount}</b>, processed to your original payment method within ${policy.refundDays} working days once our team confirms it.</p>`
      : `<p>We've received your cancellation request for order <b>${escapeHtml(order.orderId)}</b>. It is outside the ${policy.windowDays}-day cancellation window, so our team will review it and get back to you.</p>`;
  return sendMail({
    to: order.customer.email,
    subject: approved ? `Order ${order.orderId} cancelled` : `Cancellation request received — order ${order.orderId}`,
    text: approved ? `Order ${order.orderId} has been cancelled. A refund of ${amount} will reach your original payment method within ${policy.refundDays} working days.` : `We've received your cancellation request for order ${order.orderId}.`,
    html: shell(approved ? 'Cancellation confirmed' : 'Cancellation request received', body),
  });
}

/** A calendar invite (.ics) for a booked call — 30 minutes from the slot start. */
function inviteFor(appt) {
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(appt.slotStart);
  const end = new Date(start.getTime() + 30 * 60000);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CallMaster//Call booking//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:appointment-${appt.id}@callmaster`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    'SUMMARY:Call with the CallMaster team', `DESCRIPTION:Booked by ${appt.name} (${appt.organization}).`, 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/** Confirmation to the person who booked a call, with a calendar invite attached. */
export function sendAppointmentConfirmation(appt) {
  const body = `Hi ${appt.name},\n\nYour call with the CallMaster team is booked for ${appt.slotLabel}. A calendar invite is attached — our team will call you on ${appt.phone}.\n\nNeed to change the time? Just reply to this email.\n\nRegards,\nTeam CallMaster`;
  return sendMail({
    to: appt.email,
    subject: `Your CallMaster call is booked — ${appt.slotLabel}`,
    text: body,
    html: shell('Your call is booked', textToHtml(body)),
    icalEvent: { method: 'PUBLISH', content: inviteFor(appt) },
  });
}

/** Optional "we got your message" email to whoever used the Contact form (admin-configurable text). */
export async function sendContactAutoReply(contact) {
  const { autoReply } = await getMailConfig();
  if (!autoReply.enabled) return { sent: false, reason: 'auto-reply-disabled' };
  const vars = { name: contact.name, organization: contact.organization, email: contact.email };
  const body = fill(autoReply.body, vars);
  return sendMail({ to: contact.email, subject: fill(autoReply.subject, vars), text: body, html: shell(fill(autoReply.subject, vars), textToHtml(body)) });
}

/** A reply typed by an admin in the panel, sent to the person who wrote in. */
export function sendReplyToContact({ to, subject, message, replyTo }) {
  return sendMail({ to, subject, text: message, html: shell(subject, textToHtml(message)), replyTo });
}

export async function sendTestEmail(to) {
  const cfg = await getMailConfig();
  const res = await sendMail({
    to,
    subject: 'CallMaster — test email',
    text: 'This is a test email from the CallMaster admin panel. Your email settings work.',
    html: shell('Test email', '<p>This is a test email from the CallMaster admin panel. Your email settings work.</p>'),
  });
  return { ...res, source: cfg.source };
}

// ---------------------------------------------------------------- internal notifications
/**
 * Heads-up to the configured inbox(es). `kind` is one of contact | lead | order | demo and can be switched off
 * individually in the admin panel. `replyTo` lets you answer the customer straight from your mail client.
 */
export async function notifyTeam(kind, subject, fields, replyTo) {
  const cfg = await getMailConfig();
  if (!cfg.notifyTo.length || cfg.notify[kind] === false) return { sent: false, reason: 'notifications-off' };
  const list = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><td style="padding:3px 12px 3px 0;color:#7a8094;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('');
  return sendMail({
    to: cfg.notifyTo,
    subject: `[CallMaster] ${subject}`,
    text: Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: shell(subject, `<table>${list}</table>`),
    replyTo,
  });
}

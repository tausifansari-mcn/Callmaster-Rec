import crypto from 'node:crypto';

export const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'ymail.com', 'hotmail.com', 'outlook.com',
  'live.com', 'rediffmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com',
];

export const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PHONE_RE = /^\d{10}$/;
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
export const isOfficialEmail = (v) => {
  if (!isEmail(v)) return false;
  return !FREE_EMAIL_DOMAINS.includes(String(v).split('@')[1].toLowerCase());
};

export const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const randomDigits = (len = 4) => {
  const min = 10 ** (len - 1);
  return String(crypto.randomInt(min, min * 10));
};
export const randomToken = (bytes = 12) => crypto.randomBytes(bytes).toString('hex');
export const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
export const safeEqual = (a, b) => {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Deep-merge `overrides` onto `base`. Arrays and scalars in `overrides` replace, objects merge. */
export function deepMerge(base, overrides) {
  if (Array.isArray(base) || Array.isArray(overrides)) return overrides === undefined ? base : overrides;
  if (base && typeof base === 'object' && overrides && typeof overrides === 'object') {
    const out = { ...base };
    for (const k of Object.keys(overrides)) out[k] = deepMerge(base[k], overrides[k]);
    return out;
  }
  return overrides === undefined ? base : overrides;
}

export function toCsv(rows, columns) {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(','));
  return [head, ...body].join('\r\n');
}

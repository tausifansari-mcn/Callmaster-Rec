export const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'ymail.com', 'hotmail.com', 'outlook.com',
  'live.com', 'rediffmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com',
];
export const GST_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PHONE_RE = /^\d{10}$/;

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isOfficialEmail = (v) => isEmail(v) && !FREE_EMAIL_DOMAINS.includes(v.split('@')[1].toLowerCase());

export const ERR = {
  name: 'Enter your name',
  org: 'Enter your organization',
  email: 'Enter a valid email',
  officialEmail: "Enter a valid work email — personal addresses (Gmail, Yahoo, etc.) aren't accepted",
  phone: 'Enter a valid 10-digit number',
  gst: 'Enter a valid 15-character GST number',
};

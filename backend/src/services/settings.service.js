import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Settings } from '../repositories/settings.js';
import { DEFAULT_SETTINGS } from '../seed/defaults.js';
import { deepMerge } from '../utils/helpers.js';

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);
/** Settings that must never be sent to the public site (they hold secrets / internal routing). */
export const PRIVATE_SETTING_KEYS = ['email'];
export const PUBLIC_SETTING_KEYS = SETTING_KEYS.filter((k) => !PRIVATE_SETTING_KEYS.includes(k));

export const SECRET_MASK = '********';

// ---------------------------------------------------------------- secrets at rest (SMTP password)
const secretKey = () => crypto.createHash('sha256').update(`callmaster-settings:${env.jwtSecret}`).digest();

function encryptSecret(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
}

function decryptSecret(stored) {
  if (!stored || !String(stored).startsWith('enc:v1:')) return stored || '';
  try {
    const [, , iv, tag, data] = String(stored).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return ''; // JWT_SECRET changed since the password was saved — it has to be re-entered
  }
}

// ---------------------------------------------------------------- read / write
/** Stored value merged over the shipped defaults, so a newly added field never comes back undefined. */
export async function getSetting(key) {
  const stored = await Settings.all([key]);
  return deepMerge(DEFAULT_SETTINGS[key], stored[key]);
}

/** Everything the public site may see. */
export async function getAllSettings() {
  const stored = await Settings.all(PUBLIC_SETTING_KEYS);
  return Object.fromEntries(PUBLIC_SETTING_KEYS.map((k) => [k, deepMerge(DEFAULT_SETTINGS[k], stored[k])]));
}

const masked = (all) => {
  all.email.smtp.pass = all.email.smtp.pass ? SECRET_MASK : '';
  return all;
};

/** Everything the admin panel edits; secrets are replaced by a mask. */
export async function getAdminSettings() {
  const stored = await Settings.all(SETTING_KEYS);
  return masked(Object.fromEntries(SETTING_KEYS.map((k) => [k, deepMerge(DEFAULT_SETTINGS[k], stored[k])])));
}

/** Email settings with the SMTP password decrypted — for the mail service only. */
export async function getEmailSettings() {
  const email = await getSetting('email');
  return { ...email, smtp: { ...email.smtp, pass: decryptSecret(email.smtp.pass) } };
}

const forAdmin = async (key) => (key === 'email' ? (await getAdminSettings()).email : getSetting(key));

export async function saveSetting(key, value, updatedBy) {
  let toStore = value;
  if (key === 'email') {
    const current = (await getSetting('email')).smtp.pass;
    // The browser only ever sees the mask: keep the stored password unless a new one was typed.
    const pass = value.smtp.pass === SECRET_MASK ? current : encryptSecret(value.smtp.pass);
    toStore = { ...value, smtp: { ...value.smtp, pass } };
  }
  await Settings.save(key, toStore, updatedBy);
  return forAdmin(key);
}

export async function resetSetting(key) {
  await Settings.remove(key);
  return forAdmin(key);
}

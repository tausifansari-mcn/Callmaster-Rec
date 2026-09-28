import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Settings } from '../repositories/settings.js';
import { DEFAULT_SETTINGS } from '../seed/defaults.js';
import { deepMerge } from '../utils/helpers.js';

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);
/** Settings that must never be sent to the public site (they hold secrets / internal routing). */
export const PRIVATE_SETTING_KEYS = ['email', 'integrations'];
export const PUBLIC_SETTING_KEYS = SETTING_KEYS.filter((k) => !PRIVATE_SETTING_KEYS.includes(k));
/** Settings that only a super admin may change (credentials for paid third-party services). */
export const SUPERADMIN_ONLY_KEYS = ['integrations'];

export const SECRET_MASK = '********';

/** Secret fields inside each private setting: encrypted at rest, masked in every response. */
const SECRET_FIELDS = {
  email: [['smtp', 'pass']],
  integrations: [['deepgram', 'apiKey'], ['anthropic', 'apiKey']],
};

const getPath = (obj, p) => p.reduce((o, k) => (o == null ? o : o[k]), obj);
const setPath = (obj, p, value) => {
  let o = obj;
  p.slice(0, -1).forEach((k) => { o[k] = o[k] || {}; o = o[k]; });
  o[p[p.length - 1]] = value;
};
const isMasked = (v) => typeof v === 'string' && v.startsWith(SECRET_MASK);

// ---------------------------------------------------------------- secrets at rest
const secretKey = () => crypto.createHash('sha256').update(`callmaster-settings:${env.jwtSecret}`).digest();

function encryptSecret(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
}

export function decryptSecret(stored) {
  if (!stored || !String(stored).startsWith('enc:v1:')) return stored || '';
  try {
    const [, , iv, tag, data] = String(stored).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return ''; // JWT_SECRET changed since the secret was saved — it has to be re-entered
  }
}

/** "********" for passwords; API keys keep their last 4 characters so you can tell which key is set. */
const maskFor = (key, path, plain) => {
  if (!plain) return '';
  return key === 'integrations' ? `${SECRET_MASK}${plain.slice(-4)}` : SECRET_MASK;
};

/**
 * integrations.custom is a free-form list of extra API keys — for a provider that isn't wired into any feature yet
 * (OpenAI, ElevenLabs, a webhook secret, anything). An admin can add/rename/rotate/remove these without a code
 * change; a developer later reads one with `getCustomApiKey(name)`. Each item's key is masked/encrypted on its own
 * `id` (set once, client-side, when the row is added) rather than its position, so reordering never mixes up
 * two rows' keys the way index-matching would.
 */
function maskCustomKeys(value) {
  value.custom = (value.custom || []).map((item) => ({ ...item, apiKey: maskFor('integrations', null, decryptSecret(item.apiKey)) }));
}

/** Replaces every secret in a private setting with its mask (mutates and returns `value`). */
function maskSecrets(key, value) {
  for (const path of SECRET_FIELDS[key] || []) {
    const stored = getPath(value, path);
    setPath(value, path, maskFor(key, path, decryptSecret(stored)));
  }
  if (key === 'integrations') maskCustomKeys(value);
  return value;
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

/** Everything the admin panel edits; secrets are replaced by a mask. */
export async function getAdminSettings() {
  const stored = await Settings.all(SETTING_KEYS);
  const all = Object.fromEntries(SETTING_KEYS.map((k) => [k, structuredClone(deepMerge(DEFAULT_SETTINGS[k], stored[k]))]));
  for (const key of PRIVATE_SETTING_KEYS) maskSecrets(key, all[key]);
  return all;
}

/** A private setting with its secrets decrypted — for server-side services only, never for a response. */
export async function getSettingWithSecrets(key) {
  const value = structuredClone(await getSetting(key));
  for (const path of SECRET_FIELDS[key] || []) setPath(value, path, decryptSecret(getPath(value, path)));
  if (key === 'integrations') value.custom = (value.custom || []).map((item) => ({ ...item, apiKey: decryptSecret(item.apiKey) }));
  return value;
}
export const getEmailSettings = () => getSettingWithSecrets('email');

/**
 * A custom key an admin saved under Admin → API keys → "Other API keys" (Admin → API keys), decrypted —
 * for server-side use only, never for a response. Matches by name, case-insensitively. Returns '' if not set,
 * so new code can be written to call this once and just work the moment the admin pastes the key in — no
 * redeploy needed either way.
 */
export async function getCustomApiKey(name) {
  const { custom } = await getSettingWithSecrets('integrations');
  const hit = (custom || []).find((c) => c.name.trim().toLowerCase() === String(name).trim().toLowerCase());
  return hit?.apiKey || '';
}

const forAdmin = async (key) => (await getAdminSettings())[key];

const listeners = [];
/** Lets services drop caches when a setting changes. */
export const onSettingChanged = (fn) => listeners.push(fn);

export async function saveSetting(key, value, updatedBy) {
  const toStore = structuredClone(value);
  const current = await getSetting(key);
  for (const path of SECRET_FIELDS[key] || []) {
    const submitted = getPath(toStore, path);
    // The browser only ever sees the mask: keep the stored secret unless a new one was typed (or it was cleared).
    setPath(toStore, path, isMasked(submitted) ? getPath(current, path) : encryptSecret(submitted));
  }
  if (key === 'integrations') {
    const currentById = new Map((current.custom || []).map((c) => [c.id, c]));
    toStore.custom = (toStore.custom || []).map((item) => ({
      ...item,
      apiKey: isMasked(item.apiKey) ? (currentById.get(item.id)?.apiKey || '') : encryptSecret(item.apiKey),
    }));
  }
  await Settings.save(key, toStore, updatedBy);
  listeners.forEach((fn) => fn(key));
  return forAdmin(key);
}

export async function resetSetting(key) {
  await Settings.remove(key);
  listeners.forEach((fn) => fn(key));
  return forAdmin(key);
}

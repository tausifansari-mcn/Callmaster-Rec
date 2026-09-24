import { env } from '../../config/env.js';
import { getSettingWithSecrets, onSettingChanged } from '../settings.service.js';

const TTL_MS = 30 * 1000;
let cache = null;
let cachedAt = 0;
// Saving a key in the admin panel takes effect on the very next audit — no restart, no waiting for the cache.
onSettingChanged((key) => { if (key === 'integrations') cache = null; });

const last4 = (k) => (k ? k.slice(-4) : '');

/**
 * The credentials the audit engine uses right now. A key saved in the admin panel (Admin → API keys) wins;
 * if none is saved there, the DEEPGRAM_API_KEY / ANTHROPIC_API_KEY values from backend/.env are used.
 */
export async function getAuditConfig({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < TTL_MS) return cache;
  const s = await getSettingWithSecrets('integrations');
  const dgAdmin = (s.deepgram.apiKey || '').trim();
  const anAdmin = (s.anthropic.apiKey || '').trim();
  cache = {
    deepgramKey: dgAdmin || env.audit.deepgramKey,
    deepgramSource: dgAdmin ? 'admin panel' : env.audit.deepgramKey ? '.env file' : 'none',
    deepgramModel: s.deepgram.model || env.audit.deepgramModel,
    deepgramLanguage: s.deepgram.language || env.audit.deepgramLanguage,
    anthropicKey: anAdmin || env.audit.anthropicKey,
    anthropicSource: anAdmin ? 'admin panel' : env.audit.anthropicKey ? '.env file' : 'none',
    anthropicModel: s.anthropic.model || env.audit.anthropicModel,
  };
  cachedAt = Date.now();
  return cache;
}

/** True when both keys are available; otherwise the demo falls back to the clearly-labelled sample scorecard. */
export async function isAuditLive() {
  const c = await getAuditConfig();
  return Boolean(c.deepgramKey && c.anthropicKey);
}

/** Which key is active and where it comes from — never the key itself, only its last 4 characters. */
export async function getKeyStatus() {
  const c = await getAuditConfig({ fresh: true });
  return {
    deepgram: { configured: Boolean(c.deepgramKey), source: c.deepgramSource, last4: last4(c.deepgramKey), model: c.deepgramModel },
    anthropic: { configured: Boolean(c.anthropicKey), source: c.anthropicSource, last4: last4(c.anthropicKey), model: c.anthropicModel },
    live: Boolean(c.deepgramKey && c.anthropicKey),
  };
}

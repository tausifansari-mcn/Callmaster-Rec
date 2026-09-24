/**
 * "Test connection" for the admin panel. Uses free, read-only endpoints — no transcription or model call is billed.
 * Results carry a human message only; the key itself is never echoed.
 */

export async function testDeepgram(cfg) {
  if (!cfg.deepgramKey) return { ok: false, message: 'No Deepgram key is set.' };
  try {
    const res = await fetch('https://api.deepgram.com/v1/auth/token', {
      headers: { Authorization: `Token ${cfg.deepgramKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Deepgram rejected this key — it is invalid, revoked or missing permissions.' };
    if (!res.ok) return { ok: false, message: `Deepgram answered with an unexpected status (${res.status}). Try again in a moment.` };
    const info = await res.json().catch(() => ({}));
    return { ok: true, message: `Connected to Deepgram${info.email ? ` — key belongs to ${info.email}` : ''}. Model in use: ${cfg.deepgramModel}.` };
  } catch (err) {
    return { ok: false, message: `Could not reach Deepgram (${err.name === 'TimeoutError' ? 'timed out' : 'network error'}).` };
  }
}

export async function testAnthropic(cfg) {
  if (!cfg.anthropicKey) return { ok: false, message: 'No Anthropic key is set.' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': cfg.anthropicKey, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, message: 'Anthropic rejected this key — it is invalid, revoked or missing permissions.' };
    if (!res.ok) return { ok: false, message: `Anthropic answered with an unexpected status (${res.status}). Try again in a moment.` };
    const body = await res.json().catch(() => ({}));
    const ids = (body.data || []).map((m) => m.id);
    if (ids.length && !ids.includes(cfg.anthropicModel)) {
      return { ok: false, message: `The key works, but the model "${cfg.anthropicModel}" is not available to it. Available: ${ids.slice(0, 6).join(', ')}.` };
    }
    return { ok: true, message: `Connected to Anthropic. Model in use: ${cfg.anthropicModel}.` };
  } catch (err) {
    return { ok: false, message: `Could not reach Anthropic (${err.name === 'TimeoutError' ? 'timed out' : 'network error'}).` };
  }
}

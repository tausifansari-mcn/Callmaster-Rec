import { env } from '../config/env.js';

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
  return res;
}

/**
 * SMS delivery is provider-agnostic: point SMS_WEBHOOK_URL at any endpoint (your SMS gateway, a Zapier hook,
 * an internal service) that accepts POST {"to": "...", "message": "..."}.
 */
export async function sendSms(to, message) {
  if (!env.smsWebhookUrl) return { sent: false, reason: 'sms-not-configured' };
  try {
    await postJson(env.smsWebhookUrl, { to, message });
    return { sent: true };
  } catch (err) {
    console.error('[sms] send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * Voice Bot demo call. When VOICE_DEMO_WEBHOOK_URL is set, the call request is forwarded to it
 * (your telephony/voice-bot platform). Without it the demo is simulated on the front end and only recorded here.
 */
export async function requestDemoCall(details) {
  if (!env.voiceDemoWebhookUrl) return { status: 'simulated' };
  try {
    await postJson(env.voiceDemoWebhookUrl, details);
    return { status: 'requested' };
  } catch (err) {
    console.error('[voice-demo] webhook failed:', err.message);
    return { status: 'failed', error: err.message };
  }
}

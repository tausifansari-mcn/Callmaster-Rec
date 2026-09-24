import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Otps } from '../repositories/otps.js';
import { ApiError } from '../utils/ApiError.js';
import { randomDigits, safeEqual, sha256 } from '../utils/helpers.js';
import { sendOtpEmail } from './mail.service.js';
import { sendSms } from './integrations.service.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 5 * 1000;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL = '30m';

const hashCode = (target, purpose, code) => sha256(`${env.jwtSecret}:${purpose}:${target}:${code}`);

export async function sendOtp({ target, purpose }) {
  const existing = await Otps.find(target, purpose);
  if (existing && Date.now() - new Date(existing.created_at).getTime() < RESEND_COOLDOWN_MS) {
    throw new ApiError(429, 'Please wait a few seconds before requesting another code.');
  }

  const code = randomDigits(4);
  await Otps.replace(target, purpose, hashCode(target, purpose, code), new Date(Date.now() + OTP_TTL_MS));

  const delivery = purpose === 'checkout'
    ? await sendOtpEmail(target, code)
    : await sendSms(target, `Your CallMaster verification code is ${code}. It expires in 10 minutes.`);

  if (!delivery.sent && !env.sandboxMode) {
    await Otps.removeFor(target, purpose);
    throw new ApiError(503, purpose === 'checkout'
      ? 'We could not send the verification email right now. Please try again shortly.'
      : 'We could not send the verification SMS right now. Please try again shortly.');
  }

  // In sandbox mode the code is echoed back so the flow can be tested without a mail/SMS provider.
  return { sent: delivery.sent, ...(env.sandboxMode ? { devOtp: code } : {}) };
}

/** Returns a short-lived token proving `target` was verified for `purpose`. */
export async function verifyOtp({ target, purpose, code }) {
  const otp = await Otps.find(target, purpose);
  if (!otp || new Date(otp.expires_at) < new Date()) throw ApiError.badRequest('That code has expired. Request a new one.');
  if (otp.attempts >= MAX_ATTEMPTS) {
    await Otps.remove(otp.id);
    throw new ApiError(429, 'Too many wrong attempts. Request a new code.');
  }
  if (!safeEqual(otp.code_hash, hashCode(target, purpose, code))) {
    await Otps.addAttempt(otp.id);
    throw ApiError.badRequest("That code doesn't match. Try again.");
  }
  await Otps.remove(otp.id);
  return jwt.sign({ t: target, p: purpose }, env.jwtSecret, { expiresIn: TOKEN_TTL });
}

export function assertVerified(token, target, purpose) {
  try {
    const payload = jwt.verify(String(token || ''), env.jwtSecret);
    if (payload.t === target && payload.p === purpose) return;
  } catch { /* fall through */ }
  throw new ApiError(403, 'Verification expired or missing. Please verify again.');
}

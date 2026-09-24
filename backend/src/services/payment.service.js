import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { safeEqual } from '../utils/helpers.js';

export const isRazorpay = () => env.paymentMode === 'razorpay';

/** Public payment settings the checkout modal needs. Never exposes the secret. */
export const publicPaymentConfig = () => ({
  mode: env.paymentMode,
  keyId: isRazorpay() ? env.razorpayKeyId : '',
});

export async function createRazorpayOrder({ amountRupees, receipt, notes }) {
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt, notes }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[razorpay] order create failed:', res.status, body?.error?.description);
    throw new ApiError(502, 'Could not start the payment. Please try again.');
  }
  return body; // { id, amount, currency, ... }
}

export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  return safeEqual(expected, String(signature || ''));
}

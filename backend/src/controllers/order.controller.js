import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Orders } from '../repositories/orders.js';
import { Promos } from '../repositories/promos.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { fileMeta, removeUploaded } from '../middleware/common.js';
import { assertVerified } from '../services/otp.service.js';
import { PRODUCTS, buildQuote } from '../services/pricing.service.js';
import { orderSchema } from '../validators/publicSchemas.js';
import { createRazorpayOrder, isRazorpay, verifyRazorpaySignature } from '../services/payment.service.js';
import { notifyTeam, sendOrderReceipt } from '../services/mail.service.js';
import { randomToken, safeEqual } from '../utils/helpers.js';

export const quote = asyncHandler(async (req, res) => {
  res.json(await buildQuote(req.body));
});

const newOrderId = (productKey) => `CM-${PRODUCTS[productKey].prefix}-${crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`;

/**
 * multipart/form-data: `payload` (JSON string matching orderSchema) and, for Voice Bot, `scopeOfWork` (file).
 * Prices are recomputed here from server-side settings — the client's totals are never trusted.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const file = req.file;
  try {
    let raw;
    try {
      raw = JSON.parse(req.body.payload || '{}');
    } catch {
      throw ApiError.badRequest('Malformed order payload');
    }
    const parsed = orderSchema.safeParse(raw);
    if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0]?.message || 'Invalid order', parsed.error.flatten().fieldErrors);
    const data = parsed.data;

    assertVerified(data.verifyToken, data.customer.email, 'checkout');
    if (data.productKey === 'voice-bot' && !file) throw ApiError.badRequest('Attach a Scope of Work file before continuing');

    const q = await buildQuote(data);
    const accessToken = randomToken(16);
    const orderId = newOrderId(q.productKey);
    const pk = await Orders.create({
      orderId, accessToken,
      productKey: q.productKey, product: q.product, plan: q.plan, mode: q.mode, unit: q.unit,
      billingNote: q.billingNote, qtyLabel: q.qtyLabel, qty: q.qty || 1, unitPrice: q.unitPrice,
      rows: q.rows, config: q.config,
      subtotal: q.subtotal, discountCode: q.discountCode, discountPct: q.discountPct, discountAmount: q.discountAmount,
      gstRate: q.gstRate, gst: q.gst, total: q.total,
      customer: data.customer,
      scopeOfWork: fileMeta(file),
      paymentMode: env.paymentMode,
      ip: req.ip,
    });

    let razorpay;
    if (isRazorpay()) {
      const rp = await createRazorpayOrder({ amountRupees: q.total, receipt: orderId, notes: { product: q.product } });
      await Orders.setRazorpayOrder(pk, rp.id);
      razorpay = { keyId: env.razorpayKeyId, orderId: rp.id, amount: rp.amount, currency: rp.currency };
    }

    res.status(201).json({ ok: true, orderId, accessToken, paymentMode: env.paymentMode, razorpay, quote: q });
  } catch (err) {
    removeUploaded(file);
    throw err;
  }
});

async function loadPendingOrder(req) {
  const order = await Orders.findForPayment(req.params.orderId);
  const token = String(req.body.accessToken || '');
  if (!order || !safeEqual(order.accessToken, token)) throw ApiError.notFound('Order not found');
  if (order.status !== 'pending') throw ApiError.conflict('This order has already been processed');
  return order;
}

async function markPaid(order, paymentFields) {
  await Orders.markPaid(order.id, paymentFields);
  if (order.discountCode) await Promos.incrementUsed(order.discountCode);

  sendOrderReceipt(order);
  notifyTeam('order', `New order ${order.orderId} — ${order.product}`, {
    Product: `${order.product} — ${order.plan}`, Total: `₹${order.total}`, Company: order.customer.company,
    Contact: order.customer.contact, Email: order.customer.email, Phone: order.customer.phone, GST: order.customer.gstNumber,
  }, order.customer.email);
  return order;
}

const summary = (order) => ({ ok: true, orderId: order.orderId, product: order.product, plan: order.plan, company: order.customer.company, email: order.customer.email, phone: order.customer.phone, total: order.total });

/** Sandbox checkout: simulates a successful Razorpay payment. Disabled when PAYMENT_MODE=razorpay. */
export const sandboxPay = asyncHandler(async (req, res) => {
  if (isRazorpay()) throw ApiError.forbidden('Sandbox payments are disabled');
  const order = await loadPendingOrder(req);
  await markPaid(order, { mode: 'sandbox' });
  res.json(summary(order));
});

export const verifyRazorpay = asyncHandler(async (req, res) => {
  if (!isRazorpay()) throw ApiError.forbidden('Razorpay is not enabled');
  const order = await loadPendingOrder(req);
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  if (order.payment.razorpayOrderId !== razorpayOrderId || !verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature })) {
    await Orders.markFailed(order.id);
    throw ApiError.badRequest('Payment verification failed');
  }
  await markPaid(order, { mode: 'razorpay', razorpayPaymentId });
  res.json(summary(order));
});

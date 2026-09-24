import { Customers } from '../repositories/customers.js';
import { Orders } from '../repositories/orders.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { signCustomerToken } from '../middleware/common.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { getCancellationPolicy, isCancellable, requestCancellation } from '../services/cancellation.service.js';

/** What a customer may see of their own order — no internal notes, IPs or payment identifiers. */
const publicOrder = (o, windowDays) => ({
  orderId: o.orderId,
  product: o.product,
  plan: o.plan,
  mode: o.mode,
  rows: o.rows,
  qty: o.qty,
  unit: o.unit,
  unitPrice: o.unitPrice,
  subtotal: o.subtotal,
  discountCode: o.discountCode,
  discountAmount: o.discountAmount,
  gstRate: o.gstRate,
  gst: o.gst,
  total: o.total,
  status: o.status,
  welcomeOffer: o.welcomeOffer,
  paidAt: o.payment?.paidAt,
  createdAt: o.createdAt,
  cancelledAt: o.cancelledAt,
  cancellable: isCancellable(o, windowDays),
});

const publicAccount = (a) => ({
  username: a.username, email: a.email, company: a.company, contactName: a.contactName, mustChangePassword: a.mustChangePassword,
});

export const login = asyncHandler(async (req, res) => {
  const account = await Customers.findByLogin(req.body.login, true);
  // Same message for unknown user / wrong password / disabled so the form can't be used to find accounts.
  if (!account || !account.active || !(await verifyPassword(req.body.password, account.passwordHash))) {
    throw ApiError.unauthorized('Invalid username or password');
  }
  await Customers.touchLogin(account.id);
  res.json({ token: signCustomerToken(account), account: publicAccount(account) });
});

export const me = asyncHandler(async (req, res) => {
  const policy = await getCancellationPolicy();
  res.json({ account: publicAccount(req.customer), policy });
});

export const changePassword = asyncHandler(async (req, res) => {
  const account = await Customers.findByLogin(req.customer.username, true);
  if (!(await verifyPassword(req.body.currentPassword, account.passwordHash))) throw ApiError.badRequest('Your current password is incorrect');
  if (req.body.currentPassword === req.body.newPassword) throw ApiError.badRequest('Choose a password different from the current one');
  await Customers.setPassword(account.id, await hashPassword(req.body.newPassword), false);
  res.json({ ok: true });
});

export const orders = asyncHandler(async (req, res) => {
  const policy = await getCancellationPolicy();
  const list = await Orders.listForEmail(req.customer.email);
  res.json({ orders: list.map((o) => publicOrder(o, policy.windowDays)), policy });
});

/** A signed-in customer cancelling their own order: an eligible one is cancelled and refunded-due straight away. */
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Orders.findByRefAndEmail(req.params.orderId, req.customer.email);
  if (!order) throw ApiError.notFound('Order not found');
  const policy = await getCancellationPolicy();
  if (order.status === 'cancelled') throw ApiError.conflict('This order has already been cancelled.');
  if (!isCancellable(order, policy.windowDays)) {
    throw ApiError.conflict(`Only paid Cloud Telephony orders can be cancelled online, within ${policy.windowDays} days of purchase. Please contact our team.`);
  }
  await requestCancellation({ order, orderRef: order.orderId, email: order.customer.email, source: 'dashboard', ip: req.ip, autoApprove: true });
  res.json({ ok: true, orderId: order.orderId, refundAmount: order.total, refundDays: policy.refundDays });
});

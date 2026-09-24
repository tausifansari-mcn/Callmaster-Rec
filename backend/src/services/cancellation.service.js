import { Cancellations } from '../repositories/cancellations.js';
import { Orders } from '../repositories/orders.js';
import { getSetting } from './settings.service.js';
import { notifyTeam, sendCancellationEmail } from './mail.service.js';

const DAY = 24 * 3600 * 1000;

export async function getCancellationPolicy() {
  const site = await getSetting('site');
  return { windowDays: site.cancellationWindowDays, refundDays: site.refundWorkingDays };
}

/** Cloud Telephony only: a paid order can be cancelled with a full refund inside the window. */
export function isCancellable(order, windowDays) {
  if (!order || order.productKey !== 'cloud-telephony') return false;
  if (!['paid', 'fulfilled'].includes(order.status)) return false;
  const paidAt = order.payment?.paidAt ? new Date(order.payment.paidAt).getTime() : 0;
  return paidAt > 0 && Date.now() - paidAt <= windowDays * DAY;
}

/**
 * Records a cancellation request. With `autoApprove` (the customer is signed in / holds the order's secret token)
 * an eligible order is cancelled straight away and a refund is owed; otherwise the request waits for an admin.
 */
export async function requestCancellation({ order, orderRef, email, source, ip, autoApprove = false }) {
  const policy = await getCancellationPolicy();
  const matched = Boolean(order);
  const eligible = isCancellable(order, policy.windowDays);

  if (matched) {
    const open = await Cancellations.findOpenForOrder(order.id);
    if (open) return { id: open.id, matched, eligible, duplicate: true, policy };
  }

  const approve = autoApprove && eligible;
  const id = await Cancellations.create({
    orderPk: matched ? order.id : null,
    orderRef,
    email,
    source,
    matched,
    eligible,
    refundAmount: eligible ? order.total : null,
    status: approve ? 'approved' : 'requested',
    ip,
  });

  if (approve) await Orders.markCancelled(order.id);

  notifyTeam('order', approve ? `Order ${order.orderId} cancelled — refund due` : 'Cancellation request', {
    'Order ID': orderRef,
    Email: email,
    Matched: matched ? 'yes' : 'no order found for these details',
    'Inside window': matched ? (eligible ? `yes — refund ₹${order.total}` : 'no') : '—',
    Source: source,
    Status: approve ? 'auto-approved' : 'needs review',
  }, email);
  // Only ever email the address registered on the order — never an address typed into a public form.
  if (matched) sendCancellationEmail({ order, eligible, approved: approve, policy });

  return { id, matched, eligible, approved: approve, refundAmount: eligible ? order.total : null, policy };
}

import { exec, one, query, transaction } from '../config/db.js';
import { makeResource, parseJson, toJson } from './_util.js';

export const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded', 'failed'];

/** Rows → API objects, attaching each cart order's line items with one extra query. */
async function mapRows(rows) {
  if (!rows.length) return [];
  const items = await query('SELECT * FROM order_items WHERE order_pk IN (?) ORDER BY position ASC, id ASC', [rows.map((r) => r.id)]);
  const byOrder = new Map();
  for (const it of items) {
    if (!byOrder.has(it.order_pk)) byOrder.set(it.order_pk, []);
    byOrder.get(it.order_pk).push({ label: it.label, sub: it.sub, value: it.value });
  }
  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    productKey: r.product_key,
    product: r.product,
    plan: r.plan,
    mode: r.mode,
    unit: r.unit,
    billingNote: r.billing_note,
    qtyLabel: r.qty_label,
    qty: r.qty,
    unitPrice: r.unit_price,
    rows: byOrder.get(r.id) || [],
    config: parseJson(r.config, {}),
    subtotal: r.subtotal,
    discountCode: r.discount_code || '',
    discountPct: r.discount_pct,
    discountAmount: r.discount_amount,
    gstRate: r.gst_rate,
    gst: r.gst,
    total: r.total,
    currency: r.currency,
    customer: {
      company: r.customer_company,
      contact: r.customer_contact,
      gstNumber: r.customer_gst_number,
      phone: r.customer_phone,
      email: r.customer_email,
    },
    scopeOfWork: r.sow_stored_name || r.sow_original_name
      ? { originalName: r.sow_original_name, storedName: r.sow_stored_name, size: r.sow_size }
      : null,
    status: r.status,
    payment: { mode: r.payment_mode, razorpayOrderId: r.razorpay_order_id, razorpayPaymentId: r.razorpay_payment_id, paidAt: r.paid_at },
    notes: r.notes || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

const resource = makeResource({
  table: 'orders',
  map: mapRows,
  searchColumns: ['order_id', 'customer_company', 'customer_email', 'customer_contact', 'customer_phone', 'product'],
  filterColumns: { status: 'status', product: 'product_key' },
  statuses: ORDER_STATUSES,
  patchable: ['status', 'notes'],
});

export const Orders = {
  ...resource,

  /** Inserts the order and its line items atomically. */
  async create(o) {
    return transaction(async (run) => {
      const r = await run(
        `INSERT INTO orders (order_id, access_token, product_key, product, plan, mode, unit, billing_note, qty_label, qty, unit_price, config,
           subtotal, discount_code, discount_pct, discount_amount, gst_rate, gst, total,
           customer_company, customer_contact, customer_gst_number, customer_phone, customer_email,
           sow_original_name, sow_stored_name, sow_size, payment_mode, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.orderId, o.accessToken, o.productKey, o.product, o.plan, o.mode, o.unit ?? null, o.billingNote ?? null, o.qtyLabel ?? null, o.qty || 1, o.unitPrice ?? null, toJson(o.config),
          o.subtotal, o.discountCode || null, o.discountPct || 0, o.discountAmount || 0, o.gstRate, o.gst, o.total,
          o.customer.company, o.customer.contact, o.customer.gstNumber, o.customer.phone, o.customer.email,
          o.scopeOfWork?.originalName ?? null, o.scopeOfWork?.storedName ?? null, o.scopeOfWork?.size ?? null, o.paymentMode, o.ip || null,
        ]
      );
      for (const [i, row] of (o.rows || []).entries()) {
        await run('INSERT INTO order_items (order_pk, position, label, sub, `value`) VALUES (?, ?, ?, ?, ?)', [r.insertId, i, row.label, row.sub ?? null, row.value]);
      }
      return r.insertId;
    });
  },

  /** For the buyer-facing payment endpoints: looks up by public order reference and returns the secret token too. */
  async findForPayment(orderId) {
    const row = await one('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!row) return null;
    return { ...(await mapRows([row]))[0], accessToken: row.access_token };
  },

  async setRazorpayOrder(id, razorpayOrderId) {
    await exec('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [razorpayOrderId, id]);
  },

  async markPaid(id, { mode, razorpayPaymentId }) {
    await exec("UPDATE orders SET status = 'paid', payment_mode = ?, razorpay_payment_id = ?, paid_at = NOW(3) WHERE id = ?", [mode, razorpayPaymentId || null, id]);
  },

  async markFailed(id) {
    await exec("UPDATE orders SET status = 'failed' WHERE id = ?", [id]);
  },
};

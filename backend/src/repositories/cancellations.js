import { exec, one } from '../config/db.js';
import { bit, flag, makeResource } from './_util.js';

export const CANCELLATION_STATUSES = ['requested', 'approved', 'refunded', 'rejected'];

const mapOne = (r) => ({
  id: r.id,
  orderPk: r.order_pk,
  orderRef: r.order_ref,
  email: r.email,
  source: r.source,
  matched: flag(r.matched),
  eligible: flag(r.eligible),
  refundAmount: r.refund_amount,
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Cloud Telephony cancellation / refund requests. */
export const Cancellations = {
  ...makeResource({
    table: 'cancellation_requests',
    map: async (rows) => rows.map(mapOne),
    searchColumns: ['order_ref', 'email'],
    filterColumns: { status: 'status', source: 'source' },
    statuses: CANCELLATION_STATUSES,
    patchable: ['status', 'notes'],
  }),

  async create(d) {
    const r = await exec(
      `INSERT INTO cancellation_requests (order_pk, order_ref, email, source, matched, eligible, refund_amount, status, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.orderPk ?? null, d.orderRef, d.email, d.source, bit(d.matched), bit(d.eligible), d.refundAmount ?? null, d.status || 'requested', d.ip || null]
    );
    return r.insertId;
  },

  /** An open (not yet refunded/rejected) request for the same order, so repeated clicks don't stack up. */
  async findOpenForOrder(orderPk) {
    return one("SELECT id, status FROM cancellation_requests WHERE order_pk = ? AND status IN ('requested','approved') ORDER BY id DESC LIMIT 1", [orderPk]);
  },
};

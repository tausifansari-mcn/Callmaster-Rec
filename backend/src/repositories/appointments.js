import { exec, one, query } from '../config/db.js';
import { makeResource } from './_util.js';

export const APPOINTMENT_STATUSES = ['booked', 'confirmed', 'completed', 'cancelled', 'no_show'];

const mapOne = (r) => ({
  id: r.id,
  name: r.name,
  organization: r.organization,
  email: r.email,
  phone: r.phone,
  slotStart: r.slot_start,
  slotLabel: r.slot_label,
  source: r.source,
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** "Book a call" requests from the Home and Contact pages. One row per booked slot. */
export const Appointments = {
  ...makeResource({
    table: 'appointments',
    map: async (rows) => rows.map(mapOne),
    searchColumns: ['name', 'organization', 'email', 'phone'],
    filterColumns: { status: 'status', source: 'source' },
    statuses: APPOINTMENT_STATUSES,
    patchable: ['status', 'notes'],
  }),

  /** How many live (not cancelled) bookings each of these slot starts already has. */
  async takenCounts(from, to) {
    const rows = await query(
      "SELECT slot_start, COUNT(*) AS n FROM appointments WHERE slot_start >= ? AND slot_start <= ? AND status <> 'cancelled' GROUP BY slot_start",
      [from, to]
    );
    return new Map(rows.map((r) => [new Date(r.slot_start).getTime(), r.n]));
  },

  async countAt(slotStart) {
    return (await one("SELECT COUNT(*) AS n FROM appointments WHERE slot_start = ? AND status <> 'cancelled'", [slotStart])).n;
  },

  async create(d) {
    const r = await exec(
      'INSERT INTO appointments (name, organization, email, phone, slot_start, slot_label, source, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [d.name, d.organization, d.email, d.phone, d.slotStart, d.slotLabel, d.source, d.ip || null]
    );
    return r.insertId;
  },
};

import { exec } from '../config/db.js';
import { makeResource } from './_util.js';

export const CONTACT_STATUSES = ['new', 'read', 'replied', 'closed'];

const mapOne = (r) => ({
  id: r.id,
  name: r.name,
  organization: r.organization,
  email: r.email,
  phone: r.phone,
  interest: r.interest,
  message: r.message || '',
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const Contacts = {
  ...makeResource({
    table: 'contacts',
    map: async (rows) => rows.map(mapOne),
    searchColumns: ['name', 'organization', 'email', 'phone', 'message'],
    filterColumns: { status: 'status' },
    statuses: CONTACT_STATUSES,
    patchable: ['status', 'notes'],
  }),
  async create(d) {
    await exec(
      'INSERT INTO contacts (name, organization, email, phone, interest, message, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [d.name, d.organization, d.email, d.phone || '', d.interest || '', d.message || '', d.ip || null]
    );
  },
};

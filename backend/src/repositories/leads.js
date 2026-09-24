import { exec } from '../config/db.js';
import { makeResource } from './_util.js';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed'];

const mapOne = (r) => ({
  id: r.id,
  source: r.source,
  name: r.name,
  organization: r.organization,
  email: r.email,
  phone: r.phone,
  callType: r.call_type,
  monthlyVolume: r.monthly_volume,
  qaSetup: r.qa_setup,
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const Leads = {
  ...makeResource({
    table: 'leads',
    map: async (rows) => rows.map(mapOne),
    searchColumns: ['name', 'organization', 'email', 'phone'],
    filterColumns: { status: 'status' },
    statuses: LEAD_STATUSES,
    patchable: ['status', 'notes'],
  }),
  async create(d) {
    await exec(
      'INSERT INTO leads (source, name, organization, email, phone, call_type, monthly_volume, qa_setup, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [d.source || 'insights-pricing', d.name, d.organization, d.email, d.phone, d.callType, d.monthlyVolume, d.qaSetup, d.ip || null]
    );
  },
};

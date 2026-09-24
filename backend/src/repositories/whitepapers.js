import { exec, one, query } from '../config/db.js';
import { bit, flag, makeResource } from './_util.js';

const map = (r) => r && ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  description: r.description,
  file: r.file_stored_name ? { originalName: r.file_original_name, storedName: r.file_stored_name, size: r.file_size } : null,
  active: flag(r.active),
  order: r.sort_order,
  downloadCount: r.download_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** The white papers offered on the Insights page. The PDF itself is uploaded from the admin panel. */
export const Whitepapers = {
  async listAll() {
    return (await query('SELECT * FROM whitepapers ORDER BY sort_order ASC, id ASC')).map(map);
  },
  /** What the public Insights page shows — whether or not a PDF has been uploaded yet. */
  async listActive() {
    return (await query('SELECT * FROM whitepapers WHERE active = 1 ORDER BY sort_order ASC, id ASC')).map(map);
  },
  async findById(id) { return map(await one('SELECT * FROM whitepapers WHERE id = ?', [id])); },
  async findActiveBySlug(slug) { return map(await one('SELECT * FROM whitepapers WHERE slug = ? AND active = 1', [slug])); },
  async create(p) {
    const r = await exec('INSERT INTO whitepapers (slug, title, description, active, sort_order) VALUES (?, ?, ?, ?, ?)', [p.slug, p.title, p.description || '', bit(p.active ?? true), p.order ?? 100]);
    return this.findById(r.insertId);
  },
  async update(id, p) {
    await exec('UPDATE whitepapers SET slug = ?, title = ?, description = ?, active = ?, sort_order = ? WHERE id = ?', [p.slug, p.title, p.description || '', bit(p.active), p.order ?? 100, id]);
    return this.findById(id);
  },
  async setFile(id, file) {
    await exec('UPDATE whitepapers SET file_original_name = ?, file_stored_name = ?, file_size = ? WHERE id = ?', [file?.originalName ?? null, file?.storedName ?? null, file?.size ?? null, id]);
    return this.findById(id);
  },
  async incrementDownloads(id) { await exec('UPDATE whitepapers SET download_count = download_count + 1 WHERE id = ?', [id]); },
  async insertIfMissing(p) {
    await exec('INSERT IGNORE INTO whitepapers (slug, title, description, active, sort_order) VALUES (?, ?, ?, 1, ?)', [p.slug, p.title, p.description, p.order]);
  },
  async remove(id) { await exec('DELETE FROM whitepapers WHERE id = ?', [id]); },
};

export const WHITEPAPER_LEAD_STATUSES = ['new', 'contacted', 'closed'];

const mapLead = (r) => ({
  id: r.id,
  whitepaperId: r.whitepaper_id,
  whitepaper: r.whitepaper_title,
  name: r.name,
  email: r.email,
  delivered: flag(r.delivered),
  status: r.status,
  notes: r.notes || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** People who unlocked a paper with their name + work email. */
export const WhitepaperLeads = {
  ...makeResource({
    table: 'whitepaper_leads',
    map: async (rows) => rows.map(mapLead),
    searchColumns: ['name', 'email', 'whitepaper_title'],
    filterColumns: { status: 'status' },
    statuses: WHITEPAPER_LEAD_STATUSES,
    patchable: ['status', 'notes'],
  }),
  async create(d) {
    await exec(
      'INSERT INTO whitepaper_leads (whitepaper_id, whitepaper_title, name, email, delivered, ip) VALUES (?, ?, ?, ?, ?, ?)',
      [d.whitepaperId ?? null, d.whitepaperTitle, d.name, d.email, bit(d.delivered), d.ip || null]
    );
  },
};

import { exec, one, query } from '../config/db.js';
import { bit, flag, parseJson } from './_util.js';

export const RESERVED_SLUGS = [
  'admin', 'api', 'home', 'pricing', 'about', 'contact', 'deep-customer-insights', 'voice-bot', 'dialers',
  'email-automation', 'whatsapp-api', 'cloud-telephony', 'insights', 'account', 'uploads', 'assets',
];

const map = (r) => r && ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  kind: r.kind,
  sections: parseJson(r.sections, []),
  published: flag(r.published),
  showInFooter: flag(r.show_in_footer),
  footerColumn: r.footer_column,
  order: r.sort_order,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const values = (p) => [p.slug, p.title, p.kind, JSON.stringify(p.sections || []), bit(p.published), bit(p.showInFooter), p.footerColumn, p.order];

export const Pages = {
  async list() {
    return (await query('SELECT * FROM pages ORDER BY kind ASC, sort_order ASC, title ASC')).map(map);
  },
  async listFooter() {
    return (await query('SELECT slug, title, footer_column FROM pages WHERE published = 1 AND show_in_footer = 1 ORDER BY sort_order ASC, title ASC'))
      .map((p) => ({ slug: p.slug, title: p.title, column: p.footer_column }));
  },
  async findById(id) {
    return map(await one('SELECT * FROM pages WHERE id = ?', [id]));
  },
  async findPublishedBySlug(slug) {
    return map(await one('SELECT * FROM pages WHERE slug = ? AND published = 1', [String(slug).toLowerCase()]));
  },
  async create(p) {
    const r = await exec(
      'INSERT INTO pages (slug, title, kind, sections, published, show_in_footer, footer_column, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      values({ kind: 'custom', ...p })
    );
    return this.findById(r.insertId);
  },
  async update(id, p) {
    await exec(
      'UPDATE pages SET slug = ?, title = ?, kind = ?, sections = ?, published = ?, show_in_footer = ?, footer_column = ?, sort_order = ? WHERE id = ?',
      [...values(p), id]
    );
    return this.findById(id);
  },
  async insertIfMissing(p) {
    await exec(
      'INSERT IGNORE INTO pages (slug, title, kind, sections, published, show_in_footer, footer_column, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      values(p)
    );
  },
  async remove(id) {
    await exec('DELETE FROM pages WHERE id = ?', [id]);
  },
};

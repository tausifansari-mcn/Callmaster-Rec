import { exec, one, query } from '../config/db.js';

const map = (r) => r && ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  body: r.body,
  category: r.category,
  tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  coverImage: r.cover_image,
  readTime: r.read_time,
  author: r.author,
  status: r.status,
  seoTitle: r.seo_title,
  seoDescription: r.seo_description,
  publishedAt: r.published_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Columns in the order the write queries below use them. */
const values = (p) => [
  p.slug,
  p.title,
  p.excerpt || '',
  p.body || '',
  p.category || '',
  Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
  p.coverImage || '',
  p.readTime || '',
  p.author || '',
  p.status === 'published' ? 'published' : 'draft',
  p.seoTitle || '',
  p.seoDescription || '',
];

const COLS = 'slug, title, excerpt, body, category, tags, cover_image, read_time, author, status, seo_title, seo_description';
const SETS = COLS.split(', ').map((c) => `${c} = ?`).join(', ');

/** Blog posts for the Insights page. Drafts are admin-only; the public sees published ones. */
export const Posts = {
  /** Everything, newest first — the admin list. */
  async listAll() {
    return (await query('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC, id DESC')).map(map);
  },
  /** What the public Insights page shows. */
  async listPublished() {
    return (await query("SELECT * FROM posts WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC, id DESC")).map(map);
  },
  async findById(id) { return map(await one('SELECT * FROM posts WHERE id = ?', [id])); },
  async findBySlug(slug) { return map(await one('SELECT * FROM posts WHERE slug = ?', [String(slug).toLowerCase()])); },
  async findPublishedBySlug(slug) {
    return map(await one("SELECT * FROM posts WHERE slug = ? AND status = 'published'", [String(slug).toLowerCase()]));
  },
  async create(p) {
    // published_at is stamped once, the first time a post goes live, so later edits don't move it.
    const r = await exec(
      `INSERT INTO posts (${COLS}, published_at) VALUES (${COLS.split(', ').map(() => '?').join(', ')}, ?)`,
      [...values(p), p.status === 'published' ? new Date() : null]
    );
    return this.findById(r.insertId);
  },
  async update(id, p) {
    const current = await this.findById(id);
    const publishedAt = p.status === 'published' ? (current?.publishedAt || new Date()) : current?.publishedAt || null;
    await exec(`UPDATE posts SET ${SETS}, published_at = ? WHERE id = ?`, [...values(p), publishedAt, id]);
    return this.findById(id);
  },
  async remove(id) { await exec('DELETE FROM posts WHERE id = ?', [id]); },
  async slugTaken(slug, exceptId = 0) {
    const r = await one('SELECT id FROM posts WHERE slug = ? AND id <> ?', [String(slug).toLowerCase(), exceptId]);
    return Boolean(r);
  },
};

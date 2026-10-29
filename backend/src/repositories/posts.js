import { exec, one, query } from '../config/db.js';

const list = (s) => (s ? s.split(',').map((t) => t.trim()).filter(Boolean) : []);

const map = (r) => r && ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  body: r.body,
  category: r.category,
  categories: list(r.categories).length ? list(r.categories) : list(r.category),
  tags: list(r.tags),
  coverImage: r.cover_image,
  readTime: r.read_time,
  author: r.author,
  status: r.status,
  visibility: r.visibility || 'public',
  focusKeyphrase: r.focus_keyphrase || '',
  seoTitle: r.seo_title,
  seoDescription: r.seo_description,
  publishedAt: r.published_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Columns in the order the write queries below use them. */
const COLS = 'slug, title, excerpt, body, category, categories, tags, cover_image, read_time, author, status, visibility, focus_keyphrase, seo_title, seo_description';
const SETS = COLS.split(', ').map((c) => `${c} = ?`).join(', ');

const values = (p) => {
  const categories = Array.isArray(p.categories) ? p.categories.filter(Boolean) : [];
  return [
    p.slug,
    p.title,
    p.excerpt || '',
    p.body || '',
    categories[0] || p.category || '',
    categories.join(', '),
    Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
    p.coverImage || '',
    p.readTime || '',
    p.author || '',
    p.status === 'published' ? 'published' : 'draft',
    p.visibility === 'private' ? 'private' : 'public',
    p.focusKeyphrase || '',
    p.seoTitle || '',
    p.seoDescription || '',
  ];
};

/**
 * When a post's publish date should be recorded:
 *  - an explicit date from the editor wins (that is how scheduling works);
 *  - otherwise stamp "now" the first time it goes live, and keep it on later edits so they don't move it;
 *  - a draft keeps whatever it had.
 */
const resolvePublishedAt = (p, current) => {
  if (p.status !== 'published') return current?.publishedAt || null;
  if (p.publishedAt) return new Date(p.publishedAt);
  return current?.publishedAt || new Date();
};

/** Live means: published, public, and the publish date has arrived. Compared in Node (not SQL) so a
 *  database server in another timezone can't hide a post that was just published. */
const isLive = (p) => p.status === 'published' && p.visibility === 'public'
  && (!p.publishedAt || new Date(p.publishedAt).getTime() <= Date.now());

/** Blog posts for the Insights page. Drafts, private posts and scheduled posts are admin-only. */
export const Posts = {
  /** Everything, newest first — the admin list. */
  async listAll() {
    return (await query('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC, id DESC')).map(map);
  },
  /** What the public Insights page shows. */
  async listPublished() {
    return (await this.listAll()).filter(isLive);
  },
  async findById(id) { return map(await one('SELECT * FROM posts WHERE id = ?', [id])); },
  async findBySlug(slug) { return map(await one('SELECT * FROM posts WHERE slug = ?', [String(slug).toLowerCase()])); },
  async findPublishedBySlug(slug) {
    const p = await this.findBySlug(slug);
    return p && isLive(p) ? p : null;
  },
  async create(p) {
    const r = await exec(
      `INSERT INTO posts (${COLS}, published_at) VALUES (${COLS.split(', ').map(() => '?').join(', ')}, ?)`,
      [...values(p), resolvePublishedAt(p, null)]
    );
    return this.findById(r.insertId);
  },
  async update(id, p) {
    const current = await this.findById(id);
    await exec(`UPDATE posts SET ${SETS}, published_at = ? WHERE id = ?`, [...values(p), resolvePublishedAt(p, current), id]);
    return this.findById(id);
  },
  async remove(id) { await exec('DELETE FROM posts WHERE id = ?', [id]); },
  async slugTaken(slug, exceptId = 0) {
    const r = await one('SELECT id FROM posts WHERE slug = ? AND id <> ?', [String(slug).toLowerCase(), exceptId]);
    return Boolean(r);
  },
  /** Every category name in use, for the editor's checkbox list. */
  async categoryNames() {
    const names = new Set();
    for (const p of await this.listAll()) p.categories.forEach((c) => names.add(c));
    return [...names].sort((a, b) => a.localeCompare(b));
  },
};

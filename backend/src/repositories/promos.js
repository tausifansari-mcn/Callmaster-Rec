import { exec, one, query } from '../config/db.js';
import { bit, emptyToNull, flag } from './_util.js';

const map = (r) => r && ({
  id: r.id,
  code: r.code,
  percent: r.percent,
  description: r.description,
  active: flag(r.active),
  validFrom: r.valid_from,
  validUntil: r.valid_until,
  maxUses: r.max_uses,
  usedCount: r.used_count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** A promo can be applied when it is active, inside its validity window and under its usage limit. */
export const isPromoUsable = (p, now = new Date()) => {
  if (!p || !p.active) return false;
  if (p.validFrom && now < new Date(p.validFrom)) return false;
  if (p.validUntil && now > new Date(p.validUntil)) return false;
  if (p.maxUses > 0 && p.usedCount >= p.maxUses) return false;
  return true;
};

const fields = (p) => [String(p.code).toUpperCase(), p.percent, p.description || '', bit(p.active), emptyToNull(p.validFrom), emptyToNull(p.validUntil), p.maxUses || 0];

export const Promos = {
  async list() {
    return (await query('SELECT * FROM promo_codes ORDER BY created_at DESC, id DESC')).map(map);
  },
  async findById(id) {
    return map(await one('SELECT * FROM promo_codes WHERE id = ?', [id]));
  },
  async findByCode(code) {
    return map(await one('SELECT * FROM promo_codes WHERE code = ?', [String(code).toUpperCase()]));
  },
  async create(p) {
    const r = await exec('INSERT INTO promo_codes (code, percent, description, active, valid_from, valid_until, max_uses) VALUES (?, ?, ?, ?, ?, ?, ?)', fields(p));
    return this.findById(r.insertId);
  },
  async update(id, p) {
    await exec('UPDATE promo_codes SET code = ?, percent = ?, description = ?, active = ?, valid_from = ?, valid_until = ?, max_uses = ? WHERE id = ?', [...fields(p), id]);
    return this.findById(id);
  },
  async insertIfMissing(p) {
    await exec('INSERT IGNORE INTO promo_codes (code, percent, description, active, valid_from, valid_until, max_uses) VALUES (?, ?, ?, ?, ?, ?, ?)', fields({ active: true, ...p }));
  },
  async incrementUsed(code) {
    await exec('UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?', [code]);
  },
  async remove(id) {
    await exec('DELETE FROM promo_codes WHERE id = ?', [id]);
  },
};

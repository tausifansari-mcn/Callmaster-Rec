import { exec, one, query } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

export const parseJson = (v, fallback = null) => {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};
export const toJson = (v) => (v === undefined || v === null ? null : JSON.stringify(v));
export const flag = (v) => v === 1 || v === true || v === '1';
export const bit = (v) => (v ? 1 : 0);
export const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

const LIKE_ESCAPE = /[\\%_]/g;
export const likePattern = (q) => `%${String(q).trim().replace(LIKE_ESCAPE, '\\$&')}%`;

/** WHERE clause for the admin list screens: exact filters, free-text search and a created_at date range. */
export function buildWhere({ filters = {}, q, searchColumns = [], from, to }) {
  const clauses = [];
  const params = [];
  for (const [column, value] of Object.entries(filters)) {
    if (value) { clauses.push(`\`${column}\` = ?`); params.push(value); }
  }
  if (q && String(q).trim() && searchColumns.length) {
    clauses.push(`(${searchColumns.map((c) => `\`${c}\` LIKE ?`).join(' OR ')})`);
    searchColumns.forEach(() => params.push(likePattern(q)));
  }
  if (from) { clauses.push('created_at >= ?'); params.push(new Date(from)); }
  if (to) { clauses.push('created_at <= ?'); params.push(new Date(new Date(to).getTime() + 24 * 3600 * 1000 - 1)); }
  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

/**
 * List / get / patch / delete for a table shown in the admin panel.
 *   map(rows)  → array of API objects (may be async, e.g. to attach child rows)
 *   statuses   → allowed values for the `status` column (validated before writing)
 */
export function makeResource({ table, map, searchColumns, filterColumns = {}, statuses, patchable = [], afterDelete }) {
  const filterValues = (input) => Object.fromEntries(Object.entries(filterColumns).map(([param, column]) => [column, input[param]]));

  return {
    async list(input) {
      const page = Math.max(1, parseInt(input.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(input.limit, 10) || 20));
      const where = buildWhere({ ...input, filters: filterValues(input), searchColumns });
      const rows = await query(`SELECT * FROM \`${table}\` ${where.sql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`, [...where.params, limit, (page - 1) * limit]);
      const [{ n }] = await query(`SELECT COUNT(*) AS n FROM \`${table}\` ${where.sql}`, where.params);
      return { items: await map(rows), total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
    },

    async all(input, max = 10000) {
      const where = buildWhere({ ...input, filters: filterValues(input), searchColumns });
      return map(await query(`SELECT * FROM \`${table}\` ${where.sql} ORDER BY created_at DESC, id DESC LIMIT ?`, [...where.params, max]));
    },

    async get(id) {
      const row = await one(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
      if (!row) throw ApiError.notFound();
      return (await map([row], { full: true }))[0];
    },

    async patch(id, body) {
      const row = await one(`SELECT id FROM \`${table}\` WHERE id = ?`, [id]);
      if (!row) throw ApiError.notFound();
      const sets = [];
      const params = [];
      for (const field of patchable) {
        if (body[field] === undefined) continue;
        if (field === 'status' && statuses && !statuses.includes(body.status)) throw ApiError.badRequest(`Invalid status "${body.status}"`);
        sets.push(`\`${field}\` = ?`);
        params.push(body[field]);
      }
      if (sets.length) await exec(`UPDATE \`${table}\` SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
      return this.get(id);
    },

    async remove(id) {
      const doc = await this.get(id);
      await exec(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
      afterDelete?.(doc);
      return doc;
    },
  };
}

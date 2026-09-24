import { exec, one, query } from '../config/db.js';
import { bit, flag } from './_util.js';

/** `passwordHash` is only present when explicitly requested (login / password change). */
const map = (r, withHash = false) => r && ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  active: flag(r.active),
  lastLoginAt: r.last_login_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  ...(withHash ? { passwordHash: r.password_hash } : {}),
});

export const Admins = {
  async count() {
    return (await one('SELECT COUNT(*) AS n FROM admins')).n;
  },
  async list() {
    return (await query('SELECT * FROM admins ORDER BY created_at ASC, id ASC')).map((r) => map(r));
  },
  async findById(id, withHash = false) {
    return map(await one('SELECT * FROM admins WHERE id = ?', [id]), withHash);
  },
  async findByEmail(email, withHash = false) {
    return map(await one('SELECT * FROM admins WHERE email = ?', [String(email).toLowerCase()]), withHash);
  },
  async countOtherActiveSuperAdmins(excludeId) {
    return (await one("SELECT COUNT(*) AS n FROM admins WHERE id <> ? AND role = 'superadmin' AND active = 1", [excludeId])).n;
  },
  async create({ name, email, passwordHash, role = 'admin', active = true }) {
    const r = await exec('INSERT INTO admins (name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)', [name, String(email).toLowerCase(), passwordHash, role, bit(active)]);
    return this.findById(r.insertId);
  },
  async update(id, { name, email, role, active, passwordHash }) {
    const sets = [];
    const params = [];
    const add = (col, val) => { if (val !== undefined) { sets.push(`${col} = ?`); params.push(val); } };
    add('name', name);
    add('email', email === undefined ? undefined : String(email).toLowerCase());
    add('role', role);
    add('active', active === undefined ? undefined : bit(active));
    add('password_hash', passwordHash);
    if (sets.length) await exec(`UPDATE admins SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    return this.findById(id);
  },
  async touchLogin(id) {
    await exec('UPDATE admins SET last_login_at = NOW(3) WHERE id = ?', [id]);
  },
  async remove(id) {
    await exec('DELETE FROM admins WHERE id = ?', [id]);
  },
};

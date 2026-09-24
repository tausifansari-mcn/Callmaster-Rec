import { exec, one } from '../config/db.js';
import { bit, flag, makeResource } from './_util.js';

const map = (r, withHash = false) => r && ({
  id: r.id,
  username: r.username,
  email: r.email,
  company: r.company,
  contactName: r.contact_name,
  phone: r.phone,
  mustChangePassword: flag(r.must_change_password),
  active: flag(r.active),
  lastLoginAt: r.last_login_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  ...(withHash ? { passwordHash: r.password_hash } : {}),
});

/** Customer dashboard accounts, created automatically when someone buys. */
export const Customers = {
  ...makeResource({
    table: 'customer_accounts',
    map: async (rows) => rows.map((r) => map(r)),
    searchColumns: ['username', 'email', 'company', 'contact_name'],
    patchable: [],
  }),
  async findById(id) { return map(await one('SELECT * FROM customer_accounts WHERE id = ?', [id])); },
  async findByEmail(email) { return map(await one('SELECT * FROM customer_accounts WHERE email = ?', [String(email).toLowerCase()])); },
  async findByLogin(login, withHash = true) {
    const l = String(login).trim().toLowerCase();
    return map(await one('SELECT * FROM customer_accounts WHERE username = ? OR email = ? LIMIT 1', [l, l]), withHash);
  },
  async usernameTaken(username) { return Boolean(await one('SELECT id FROM customer_accounts WHERE username = ?', [username])); },
  async create(a) {
    const r = await exec(
      'INSERT INTO customer_accounts (username, email, company, contact_name, phone, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [a.username, String(a.email).toLowerCase(), a.company, a.contactName, a.phone || null, a.passwordHash]
    );
    return this.findById(r.insertId);
  },
  async setPassword(id, passwordHash, mustChange) {
    await exec('UPDATE customer_accounts SET password_hash = ?, must_change_password = ? WHERE id = ?', [passwordHash, bit(mustChange), id]);
  },
  async setActive(id, active) { await exec('UPDATE customer_accounts SET active = ? WHERE id = ?', [bit(active), id]); },
  async touchLogin(id) { await exec('UPDATE customer_accounts SET last_login_at = NOW(3) WHERE id = ?', [id]); },
};

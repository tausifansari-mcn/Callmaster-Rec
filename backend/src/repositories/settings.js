import { exec, query } from '../config/db.js';
import { parseJson } from './_util.js';

export const Settings = {
  async all(keys) {
    const rows = await query('SELECT setting_key, value FROM settings WHERE setting_key IN (?)', [keys]);
    return Object.fromEntries(rows.map((r) => [r.setting_key, parseJson(r.value)]));
  },
  async save(key, value, updatedBy) {
    await exec(
      'INSERT INTO settings (setting_key, value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)',
      [key, JSON.stringify(value), updatedBy || null]
    );
  },
  async insertIfMissing(key, value) {
    await exec('INSERT IGNORE INTO settings (setting_key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
  },
  async remove(key) {
    await exec('DELETE FROM settings WHERE setting_key = ?', [key]);
  },
};

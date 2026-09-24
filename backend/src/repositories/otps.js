import { exec, one } from '../config/db.js';

export const Otps = {
  find(target, purpose) {
    return one('SELECT id, code_hash, attempts, expires_at, created_at FROM otps WHERE target = ? AND purpose = ? ORDER BY id DESC LIMIT 1', [target, purpose]);
  },
  async replace(target, purpose, codeHash, expiresAt) {
    await exec('DELETE FROM otps WHERE target = ? AND purpose = ?', [target, purpose]);
    await exec('INSERT INTO otps (target, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?)', [target, purpose, codeHash, expiresAt]);
  },
  async addAttempt(id) {
    await exec('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', [id]);
  },
  async remove(id) {
    await exec('DELETE FROM otps WHERE id = ?', [id]);
  },
  async removeFor(target, purpose) {
    await exec('DELETE FROM otps WHERE target = ? AND purpose = ?', [target, purpose]);
  },
  /** MySQL has no TTL indexes, so expired codes are swept periodically. */
  async purgeExpired() {
    await exec('DELETE FROM otps WHERE expires_at < NOW(3)');
  },
};

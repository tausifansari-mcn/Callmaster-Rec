/**
 * Create (or reset the password of) an admin account:
 *   npm run create-admin -- you@company.com "Your Name" "a-strong-password"
 * Falls back to ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD from backend/.env when arguments are omitted.
 */
import { assertEnv, env } from '../config/env.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { Admins } from '../repositories/admins.js';
import { hashPassword } from '../services/password.js';

const [emailArg, nameArg, passwordArg] = process.argv.slice(2);
const email = (emailArg || env.adminEmail || '').toLowerCase();
const name = nameArg || env.adminName;
const password = passwordArg || env.adminPassword;

try {
  assertEnv();
  if (!email || !password) throw new Error('Usage: npm run create-admin -- <email> "<name>" "<password>"');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  await connectDb();
  const passwordHash = await hashPassword(password);
  const existing = await Admins.findByEmail(email);
  if (existing) {
    await Admins.update(existing.id, { passwordHash, active: true });
    console.log(`Updated password for ${email}`);
  } else {
    await Admins.create({ email, name, passwordHash, role: 'superadmin' });
    console.log(`Created super admin ${email}`);
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}

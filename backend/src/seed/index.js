import { Admins } from '../repositories/admins.js';
import { Pages } from '../repositories/pages.js';
import { Promos } from '../repositories/promos.js';
import { Settings } from '../repositories/settings.js';
import { hashPassword } from '../services/password.js';
import { env } from '../config/env.js';
import { DEFAULT_SETTINGS, DEFAULT_PROMOS } from './defaults.js';
import { LEGAL_PAGES } from './legalPages.js';

/** Idempotent: only inserts what is missing, never overwrites edits made from the admin panel. */
export async function seedDefaults() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) await Settings.insertIfMissing(key, value);

  for (const page of LEGAL_PAGES) {
    await Pages.insertIfMissing({ ...page, kind: 'legal', published: true, showInFooter: true, footerColumn: 'legal' });
  }

  for (const promo of DEFAULT_PROMOS) await Promos.insertIfMissing(promo);

  await seedFirstAdmin();
}

async function seedFirstAdmin() {
  if ((await Admins.count()) > 0) return;
  if (!env.adminEmail || !env.adminPassword) {
    console.warn('[seed] No admin exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env (or run `npm run create-admin`) to create one.');
    return;
  }
  await Admins.create({ name: env.adminName, email: env.adminEmail, passwordHash: await hashPassword(env.adminPassword), role: 'superadmin' });
  console.log(`[seed] Created first admin: ${env.adminEmail}`);
}

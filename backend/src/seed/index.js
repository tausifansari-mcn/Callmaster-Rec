import { Admins } from '../repositories/admins.js';
import { Pages } from '../repositories/pages.js';
import { Promos } from '../repositories/promos.js';
import { Settings } from '../repositories/settings.js';
import { hashPassword } from '../services/password.js';
import { env } from '../config/env.js';
import { Whitepapers } from '../repositories/whitepapers.js';
import { DEFAULT_SETTINGS, DEFAULT_PROMOS, DEFAULT_WHITEPAPERS } from './defaults.js';
import { LEGAL_PAGES } from './legalPages.js';

/** Idempotent: only inserts what is missing, never overwrites edits made from the admin panel. */
export async function seedDefaults() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) await Settings.insertIfMissing(key, value);

  for (const page of LEGAL_PAGES) {
    await Pages.insertIfMissing({ ...page, kind: 'legal', published: true, showInFooter: true, footerColumn: 'legal' });
  }

  for (const promo of DEFAULT_PROMOS) await Promos.insertIfMissing(promo);
  for (const paper of DEFAULT_WHITEPAPERS) await Whitepapers.insertIfMissing(paper);

  await migrateContent();

  await seedFirstAdmin();
}

/** Runs a data change exactly once (remembered in the settings table), so admin edits are never overwritten later. */
async function runOnce(name, fn) {
  const done = (await Settings.all(['migrations'])).migrations || {};
  if (done[name]) return;
  await fn();
  await Settings.save('migrations', { ...done, [name]: new Date().toISOString() }, 'system');
}

/** Content changes that came with the redesigned site (promo code swap, chatbot wording). */
async function migrateContent() {
  // The launch discount code changed from CALLMASTER10 to MCN247X (MCN247X is created by the seed above).
  await runOnce('promo-mcn247x', async () => {
    await Promos.setActiveByCode('CALLMASTER10', false);
  });
  // The chatbot's discount reply now reads the code from Site settings instead of hard-coding it.
  await runOnce('chatbot-promo-token', async () => {
    const stored = (await Settings.all(['chatbot'])).chatbot;
    if (!stored || !Array.isArray(stored.rules)) return;
    stored.rules = stored.rules.map((r) => ({ ...r, reply: String(r.reply).replaceAll('CALLMASTER10', '{{site.promoCodeExample}}') }));
    await Settings.save('chatbot', stored, 'system');
  });
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

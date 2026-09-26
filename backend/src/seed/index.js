import { Admins } from '../repositories/admins.js';
import { Pages } from '../repositories/pages.js';
import { Promos } from '../repositories/promos.js';
import { Settings } from '../repositories/settings.js';
import { hashPassword } from '../services/password.js';
import { env } from '../config/env.js';
import { Whitepapers } from '../repositories/whitepapers.js';
import { DEFAULT_SETTINGS, DEFAULT_PROMOS, DEFAULT_WHITEPAPERS, DEFAULT_FAQS, DEFAULT_CHATBOT, DEFAULT_INSIGHTS } from './defaults.js';
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
  await migrateRedesignV3();

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

/**
 * The v3 redesign rewrote some default copy. A stored value that still equals the OLD default is dropped, so the new
 * default applies; anything an admin edited is left exactly as it was.
 */
async function migrateRedesignV3() {
  await runOnce('redesign-v3-copy', async () => {
    const drop = async (key, oldValues, deep = (s) => s) => {
      const stored = (await Settings.all([key]))[key];
      if (!stored) return;
      for (const [field, old] of Object.entries(oldValues)) if (stored[field] === old) delete stored[field];
      deep(stored);
      await Settings.save(key, stored, 'system');
    };
    await drop('home', {
      eyebrow: 'One stack for every way you reach a customer',
      title: 'Every Customer Conversation. One Platform. Zero Guesswork.',
      primaryCta: 'Try Deep Customer Insights Live',
      sub: DEFAULT_OLD_HOME_SUB,
    });
    await drop('site', { phoneAddress: '' });
    const faqs = (await Settings.all(['faqs'])).faqs;
    if (faqs?.audit) {
      faqs.audit = faqs.audit.map((f) => (f.q === 'How do you decide which framework applies?' && /maps to CLAP/.test(f.a) ? { ...f, a: DEFAULT_FAQS.audit[1].a } : f));
      await Settings.save('faqs', faqs, 'system');
    }
    const chatbot = (await Settings.all(['chatbot'])).chatbot;
    if (chatbot?.rules) {
      chatbot.rules = chatbot.rules.map((r) => (/CLAP for service, MAGIC Script\/CRT\/CST for sales/.test(r.reply) ? { ...r, reply: DEFAULT_CHATBOT.rules.find((d) => /the right way/.test(d.reply))?.reply || r.reply } : r));
      await Settings.save('chatbot', chatbot, 'system');
    }
    const insights = (await Settings.all(['insights'])).insights;
    if (insights?.articles) {
      insights.articles = insights.articles.map((a) => (/CRT and CST trajectories/.test(a.body) ? { ...a, body: DEFAULT_INSIGHTS.articles[2].body } : a));
      await Settings.save('insights', insights, 'system');
    }
  });
}

const DEFAULT_OLD_HOME_SUB = 'Voice Bots, Cloud Telephony, WhatsApp, Email Automation and Dialers to run every conversation — and Deep Customer Insights to score, audit and improve every single one of them, automatically. Most vendors sell you a channel. We built the floor operations behind 250+ enterprise contact centers for 23 years, then built the platform that runs it — so what you get isn\'t six disconnected tools, it\'s one system where every call, chat and message makes the next one better. Set up online in minutes. No sales call required.';

async function seedFirstAdmin() {
  if ((await Admins.count()) > 0) return;
  if (!env.adminEmail || !env.adminPassword) {
    console.warn('[seed] No admin exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env (or run `npm run create-admin`) to create one.');
    return;
  }
  await Admins.create({ name: env.adminName, email: env.adminEmail, passwordHash: await hashPassword(env.adminPassword), role: 'superadmin' });
  console.log(`[seed] Created first admin: ${env.adminEmail}`);
}

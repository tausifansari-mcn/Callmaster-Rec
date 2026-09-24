import { z } from 'zod';

const str = (max = 500) => z.string().trim().max(max);
const longStr = (max = 5000) => z.string().max(max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money = z.coerce.number().min(0).max(100000000);

export const PAGE_KEYS = [
  '', 'home', 'audit', 'voice', 'dialers', 'email-automation', 'whatsapp-api', 'telephony', 'pricing', 'about', 'contact',
  'terms', 'privacy', 'cookie-policy', 'data-retention', 'refund-policy',
];

const plan = z.object({
  key: z.string().trim().regex(/^[a-z0-9-]+$/i, 'Plan key may only contain letters, numbers and dashes').max(40),
  name: str(60).min(1),
  badge: str(80),
  price: money,
  unit: str(30),
  featured: z.boolean(),
  contactOnly: z.boolean(),
  features: z.array(str(200)).max(20),
});

const faqList = z.array(z.object({ q: str(300).min(1), a: longStr(3000).min(1) })).max(50);

const rule = z.object({
  keywords: z.array(str(80).min(1)).max(30),
  pattern: str(300),
  excludePattern: str(300),
  reply: longStr(1500).min(1),
  target: z.enum(PAGE_KEYS),
  anchor: str(80),
  label: str(80),
});

export const settingsSchemas = {
  email: z.object({
    smtp: z.object({
      host: str(190),
      port: z.coerce.number().int().min(1).max(65535),
      secure: z.boolean(),
      user: str(190),
      pass: z.string().max(500),
    }),
    fromName: str(80),
    fromEmail: str(190).refine((s) => !s || EMAIL_RE.test(s), 'Enter a valid "from" email address'),
    notifyTo: str(500).refine(
      (s) => s.split(',').map((x) => x.trim()).filter(Boolean).every((x) => EMAIL_RE.test(x)),
      'Notification recipients must be valid email addresses separated by commas'
    ),
    notify: z.object({ contact: z.boolean(), lead: z.boolean(), order: z.boolean(), demo: z.boolean() }),
    autoReply: z.object({ enabled: z.boolean(), subject: str(200), body: longStr(4000) }),
  }),

  site: z.object({
    brandName: str(60).min(1),
    siteTitle: str(160).min(1),
    domain: str(120),
    entityName: str(160),
    navCtaLabel: str(40).min(1),
    sandboxBanner: z.object({ show: z.boolean(), text: str(120) }),
    footerNote: str(300),
    emails: z.object({ hello: str(160), sales: str(160), support: str(160), privacy: str(160) }),
    phoneAddress: str(400),
  }),

  home: z.object({
    eyebrow: str(160),
    title: str(200).min(1),
    sub: longStr(2000),
    primaryCta: str(80).min(1),
    secondaryCta: str(80).min(1),
    trustQuote: str(400),
    stats: z.array(z.object({ value: str(40).min(1), label: str(80) })).max(8),
    ctaBandTitle: str(200),
    ctaBandButton: str(100),
  }),

  pricing: z.object({
    gstRate: z.coerce.number().min(0).max(100),
    telephony: z.object({ licenseRate: money, channelRate: money, didRate: money }),
    dialers: z.object({
      tiers: z
        .array(z.object({ min: z.coerce.number().int().min(1), max: z.coerce.number().int().min(1), rate: money }))
        .min(1)
        .max(10),
    }),
    voiceBot: z.object({
      setupFee: money,
      languageFee: money,
      perMinuteRate: money,
      languages: z.array(str(40).min(1)).max(40),
    }),
    emailAutomation: z.object({ plans: z.array(plan).min(1).max(6) }),
    whatsapp: z.object({
      plans: z.array(plan).min(1).max(6),
      interactionRates: z.array(z.object({ category: str(60).min(1), rate: money, use: str(200) })).max(12),
    }),
  }),

  faqs: z.object({
    audit: faqList, voice: faqList, dialers: faqList, email: faqList, whatsapp: faqList, telephony: faqList,
  }),

  chatbot: z.object({
    greeting: longStr(600),
    fallback: longStr(600),
    quickReplies: z.array(str(80).min(1)).max(8),
    rules: z.array(rule).max(80),
  }),
};

/** Extra semantic checks that a structural schema can't express. Returns an error message or null. */
export function checkPricingSemantics(p) {
  const tiers = [...p.dialers.tiers].sort((a, b) => a.min - b.min);
  for (let i = 0; i < tiers.length; i += 1) {
    if (tiers[i].max < tiers[i].min) return `Dialer tier ${i + 1}: "to" must be ≥ "from"`;
    if (i > 0 && tiers[i].min <= tiers[i - 1].max) return 'Dialer tiers must not overlap';
  }
  for (const group of [p.emailAutomation.plans, p.whatsapp.plans]) {
    const keys = group.map((x) => x.key.toLowerCase());
    if (new Set(keys).size !== keys.length) return 'Plan keys must be unique within a product';
    if (group.some((x) => !x.contactOnly && x.price <= 0)) return 'A purchasable plan needs a price greater than 0';
  }
  return null;
}

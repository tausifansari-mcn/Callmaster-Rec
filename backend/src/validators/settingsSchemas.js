import { z } from 'zod';

const str = (max = 500) => z.string().trim().max(max);
const longStr = (max = 5000) => z.string().max(max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money = z.coerce.number().min(0).max(100000000);

export const PAGE_KEYS = [
  '', 'home', 'audit', 'voice', 'telephony', 'sip-channels', 'social-listening', 'pricing', 'about', 'contact',
  'terms', 'privacy', 'cookie-policy', 'data-retention', 'refund-policy', 'insights', 'account',
  // legacy ids from the original single-file site, still present in older stored chatbot rules
  'cookie', 'retention', 'refund',
];

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

// A pasted key must be one token: reject spaces/newlines inside it (a common copy-paste slip).
const apiKey = z.string().trim().max(400).refine((k) => !/\s/.test(k), 'The key must not contain spaces or line breaks');

export const settingsSchemas = {
  integrations: z.object({
    deepgram: z.object({ apiKey, model: str(60).min(1, 'Enter a model, e.g. nova-3'), language: str(20).min(1, 'Enter a language, e.g. multi') }),
    anthropic: z.object({ apiKey, model: str(80).min(1, 'Enter a model, e.g. claude-sonnet-5') }),
    // Extra keys not (yet) wired into a feature — added/edited/removed freely, no code or schema change needed.
    custom: z.array(z.object({
      id: z.string().trim().min(1).max(60),
      name: str(80).min(1, 'Enter a name, e.g. OpenAI'),
      apiKey,
      notes: str(300),
    })).max(30),
  }),
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
    emails: z.object({ care: str(160), hello: str(160), sales: str(160), support: str(160), privacy: str(160) }),
    phoneAddress: str(400),
    promoCodeExample: str(40),
    cancellationWindowDays: z.coerce.number().int().min(1).max(60),
    refundWorkingDays: z.coerce.number().int().min(1).max(60),
    logoFile: str(160),
    bookingTimes: z.array(z.string().trim().regex(/^(1[0-2]|0?[1-9]):[0-5]\d\s?(AM|PM)$/i, 'Use times like 10:00 AM or 2:30 PM')).min(1).max(12),
    bookingDaysAhead: z.coerce.number().int().min(1).max(120),
    bookingCapacity: z.coerce.number().int().min(1).max(20),
    // Dates (YYYY-MM-DD) the booking calendar closes on, beyond the permanent Sunday closure — e.g. gazetted holidays.
    bookingHolidays: z.record(str(80)).default({}),
  }),

  insights: z.object({
    eyebrow: str(160),
    title: str(160).min(1),
    sub: longStr(1000),
    articlesHeading: str(120),
    articles: z.array(z.object({ tag: str(40), title: str(200).min(1), body: longStr(6000) })).max(12),
    whitepapersHeading: str(120),
    whitepapersSub: longStr(600),
    gateNote: longStr(600),
  }),

  home: z.object({
    heroVideoFile: str(160),
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
    // vendorMin/vendorMax bound the "what do you pay your current vendor?" price-match field on the quote forms.
    telephony: z.object({ licenseRate: money, channelRate: money, didRate: money, vendorMin: money, vendorMax: money }),
    voiceBot: z.object({
      setupFee: money,
      languageFee: money,
      perMinuteRate: money,
      vendorMin: money,
      vendorMax: money,
      languages: z.array(str(40).min(1)).max(40),
    }),
  }),

  faqs: z.object({
    audit: faqList, voice: faqList, telephony: faqList, sip: faqList, social: faqList,
  }),

  chatbot: z.object({
    greeting: longStr(600),
    fallback: longStr(600),
    quickReplies: z.array(str(80).min(1)).max(8),
    nudge: z.object({ enabled: z.boolean(), idleSeconds: z.coerce.number().int().min(10).max(600), messages: z.array(str(300).min(1)).max(10) }),
    rules: z.array(rule).max(80),
  }),
};

/** Extra semantic checks that a structural schema can't express. Returns an error message or null. */
export function checkPricingSemantics(p) {
  if (p.telephony.vendorMax < p.telephony.vendorMin) return 'Cloud Telephony: vendor price-match "up to" must be ≥ "from"';
  if (p.voiceBot.vendorMax < p.voiceBot.vendorMin) return 'Voice Bot: vendor price-match "up to" must be ≥ "from"';
  return null;
}

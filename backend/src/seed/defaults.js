/**
 * Default site configuration. These are the values from the original index.html; they are written
 * to the database on first start and can then be edited from the admin panel.
 *
 * Chatbot replies may contain {{path}} tokens (e.g. {{voiceBot.setupFee}}) that are resolved against the
 * current pricing at render time, so price changes made in the admin panel flow through to the bot.
 */

export const DEFAULT_SITE = {
  brandName: 'Nimantran',
  siteTitle: 'Nimantran: Cloud Telephony, AI Call Audits & Voice Bots',
  domain: '', // replaces "[domain]" across the site once set
  entityName: '', // replaces "[operating entity name]" once set
  navCtaLabel: 'Book a meeting',
  sandboxBanner: { show: false, text: 'SANDBOX BUILD · FOR INTERNAL TESTING' },
  footerNote: 'Nimantran — sandbox build for internal testing only. Not a production site.',
  emails: { care: 'care@nimantran.ai', hello: '', sales: '', support: '', privacy: '' }, // full addresses; blank = derive from domain
  phoneAddress: '+91 96671 95550\nTrapezoid IT Park, 1st Floor, C-27, C Block, Phase 2, Sector 62, Noida – 201309', // shown under "Direct contact"
  // "Book a call" calendar (IST): Monday–Saturday, 11:30 AM–5:30 PM, 30-minute slots (last slot starts 5:00 PM).
  bookingTimes: ['11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'],
  bookingDaysAhead: 60, // working days offered (Mon–Sat, minus holidays below), starting tomorrow — enough for a few months of calendar navigation
  bookingCapacity: 1, // bookings allowed per slot
  // Government of India gazetted holidays + major festivals the calendar closes on, on top of the permanent Sunday closure.
  bookingHolidays: {
    '2026-01-14': 'Makar Sankranti / Pongal', '2026-01-23': 'Basant Panchami', '2026-01-26': 'Republic Day', '2026-02-15': 'Maha Shivratri',
    '2026-03-03': 'Holika Dahan', '2026-03-04': 'Holi', '2026-03-19': 'Ugadi / Gudi Padwa', '2026-03-21': 'Id-ul-Fitr', '2026-03-26': 'Ram Navami',
    '2026-03-31': 'Mahavir Jayanti', '2026-04-03': 'Good Friday', '2026-04-14': 'Vaisakhi / Vishu', '2026-05-01': 'Buddha Purnima',
    '2026-05-27': 'Id-ul-Zuha (Bakrid)', '2026-06-26': 'Muharram', '2026-07-16': 'Rath Yatra', '2026-08-15': 'Independence Day',
    '2026-08-26': 'Milad-un-Nabi', '2026-08-28': 'Raksha Bandhan', '2026-09-04': 'Janmashtami', '2026-09-14': 'Ganesh Chaturthi',
    '2026-10-02': 'Gandhi Jayanti', '2026-10-19': 'Maha Ashtami', '2026-10-20': 'Dussehra', '2026-11-08': 'Diwali', '2026-11-09': 'Govardhan Puja',
    '2026-11-11': 'Bhai Dooj', '2026-11-15': 'Chhath Puja', '2026-11-24': 'Guru Nanak Jayanti', '2026-12-25': 'Christmas Day',
    '2027-01-14': 'Makar Sankranti', '2027-01-15': 'Pongal', '2027-01-26': 'Republic Day', '2027-02-11': 'Basant Panchami',
    '2027-03-06': 'Maha Shivratri', '2027-03-10': 'Id-ul-Fitr', '2027-03-22': 'Holika Dahan', '2027-03-23': 'Holi', '2027-03-26': 'Good Friday',
    '2027-04-07': 'Ugadi / Gudi Padwa', '2027-04-14': 'Vaisakhi / Vishu', '2027-04-15': 'Ram Navami', '2027-04-19': 'Mahavir Jayanti',
    '2027-05-17': 'Id-ul-Zuha (Bakrid)', '2027-05-20': 'Buddha Purnima', '2027-06-16': 'Muharram', '2027-07-05': 'Rath Yatra',
    '2027-08-15': 'Independence Day / Milad-un-Nabi', '2027-08-17': 'Raksha Bandhan', '2027-08-25': 'Janmashtami', '2027-09-04': 'Ganesh Chaturthi',
    '2027-09-12': 'Onam', '2027-10-02': 'Gandhi Jayanti', '2027-10-07': 'Maha Ashtami', '2027-10-08': 'Maha Navami', '2027-10-09': 'Dussehra',
    '2027-10-28': 'Naraka Chaturdashi', '2027-10-29': 'Diwali', '2027-10-30': 'Govardhan Puja', '2027-10-31': 'Bhai Dooj',
    '2027-11-04': 'Chhath Puja', '2027-11-14': 'Guru Nanak Jayanti', '2027-12-25': 'Christmas Day',
  },
  promoCodeExample: 'MCN247X', // shown in "Have a discount code, e.g. …?" hints and in the chatbot
  cancellationWindowDays: 3, // Cloud Telephony: full refund if cancelled within this many days of purchase
  refundWorkingDays: 7, // …processed to the original payment method within this many working days
  logoFile: 'nimantran-logo.png', // set by uploading a logo in Admin → Site settings (empty = text brand)
};

export const DEFAULT_HOME = {
  heroVideoFile: '', // set by uploading a video in Admin → Home page (empty = a plain dark hero)
  eyebrow: 'AI call intelligence, built by a company that\'s run contact centers for 23 years',
  title: 'Hear it work before you buy it.',
  sub: 'Nimantran audits every call instead of a 2% sample through Quality Audits, places real Voice Bot calls in the accent and language you choose, and quotes SIP Channels for the volume you actually run — all live below, on your own number, your own recording, your own script.',
  primaryCta: 'Try the Live Demo',
  secondaryCta: 'Talk to Sales',
  trustQuote: '"Built by people who have run the floor for 23 years — not people who have read about it."',
  stats: [
    { value: '23+', label: 'years in contact center operations' },
    { value: '250+', label: 'businesses served' },
    { value: '97%', label: 'client retention' },
    { value: 'ISO 27001', label: '2022 certified' },
  ],
  ctaBandTitle: 'Hear it on your own calls.',
  ctaBandButton: 'Try the Live Demo — No Cost, No Commitment',
};

export const DEFAULT_PRICING = {
  gstRate: 18,
  // vendorMin/vendorMax bound the "what do you pay your current vendor?" price-match field on the quote forms —
  // below vendorMin the number needs a manual review, above vendorMax it's rejected as not a plausible rate.
  telephony: { licenseRate: 1500, channelRate: 650, didRate: 75, vendorMin: 500, vendorMax: 10000 },
  voiceBot: {
    setupFee: 30000,
    languageFee: 15000,
    perMinuteRate: 3.5,
    vendorMin: 1,
    vendorMax: 20,
    languages: ['Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Odia', 'Assamese'],
  },
};

export const DEFAULT_FAQS = {
  audit: [
    { q: 'What do I need to try it?', a: 'One call recording and a phone number for verification. Each phone number gets one free trial.' },
    { q: 'Can I score against my own parameters?', a: 'Yes. You can start with the standard scorecard or give us your own parameters, such as mandatory disclosures, tone and closing steps.' },
    { q: 'Which languages are supported?', a: 'English, Hindi and Hinglish calls are supported today. Tell us about other regional languages you need and we will confirm.' },
    { q: 'Does it replace my QA team?', a: 'No. It removes the manual listening so your QA team spends time on coaching and on the calls that were actually flagged.' },
    { q: 'How is it priced?', a: 'Quality Audits is quoted to your call volume. New Cloud Telephony customers also get 2% of calls audited free in the first month.' },
    { q: 'How is perceived NPS or CSAT worked out?', a: 'From the conversation itself: the customer\'s words, tone, repeated complaints and how the call ended. It is an estimate for every call, not a replacement for survey scores. We suggest checking it against your real survey results for a few weeks.' },
    { q: 'What do the fraud and escalation alerts catch?', a: 'Fraud alerts flag patterns such as requests for OTPs or card details, identity mismatches and unusual account-change requests. Escalation alerts flag customers who say they will post on social media, contact the media or complain to a regulator. You choose who is told and how.' },
    { q: 'What happens to my recording?', a: 'It is used to produce your result and handled as described in our Privacy Policy and Data Retention Policy.' },
  ],
  voice: [
    { q: 'Will customers know it is a bot?', a: 'Our voices are natural, and we recommend identifying the call as automated. Honest framing builds more trust than pretending.' },
    { q: 'Which languages and accents?', a: 'English, Hindi and Hinglish with Indian, British and American accents. Regional languages can be scoped on request.' },
    { q: 'Can I try one before buying?', a: 'Yes. Enter your script, choose the voice and Nimantran calls your phone. Each phone number gets one free trial.' },
    { q: 'What can a voice bot handle?', a: 'Collections reminders, appointment confirmations, abandoned-cart recovery, order and delivery updates, feedback calls and first-level customer service.' },
    { q: 'How much does it cost?', a: 'From ₹3.5 per minute. Tell us your volume and we will quote it, and see whether we can match your current rate.' },
    { q: 'Does it follow calling rules and DND?', a: 'Outbound calling is subject to telecom rules. We design campaigns around consented and permitted contacts, and you remain responsible for the consent of the numbers you upload.' },
  ],
  telephony: [
    { q: 'What exactly makes a number "mobile look-alike"?', a: 'It\'s formatted and routed to present as a standard 10-digit mobile number rather than a visibly corporate pattern (1800/0XX toll-free or landline prefixes) — the same call quality, but far less likely to be ignored, screened, or flagged as spam.' },
    { q: 'How does the 2% Insights audit work?', a: 'A random 2% sample of your monthly call volume is automatically scored through Quality Audits — CLAP, MAGIC Script or RESO depending on the call type — at no extra cost in your first month, so you get visibility into call quality without buying a separate product.' },
    { q: 'Can I change my license, channel or DID count later?', a: 'Yes — this is a configurable, self-serve plan. Scale up or down and your next bill reflects it.' },
    { q: 'Already using another provider?', a: 'Tell us who it is and what you pay per licence on the configurator — if it\'s a plausible rate, we\'ll match it and add more benefits on top.' },
    { q: 'Is there a bigger discount for high volume?', a: 'For large, custom deployments, [talk to Enterprise Sales](/contact) instead of checking out here.' },
  ],
  sip: [
    { q: 'What is a concurrent call channel?', a: 'One channel carries one call at a time. If 40 customers can be on the phone at once, you need 40 channels.' },
    { q: 'How do I know how many I need?', a: 'Divide peak-hour call minutes by 60 and add a safety margin. Or give us your volume and we will size it.' },
    { q: 'Does it work with my dialer or PBX?', a: 'Most modern dialers and PBX systems support SIP. Share your setup and we will confirm compatibility.' },
    { q: 'What uptime can I expect?', a: 'Capacity is built to a contact-center standard. Specific service levels are agreed in your contract.' },
    { q: 'How is it priced?', a: 'By channel count and volume, quoted after you tell us what you need.' },
    { q: 'Can I add channels later?', a: 'Yes. Capacity can be increased, and reduced, as your campaigns change.' },
  ],
  social: [
    { q: 'Is Social Listening available now?', a: 'It is in early access. Scope and data sources are being finalised, so talk to us to join.' },
    { q: 'Which platforms will it cover?', a: 'Public sources are being confirmed. Tell us where your customers talk and we will tell you what we can cover.' },
    { q: 'Does it read private messages?', a: 'No. It works with public mentions only.' },
    { q: 'How does it connect to calls?', a: 'You can compare public sentiment with your call quality scores to see where customers feel differently.' },
    { q: 'Do I need Quality Audits to use it?', a: 'No, but the two work well together.' },
    { q: 'How is it priced?', a: 'Early-access pricing is shared on request.' },
  ],
};

export const DEFAULT_CHATBOT = {
  greeting: 'Hi! I\'m the Nimantran helpline bot. Ask me about our products, pricing, demos, refunds, or anything else — or tap a quick question below.',
  fallback: 'I couldn\'t quite match that to something specific — let me connect you with our team instead.',
  quickReplies: ['What products do you offer?', 'How does pricing work?', 'How do I get support?', 'Can I try a demo?'],
  // Opens the chat by itself when a visitor has been idle on a page for a while.
  nudge: {
    enabled: true,
    idleSeconds: 45,
    messages: [
      'Still there? Happy to help you find pricing, book a demo, or answer a quick question — just ask.',
      'Looks like you\'ve been on this page a bit — need a hand finding something? I can point you to pricing, a live demo, or the right product.',
    ],
  },
  // Rules are checked top to bottom; the first match wins. A rule matches when the message contains any keyword,
  // or matches `pattern` (a regular expression) and does not match `excludePattern`.
  rules: [
    { keywords: [], pattern: 'product|offer|what (do you|can you)', excludePattern: 'pric|cost', reply: 'We build five products: Quality Audits (call scoring/QA), Voice Bot, Cloud Telephony, SIP Channels, and Social Listening. Which one would you like to know more about?', target: '', anchor: '', label: '' },
    { keywords: [], pattern: 'support|help me|get support', excludePattern: '', reply: 'For support, reach our team via the Contact page — replies within one business day.', target: 'contact', anchor: '', label: 'Go to Contact' },
    { keywords: ['voice bot', 'voicebot', 'voice-bot'], pattern: '', excludePattern: '', reply: 'Our Voice Bot places real AI-driven calls — pick industry, call type, language and voice, and try it on your own number free. Setup is a one-time {{voiceBot.setupFee}} (+{{voiceBot.languageFee}} per extra regional language), then {{voiceBot.perMinuteRate}}/minute usage.', target: 'voice', anchor: 'voice-pricing', label: 'Open Voice Bot pricing' },
    { keywords: ['cloud telephony', 'telephony', 'phone number', 'did'], pattern: '', excludePattern: '', reply: 'Cloud Telephony gives you the mobile look-alike number — formatted to get answered like a normal 10-digit mobile, not screened like a landline or 1800 number. Configure licenses, channels and DIDs and pay online.', target: 'telephony', anchor: 'telephony-pricing', label: 'Configure Cloud Telephony' },
    { keywords: ['sip', 'sip channel', 'concurrent call', 'channels'], pattern: '', excludePattern: '', reply: 'SIP Channels give you inbound and outbound concurrent-call capacity, quoted to your actual volume. Tell us your channel count and we\'ll come back with pricing.', target: 'sip-channels', anchor: '', label: 'Get SIP Channels pricing' },
    { keywords: ['social listening', 'social media', 'brand mentions'], pattern: '', excludePattern: '', reply: 'Social Listening tracks what\'s said about your brand beyond the call. It\'s not generally available yet — talk to sales to be notified at launch.', target: 'social-listening', anchor: '', label: 'Learn about Social Listening' },
    { keywords: ['insight', 'audit', 'call scoring', 'clap', 'magic script', 'reso'], pattern: '', excludePattern: '', reply: 'Quality Audits scores every call the right way — quality for service, best-pitch finder for sales, promise-to-pay scoring for collections. You can try it free on your own call.', target: 'audit', anchor: 'audit-pricing', label: 'Try Quality Audits' },
    { keywords: ['pricing', 'price', 'cost', 'how much'], pattern: '', excludePattern: '', reply: 'Cloud Telephony and Voice Bot are self-serve — pick a plan and pay online instantly. Quality Audits, SIP Channels and Social Listening are quoted to your volume, so we email you exact rates. Head to the Pricing page for a full breakdown by product.', target: 'pricing', anchor: '', label: 'See all pricing' },
    { keywords: ['refund', 'cancel', 'cancellation'], pattern: '', excludePattern: '', reply: 'Cloud Telephony can be cancelled within {{cancellationWindowDays}} days of purchase for a full refund, paid within {{refundWorkingDays}} working days — email care@nimantran.ai with your company name. Full details are in our Refund & Cancellation Policy.', target: 'refund-policy', anchor: '', label: 'Read the Refund Policy' },
    { keywords: ['contact', 'talk to sales', 'human', 'agent', 'callback'], pattern: '', excludePattern: '', reply: 'Happy to connect you with our team — leave your details on the Contact page and we\'ll get back within one business day.', target: 'contact', anchor: '', label: 'Go to Contact' },
    { keywords: ['demo', 'trial', 'try it', 'free'], pattern: '', excludePattern: '', reply: 'You can try Quality Audits on your own call, or have our Voice Bot call your own phone — both are free, no card required. Which would you like to try?', target: 'audit', anchor: '', label: 'Try a live demo' },
    { keywords: ['gst', 'tax', 'invoice'], pattern: '', excludePattern: '', reply: 'GST is charged at {{gstRate}}% on top of the subtotal at checkout, after any discount code is applied. Your invoice reflects the GST number you provide during checkout.', target: '', anchor: '', label: '' },
    { keywords: ['otp', 'verification', 'verify email'], pattern: '', excludePattern: '', reply: 'We verify every checkout with a one-time code sent to your official business email — this confirms it\'s really you before payment, and we don\'t accept personal addresses like Gmail or Yahoo for billing.', target: '', anchor: '', label: '' },
    { keywords: ['payment', 'razorpay', 'checkout', 'pay'], pattern: '', excludePattern: '', reply: 'Checkout runs through Razorpay. You\'ll see requirement → company details → email OTP → payment, with the final amount (incl. GST, minus any discount code) confirmed before you pay.', target: '', anchor: '', label: '' },
    { keywords: ['discount', 'promo', 'coupon', 'code'], pattern: '', excludePattern: '', reply: 'Discount codes are applied on the payment step of checkout, across every self-serve product — try {{site.promoCodeExample}} for 10% off, subtracted before GST.', target: '', anchor: '', label: '' },
    { keywords: ['support', 'help'], pattern: '', excludePattern: '', reply: 'For account or product support, reach out via the Contact page and our team replies within one business day — or keep chatting here for quick answers.', target: 'contact', anchor: '', label: 'Go to Contact' },
  ],
};

/**
 * Outgoing email + notifications. Managed in the admin panel (Email & notifications).
 * If smtp.host is empty the SMTP_* / NOTIFY_EMAIL values from backend/.env are used instead.
 * smtp.pass is encrypted at rest and never sent to the browser.
 */
export const DEFAULT_EMAIL = {
  smtp: { host: '', port: 587, secure: false, user: '', pass: '' },
  fromName: 'Nimantran',
  fromEmail: '', // blank = the SMTP user
  notifyTo: '', // comma-separated inboxes that receive new-message / lead / order alerts
  notify: { contact: true, lead: true, order: true, demo: true },
  autoReply: {
    enabled: false,
    subject: 'We received your message — Nimantran',
    body: 'Hi {{name}},\n\nThanks for reaching out to Nimantran. We\'ve received your message and will get back to you within one business day.\n\nRegards,\nTeam Nimantran',
  },
};

/**
 * API keys for the call-audit engine, managed in the admin panel (API keys). A blank key means
 * "use the value from backend/.env"; a key saved here takes priority and applies to the next audit
 * with no restart. Keys are encrypted at rest and never sent to the browser.
 */
export const DEFAULT_INTEGRATIONS = {
  deepgram: { apiKey: '', model: 'nova-3', language: 'multi' },
  anthropic: { apiKey: '', model: 'claude-sonnet-5' },
  custom: [], // extra keys the admin has added under "Other API keys" (OpenAI, ElevenLabs, etc.) — see getCustomApiKey()
};

export const DEFAULT_INSIGHTS = {
  eyebrow: 'From the floor, not from a product meeting',
  title: 'Insights & Resources',
  sub: 'Notes on running contact center operations at scale — what actually moves answer rates, conversion and call quality — plus a couple of short papers you can keep.',
  articlesHeading: 'Latest thinking',
  articles: [
    {
      tag: 'OPERATIONS',
      title: 'Why answer rates are really a number-formatting problem',
      body: 'Most teams try to fix falling answer rates with a better script, a better dialer strategy, or a better time-of-day model. All of those help — none of them are the biggest lever. The single change with the largest measurable effect we\'ve found in 23 years of running contact center floors is simpler than any of that: what number the call appears to come from. A 1800 or 0XX pattern is filtered before the phone finishes ringing. A number formatted like a standard 10-digit mobile gets answered like one. Same infrastructure, same call quality — dramatically different pickup.',
    },
    {
      tag: 'QUALITY',
      title: 'Stop scoring every call the same way',
      body: 'A service call, a sales call and a collections call fail for completely different reasons — so scoring all three against one generic quality model tells you very little about what to actually fix. This is the reasoning behind CLAP, MAGIC Script and RESO: three frameworks, each built for what the call is actually for, applied automatically depending on the line of business. Read the full breakdown in our frameworks white paper below.',
    },
    {
      tag: 'SALES',
      title: 'Your best script is never the one in the training deck',
      body: 'Every sales call follows a pattern — opening, offer, objection, close. The pattern that\'s actually working right now is rarely the one written down six months ago. MAGIC Script tracks every live call, finds the opening and pitch closing deals today, and pushes it to every agent automatically. Your team should never be pitching from a stale script.',
    },
  ],
  whitepapersHeading: 'White papers',
  whitepapersSub: 'Two short, practical papers — leave your work email and we\'ll unlock the PDF instantly. No spam list, just the document.',
  gateNote: 'We save the name and work email you enter here so our team can follow up about the paper — we don\'t add you to any mailing list. See our Privacy Policy.',
};

export const DEFAULT_WHITEPAPERS = [
  { slug: 'mobile-look-alike-number', title: 'The Mobile Look-Alike Number', description: 'Why the number you call from decides whether your customer picks up. One page, no fluff.', order: 10 },
  { slug: 'clap-magic-script-reso', title: 'CLAP, MAGIC Script & RESO', description: 'The three frameworks behind Quality Audits, explained in full — and why a software company alone couldn\'t have built them.', order: 20 },
];

export const DEFAULT_SETTINGS = {
  insights: DEFAULT_INSIGHTS,
  email: DEFAULT_EMAIL,
  integrations: DEFAULT_INTEGRATIONS,
  site: DEFAULT_SITE,
  home: DEFAULT_HOME,
  pricing: DEFAULT_PRICING,
  faqs: DEFAULT_FAQS,
  chatbot: DEFAULT_CHATBOT,
};

export const DEFAULT_PROMOS = [
  { code: 'MCN247X', percent: 10, description: 'Launch discount — 10% off, subtracted before GST', active: true },
];

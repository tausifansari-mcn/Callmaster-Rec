/**
 * Default site configuration. These are the values from the original index.html; they are written
 * to the database on first start and can then be edited from the admin panel.
 *
 * Chatbot replies may contain {{path}} tokens (e.g. {{voiceBot.setupFee}}) that are resolved against the
 * current pricing at render time, so price changes made in the admin panel flow through to the bot.
 */

export const DEFAULT_SITE = {
  brandName: 'CallMaster',
  siteTitle: 'CallMaster — Deep Customer Insights, Voice Bot & Cloud Telephony',
  domain: '', // replaces "[domain]" across the site once set
  entityName: '', // replaces "[operating entity name]" once set
  navCtaLabel: 'Try Live Demo',
  sandboxBanner: { show: true, text: 'SANDBOX BUILD · FOR INTERNAL TESTING' },
  footerNote: 'CallMaster — sandbox build for internal testing only. Not a production site.',
  emails: { hello: '', sales: '', support: '', privacy: '' }, // full addresses; blank = derive from domain
  phoneAddress: '', // blank = "pending decision on public disclosure" placeholder
  promoCodeExample: 'MCN247X', // shown in "Have a discount code, e.g. …?" hints and in the chatbot
  cancellationWindowDays: 3, // Cloud Telephony: full refund if cancelled within this many days of purchase
  refundWorkingDays: 7, // …processed to the original payment method within this many working days
  logoFile: '', // set by uploading a logo in Admin → Site settings (empty = text brand)
};

export const DEFAULT_HOME = {
  eyebrow: 'One stack for every way you reach a customer',
  title: 'Every Customer Conversation. One Platform. Zero Guesswork.',
  sub: 'Voice Bots, Cloud Telephony, WhatsApp, Email Automation and Dialers to run every conversation — and Deep Customer Insights to score, audit and improve every single one of them, automatically. Most vendors sell you a channel. We built the floor operations behind 250+ enterprise contact centers for 23 years, then built the platform that runs it — so what you get isn\'t six disconnected tools, it\'s one system where every call, chat and message makes the next one better. Set up online in minutes. No sales call required.',
  primaryCta: 'Try Deep Customer Insights Live',
  secondaryCta: 'Talk to Us',
  trustQuote: '"Built by people who have run the floor for 23 years — not people who have read about it."',
  stats: [
    { value: '23+ yrs', label: 'in contact center operations' },
    { value: '250+', label: 'enterprise clients' },
    { value: '97%', label: 'client retention' },
    { value: 'ISO 27001:2022', label: 'certified' },
    { value: '6', label: 'products, 1 platform' },
  ],
  ctaBandTitle: 'See it work on your own call, in your own language, on your own phone.',
  ctaBandButton: 'Try the Live Demo — No Cost, No Commitment',
};

export const DEFAULT_PRICING = {
  gstRate: 18,
  telephony: { licenseRate: 1500, channelRate: 650, didRate: 75 },
  dialers: {
    tiers: [
      { min: 1, max: 5, rate: 1500 },
      { min: 6, max: 10, rate: 1200 },
      { min: 11, max: 20, rate: 1100 },
    ],
  },
  voiceBot: {
    setupFee: 30000,
    languageFee: 15000,
    perMinuteRate: 3.5,
    languages: ['Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'],
  },
  emailAutomation: {
    plans: [
      {
        key: 'starter', name: 'Starter', badge: 'Starter', price: 2999, unit: '/month', featured: false, contactOnly: false,
        features: ['Up to 10,000 emails/month', '3 active sequences', 'Standard deliverability monitoring'],
      },
      {
        key: 'growth', name: 'Growth', badge: 'Growth — most popular', price: 8999, unit: '/month', featured: true, contactOnly: false,
        features: ['Up to 50,000 emails/month', 'Unlimited sequences', 'Dedicated IP warm-up'],
      },
      {
        key: 'enterprise', name: 'Enterprise', badge: 'Enterprise', price: 0, unit: '', featured: false, contactOnly: true,
        features: ['Dedicated sending infrastructure', 'Custom deliverability SLAs', 'Volume-based pricing'],
      },
    ],
  },
  whatsapp: {
    plans: [
      {
        key: 'starter', name: 'Starter', badge: 'Starter', price: 4999, unit: '/month', featured: false, contactOnly: false,
        features: ['Green-tick verified number, up to 3 agent seats', '2 approved message templates', 'Shared inbox, standard support'],
      },
      {
        key: 'growth', name: 'Growth', badge: 'Growth — most popular', price: 12999, unit: '/month', featured: true, contactOnly: false,
        features: ['Up to 15 agent seats', 'Unlimited templates, catalog & commerce', 'Broadcast campaign tools & chatbot builder'],
      },
      {
        key: 'enterprise', name: 'Enterprise', badge: 'Enterprise', price: 0, unit: '', featured: false, contactOnly: true,
        features: ['Unlimited seats, multi-number/multi-brand', 'Dedicated account management', 'Custom integrations & SLA-backed onboarding'],
      },
    ],
    interactionRates: [
      { category: 'Marketing', rate: 0.94, use: 'Promotions, offers, re-engagement broadcasts' },
      { category: 'Utility', rate: 0.2, use: 'Order updates, delivery status, account alerts' },
      { category: 'Authentication', rate: 0.18, use: 'OTPs and login/verification codes' },
      { category: 'Service', rate: 0.04, use: 'Customer-initiated support replies within the 24-hr window' },
    ],
  },
};

export const DEFAULT_FAQS = {
  audit: [
    { q: 'What audio formats are supported?', a: 'MP3, WAV, and most common call-recording formats.' },
    { q: 'How do you decide which framework applies?', a: 'By the line of business you select — Inbound/Retention maps to CLAP, Outbound Sales maps to MAGIC Script\'s CRT/CST, Collections maps to RESO.' },
    { q: 'Is my uploaded data stored?', a: 'No — uploaded audio and the resulting transcript are deleted after your session, per our Data Retention Policy.' },
    { q: 'Can this integrate with our existing QA workflow?', a: 'Yes — it\'s built to plug into your existing QA workflow, not replace it. It runs alongside whatever process you have today and adds the scoring, without a rip-and-replace project.' },
  ],
  voice: [
    { q: 'Can the bot handle interruptions and follow-up questions?', a: 'Yes — it\'s built on conversational AI, not a fixed IVR tree.' },
    { q: 'What happens if the bot can\'t resolve the query?', a: 'It escalates — to a live agent or a scheduled callback, on your existing flow. No extra setup required.' },
    { q: 'Can it be trained on our specific scripts and FAQs?', a: 'Yes — point it at your existing scripts and FAQs and it plugs straight in. No lengthy integration project.' },
    { q: 'Which languages/dialects are supported today vs. on the roadmap?', a: 'English, Hindi, Hinglish, British English and American English today, with more planned.' },
  ],
  dialers: [
    { q: 'Can this integrate with our existing CRM?', a: 'Yes — it plugs into your existing CRM and call-routing stack without a rip-and-replace project.' },
    { q: 'Does it work with Deep Customer Insights out of the box?', a: 'Yes — every connected call is automatically eligible for CLAP, MAGIC Script or RESO scoring, no separate setup.' },
  ],
  email: [
    { q: 'Can I bring my own sending domain?', a: 'Yes — connect your own domain and we handle DKIM/SPF/DMARC setup as part of onboarding.' },
    { q: 'What happens if I go over my monthly email limit?', a: 'You\'re notified before you hit the cap, with the option to upgrade or top up rather than being cut off mid-campaign.' },
  ],
  whatsapp: [
    { q: 'Do I need my own Meta Business Manager account?', a: 'We can provision one for you or connect to your existing account and green-tick verification as part of onboarding.' },
    { q: 'What counts as a conversation/message for billing?', a: 'Each message is billed by Meta\'s category (Marketing, Utility, Authentication or Service) at the rates above — a 24-hour customer-service window opened by an incoming message is billed at the Service rate regardless of how many replies you send inside it.' },
    { q: 'Can I run automated chatbot flows and still hand off to a human?', a: 'Yes — the no-code builder handles FAQs, qualification and order-status flows, and hands the conversation to a live agent in the shared inbox the moment it can\'t resolve something, or on request.' },
    { q: 'Is the green tick guaranteed?', a: 'Official Business Verification is granted by Meta based on your business documentation — we manage the submission and support you through it, but final approval is Meta\'s call.' },
  ],
  telephony: [
    { q: 'What exactly makes a number "mobile look-alike"?', a: 'It\'s formatted and routed to present as a standard 10-digit mobile number rather than a visibly corporate pattern (1800/0XX toll-free or landline prefixes) — the same call quality, but far less likely to be ignored, screened, or flagged as spam.' },
    { q: 'How does the 2% Insights audit work?', a: 'A random 2% sample of your monthly call volume is automatically scored through Deep Customer Insights — CLAP, MAGIC Script or RESO depending on the call type — at no extra cost, so you get visibility into call quality without buying a separate product.' },
    { q: 'Can I change my license, channel or DID count later?', a: 'Yes — this is a configurable, self-serve plan. Scale up or down and your next bill reflects it.' },
    { q: 'Is there a bigger discount for high volume?', a: 'For large, custom deployments, [talk to Enterprise Sales](/contact) instead of checking out here.' },
  ],
};

export const DEFAULT_CHATBOT = {
  greeting: 'Hi! I\'m the CallMaster helpline bot. Ask me about our products, pricing, demos, refunds, or anything else — or tap a quick question below.',
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
    { keywords: [], pattern: 'product|offer|what (do you|can you)', excludePattern: 'pric|cost', reply: 'We build six products: Deep Customer Insights (call scoring/QA), Voice Bot, Dialers, Email Automation, WhatsApp Business API, and Cloud Telephony. Which one would you like to know more about?', target: '', anchor: '', label: '' },
    { keywords: [], pattern: 'support|help me|get support', excludePattern: '', reply: 'For support, reach our team via the Contact page — replies within one business day.', target: 'contact', anchor: '', label: 'Go to Contact' },
    { keywords: ['voice bot', 'voicebot', 'voice-bot'], pattern: '', excludePattern: '', reply: 'Our Voice Bot places real AI-driven calls — pick industry, call type, language and voice, and try it on your own number free. Setup is a one-time {{voiceBot.setupFee}} (+{{voiceBot.languageFee}} per extra regional language), then {{voiceBot.perMinuteRate}}/minute usage.', target: 'voice', anchor: 'voice-pricing', label: 'Open Voice Bot pricing' },
    { keywords: ['whatsapp', 'whats app'], pattern: '', excludePattern: '', reply: 'WhatsApp Business API gets you the official green tick, a shared team inbox, catalog/commerce and broadcast automation. Plans start at {{whatsapp.plans.0.price}}/month, plus Meta\'s pass-through per-message interaction charges.', target: 'whatsapp-api', anchor: 'whatsapp-pricing', label: 'Open WhatsApp API pricing' },
    { keywords: ['cloud telephony', 'telephony', 'phone number', 'did'], pattern: '', excludePattern: '', reply: 'Cloud Telephony gives you the mobile look-alike number — formatted to get answered like a normal 10-digit mobile, not screened like a landline or 1800 number. Configure licenses, channels and DIDs and pay online.', target: 'telephony', anchor: 'telephony-pricing', label: 'Configure Cloud Telephony' },
    { keywords: ['dialer', 'predictive', 'power dialer'], pattern: '', excludePattern: '', reply: 'Our Dialers support predictive, power and preview modes with DNC scrubbing built in. Pricing is tiered by seat count: {{dialers.tiers.0.rate}}/agent/month for 1–5 seats, {{dialers.tiers.1.rate}} for 6–10, {{dialers.tiers.2.rate}} for 11–20 — above 20 seats, talk to sales.', target: 'dialers', anchor: 'dialers-pricing', label: 'Open Dialer pricing' },
    { keywords: ['email automation', 'email sequence', 'drip'], pattern: '', excludePattern: '', reply: 'Email Automation covers drip sequences, deliverability monitoring and CRM sync, from {{emailAutomation.plans.0.price}}/month.', target: 'email-automation', anchor: 'email-pricing', label: 'Open Email Automation pricing' },
    { keywords: ['insight', 'audit', 'call scoring', 'clap', 'magic script', 'reso'], pattern: '', excludePattern: '', reply: 'Deep Customer Insights scores every call with the right framework — CLAP for service, MAGIC Script/CRT/CST for sales, RESO for collections. You can try it free on your own call.', target: 'audit', anchor: 'audit-pricing', label: 'Try Deep Customer Insights' },
    { keywords: ['pricing', 'price', 'cost', 'how much'], pattern: '', excludePattern: '', reply: 'Most products are self-serve — pick a plan and pay online instantly. Deep Customer Insights is volume-based, so we email you exact rates. Head to the Pricing page for a full breakdown by product.', target: 'pricing', anchor: '', label: 'See all pricing' },
    { keywords: ['refund', 'cancel', 'cancellation'], pattern: '', excludePattern: '', reply: 'You can cancel a subscription any time — it stays active till the end of the current billing cycle. One-time setup fees are refundable in full if work hasn\'t started yet. Full details are in our Refund & Cancellation Policy.', target: 'refund-policy', anchor: '', label: 'Read the Refund Policy' },
    { keywords: ['contact', 'talk to sales', 'human', 'agent', 'callback'], pattern: '', excludePattern: '', reply: 'Happy to connect you with our team — leave your details on the Contact page and we\'ll get back within one business day.', target: 'contact', anchor: '', label: 'Go to Contact' },
    { keywords: ['demo', 'trial', 'try it', 'free'], pattern: '', excludePattern: '', reply: 'You can try Deep Customer Insights on your own call, or have our Voice Bot call your own phone — both are free, no card required. Which would you like to try?', target: 'audit', anchor: '', label: 'Try a live demo' },
    { keywords: ['gst', 'tax', 'invoice'], pattern: '', excludePattern: '', reply: 'GST is charged at {{gstRate}}% on top of the subtotal at checkout, after any discount code is applied. Your invoice reflects the GST number you provide during checkout.', target: '', anchor: '', label: '' },
    { keywords: ['otp', 'verification', 'verify email'], pattern: '', excludePattern: '', reply: 'We verify every checkout with a one-time code sent to your official business email — this confirms it\'s really you before payment, and we don\'t accept personal addresses like Gmail or Yahoo for billing.', target: '', anchor: '', label: '' },
    { keywords: ['payment', 'razorpay', 'checkout', 'pay'], pattern: '', excludePattern: '', reply: 'Checkout runs through Razorpay. You\'ll see requirement → company details → email OTP → payment, with the final amount (incl. GST, minus any discount code) confirmed before you pay.', target: '', anchor: '', label: '' },
    { keywords: ['discount', 'promo', 'coupon', 'code'], pattern: '', excludePattern: '', reply: 'Discount codes are applied on the payment step of checkout, across every product — try {{site.promoCodeExample}} for 10% off, subtracted before GST.', target: '', anchor: '', label: '' },
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
  fromName: 'CallMaster',
  fromEmail: '', // blank = the SMTP user
  notifyTo: '', // comma-separated inboxes that receive new-message / lead / order alerts
  notify: { contact: true, lead: true, order: true, demo: true },
  autoReply: {
    enabled: false,
    subject: 'We received your message — CallMaster',
    body: 'Hi {{name}},\n\nThanks for reaching out to CallMaster. We\'ve received your message and will get back to you within one business day.\n\nRegards,\nTeam CallMaster',
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
      body: 'Every sales call has a skeleton: opening, context, offer, objection, rebuttal, outcome. The version of that skeleton that\'s actually converting right now is rarely the one written down six months ago. MAGIC Script\'s CRT and CST trajectories track — continuously, across your live portfolio — which opening, offer and rebuttal are closing deals today, and feed that back to every agent automatically. The script in front of your team should never be stale.',
    },
  ],
  whitepapersHeading: 'White papers',
  whitepapersSub: 'Two short, practical papers — leave your work email and we\'ll unlock the PDF instantly. No spam list, just the document.',
  gateNote: 'We save the name and work email you enter here so our team can follow up about the paper — we don\'t add you to any mailing list. See our Privacy Policy.',
};

export const DEFAULT_WHITEPAPERS = [
  { slug: 'mobile-look-alike-number', title: 'The Mobile Look-Alike Number', description: 'Why the number you call from decides whether your customer picks up. One page, no fluff.', order: 10 },
  { slug: 'clap-magic-script-reso', title: 'CLAP, MAGIC Script & RESO', description: 'The three frameworks behind Deep Customer Insights, explained in full — and why a software company alone couldn\'t have built them.', order: 20 },
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

/**
 * Page keys → URL paths. The keys are the ids used by the original single-file site ("audit", "voice", …)
 * and by the chatbot rules stored in the database, so admin-configured chatbot links keep working.
 */
export const ROUTES = {
  home: '/',
  audit: '/deep-customer-insights',
  voice: '/voice-bot',
  dialers: '/dialers',
  'email-automation': '/email-automation',
  'whatsapp-api': '/whatsapp-api',
  telephony: '/cloud-telephony',
  pricing: '/pricing',
  insights: '/insights',
  account: '/account',
  about: '/about',
  contact: '/contact',
  terms: '/terms',
  privacy: '/privacy',
  'cookie-policy': '/cookie-policy',
  'data-retention': '/data-retention',
  'refund-policy': '/refund-policy',
  // legacy ids used by older chatbot rules
  cookie: '/cookie-policy',
  retention: '/data-retention',
  refund: '/refund-policy',
};

export const pathFor = (key) => ROUTES[key] || (key ? `/${key}` : '/');

export const PRODUCT_PAGES = [
  { id: 'audit', label: 'Deep Customer Insights', desc: 'Score every call with CLAP, MAGIC Script or RESO.' },
  { id: 'voice', label: 'Voice Bot', desc: 'AI voice agents that call, qualify and resolve — in your language.' },
  { id: 'dialers', label: 'Dialers', desc: 'Predictive & power dialing that keeps agents talking, not dialing.' },
  { id: 'email-automation', label: 'Email Automation', desc: 'Drip sequences and deliverability monitoring, at BPO scale.' },
  { id: 'whatsapp-api', label: 'WhatsApp Business API', desc: 'Official green-tick API, shared inbox, broadcasts & bots.' },
  { id: 'telephony', label: 'Cloud Telephony', desc: 'Mobile look-alike numbers that actually get picked up.' },
];

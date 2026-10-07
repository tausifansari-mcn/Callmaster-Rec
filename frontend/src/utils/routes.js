/**
 * Page keys → URL paths. The keys are the ids used by the original single-file site ("audit", "voice", …)
 * and by the chatbot rules stored in the database, so admin-configured chatbot links keep working.
 */
export const ROUTES = {
  home: '/',
  audit: '/deep-customer-insights',
  voice: '/voice-bot',
  telephony: '/cloud-telephony',
  'sip-channels': '/sip-channels',
  'social-listening': '/social-listening',
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
  { id: 'audit', label: 'Quality Audits', desc: 'Score every call with CLAP, MAGIC Script or RESO.' },
  { id: 'voice', label: 'Voice Bots', desc: 'AI voice agents that call, qualify and resolve — in your language.' },
  { id: 'telephony', label: 'Cloud Telephony', desc: 'Mobile look-alike numbers that actually get picked up.' },
  { id: 'sip-channels', label: 'SIP Channels', desc: 'Concurrent-call capacity, quoted to your actual volume.' },
  { id: 'social-listening', label: 'Social Listening', desc: 'What customers say about you beyond the call.' },
];

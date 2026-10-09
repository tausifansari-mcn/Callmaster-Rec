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
  why: '/why',
  industries: '/industries',
  pricing: '/pricing',
  insights: '/insights',
  resources: '/resources',
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
  { id: 'audit', label: 'Quality Audits', desc: 'Every call scored, not just a sample', icon: 'audit' },
  { id: 'voice', label: 'Voice Bots', desc: 'Bots that actually call you', icon: 'voice' },
  { id: 'telephony', label: 'Cloud Telephony', desc: 'Call from a number that looks like a mobile', icon: 'telephony' },
  { id: 'sip-channels', label: 'SIP Channels', desc: 'Concurrent-call capacity, quoted right', icon: 'sip-channels' },
  { id: 'social-listening', label: 'Social Listening', desc: 'The signal beyond the call', icon: 'social-listening' },
];

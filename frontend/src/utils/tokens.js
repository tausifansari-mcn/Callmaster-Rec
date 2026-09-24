import { money, rate } from './format.js';

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

/**
 * Chatbot replies can embed live prices as {{path}} tokens, e.g. {{voiceBot.setupFee}} → ₹30,000.
 * Per-minute rates print as plain numbers ("₹3.5"), percentages without a currency sign.
 */
export function resolvePriceTokens(text, pricing) {
  return String(text).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, path) => {
    const v = get(pricing, path);
    if (typeof v === 'string') return v; // e.g. {{site.promoCodeExample}}
    if (typeof v !== 'number') return whole;
    if (path === 'gstRate') return String(v);
    if (/perMinuteRate$/.test(path)) return `₹${rate(v)}`;
    return money(v);
  });
}

/** Fills the "[domain]" / "[operating entity name]" placeholders once the admin has set real values. */
export function applySiteTokens(text, site) {
  let out = String(text);
  if (site.domain) out = out.replaceAll('[domain]', site.domain);
  if (site.entityName) out = out.replaceAll('[operating entity name]', site.entityName);
  return out;
}

export function emailFor(site, which) {
  return site.emails?.[which] || `${which}@${site.domain || '[domain]'}`;
}

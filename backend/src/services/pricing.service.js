import { z } from 'zod';
import { Promos, isPromoUsable } from '../repositories/promos.js';
import { ApiError } from '../utils/ApiError.js';
import { money } from '../utils/helpers.js';
import { getSetting } from './settings.service.js';

export const PRODUCTS = {
  'cloud-telephony': { name: 'Cloud Telephony', prefix: 'CL' },
  'voice-bot': { name: 'Voice Bot', prefix: 'VO' },
};
export const PRODUCT_KEYS = Object.keys(PRODUCTS);

const int = (min, max) => z.coerce.number().int().min(min).max(max);
const vendorName = z.string().trim().max(120).default('');
const vendorRate = z.coerce.number().min(0).max(1000000).default(0);
const configSchemas = {
  // vendorName/vendorRate: "what do you pay your current vendor?" price-match fields — both optional.
  'cloud-telephony': z.object({ lic: int(1, 10000), chan: int(0, 10000).default(0), did: int(0, 10000).default(0), vendorName, vendorRate }),
  'voice-bot': z.object({ languages: z.array(z.string().trim().min(1)).max(50).default([]), vendorRate }),
};

/**
 * "What do you pay your current vendor?" price match, shared by Cloud Telephony (per-licence) and Voice Bot
 * (per-minute, informational only — see priceItem). Bounded by pricing.<product>.vendorMin/vendorMax so a
 * implausibly low claimed rate gets flagged for manual review instead of auto-applied, and an implausibly
 * high one is rejected outright.
 */
function matchVendorRate(rate, name, ourRate, { vendorMin, vendorMax }, requireName = true) {
  if (!rate) return { state: 'none' };
  if (rate > vendorMax) return { state: 'invalid' };
  if (requireName && !name) return { state: 'noname' };
  if (rate < vendorMin) return { state: 'low', vendorRate: rate, vendorName: name };
  if (rate < ourRate) return { state: 'match', matchedRate: rate, vendorRate: rate, vendorName: name };
  if (rate === ourRate) return { state: 'same', matchedRate: rate, vendorRate: rate, vendorName: name };
  return { state: 'higher', vendorRate: rate, vendorName: name };
}

export const quoteRequestSchema = z.object({
  productKey: z.enum(PRODUCT_KEYS),
  config: z.record(z.any()).default({}),
  promoCode: z.string().trim().max(40).optional().default(''),
});

/** Price a single product configuration (before any discount). Always computed from server-side pricing. */
function priceItem(productKey, rawConfig, pricing) {
  const parsed = configSchemas[productKey].safeParse(rawConfig || {});
  if (!parsed.success) throw ApiError.badRequest('Invalid product configuration', parsed.error.flatten());
  const cfg = parsed.data;
  const base = { productKey, product: PRODUCTS[productKey].name };

  if (productKey === 'cloud-telephony') {
    const { licenseRate, channelRate, didRate, vendorMin, vendorMax } = pricing.telephony;
    const match = matchVendorRate(cfg.vendorRate, cfg.vendorName, licenseRate, { vendorMin, vendorMax });
    const matched = match.state === 'match' || match.state === 'same';
    const unitRate = matched ? match.matchedRate : licenseRate;
    const rows = [
      { label: 'User licenses', sub: `${cfg.lic} × ${money(unitRate)}/mo${matched ? ' (price-matched)' : ''}`, value: cfg.lic * unitRate },
      { label: 'Extra calling channels', sub: `${cfg.chan} × ${money(channelRate)}/mo`, value: cfg.chan * channelRate },
      { label: 'Extra DIDs', sub: `${cfg.did} × ${money(didRate)}/mo`, value: cfg.did * didRate },
    ];
    return { ...base, mode: 'cart', plan: 'Custom configuration', unit: '/month', billingNote: 'monthly', rows, config: cfg, vendorMatch: match };
  }

  if (productKey === 'voice-bot') {
    const { setupFee, languageFee, perMinuteRate, languages, vendorMin, vendorMax } = pricing.voiceBot;
    const chosen = [...new Set(cfg.languages)];
    const unknown = chosen.filter((l) => !languages.includes(l));
    if (unknown.length) throw ApiError.badRequest(`Unknown language: ${unknown.join(', ')}`);
    const rows = [{ label: 'Setup & onboarding', sub: 'one-time — English & Hindi', value: setupFee }];
    chosen.forEach((l) => rows.push({ label: `Regional language — ${l}`, sub: 'one-time add-on', value: languageFee }));
    // Per-minute usage is billed separately (see billingNote below), so a vendor price match here is informational
    // only — it does not change this quote's total. Our team confirms the actual per-minute rate in writing.
    const match = matchVendorRate(cfg.vendorRate, '', perMinuteRate, { vendorMin, vendorMax }, false);
    return {
      ...base,
      mode: 'cart',
      plan: `Setup${chosen.length ? ` + ${chosen.length} regional language${chosen.length > 1 ? 's' : ''}` : ''}`,
      unit: 'one-time',
      billingNote: `one-time — usage billed separately at ₹${perMinuteRate}/minute (English & Hindi included; regional languages billed at the same rate once purchased)`,
      rows,
      config: { languages: chosen, vendorRate: cfg.vendorRate },
      vendorMatch: match,
    };
  }
}

export async function resolvePromo(code) {
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return null;
  const promo = await Promos.findByCode(clean);
  if (!isPromoUsable(promo)) throw ApiError.badRequest("That code isn't valid. Try again.");
  return promo;
}

export async function buildQuote({ productKey, config, promoCode }) {
  const pricing = await getSetting('pricing');
  const item = priceItem(productKey, config, pricing);

  const subtotal = item.mode === 'plan' ? item.unitPrice * item.qty : item.rows.reduce((s, r) => s + r.value, 0);
  const promo = await resolvePromo(promoCode);
  const discountPct = promo ? promo.percent : 0;
  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const taxable = subtotal - discountAmount;
  const gstRate = pricing.gstRate;
  const gst = Math.round(taxable * (gstRate / 100));

  return {
    ...item,
    subtotal,
    discountCode: promo ? promo.code : '',
    discountPct,
    discountAmount,
    taxable,
    gstRate,
    gst,
    total: taxable + gst,
    currency: 'INR',
  };
}

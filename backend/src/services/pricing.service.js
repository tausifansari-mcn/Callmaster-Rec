import { z } from 'zod';
import { Promos, isPromoUsable } from '../repositories/promos.js';
import { ApiError } from '../utils/ApiError.js';
import { money } from '../utils/helpers.js';
import { getSetting } from './settings.service.js';

export const PRODUCTS = {
  'cloud-telephony': { name: 'Cloud Telephony', prefix: 'CL' },
  dialers: { name: 'Dialers', prefix: 'DI' },
  'voice-bot': { name: 'Voice Bot', prefix: 'VO' },
  'email-automation': { name: 'Email Automation', prefix: 'EM' },
  'whatsapp-api': { name: 'WhatsApp Business API', prefix: 'WH' },
};
export const PRODUCT_KEYS = Object.keys(PRODUCTS);

const int = (min, max) => z.coerce.number().int().min(min).max(max);
const configSchemas = {
  'cloud-telephony': z.object({ lic: int(1, 10000), chan: int(0, 10000).default(0), did: int(0, 10000).default(0) }),
  dialers: z.object({ qty: int(1, 100000) }),
  'voice-bot': z.object({ languages: z.array(z.string().trim().min(1)).max(50).default([]) }),
  'email-automation': z.object({ planKey: z.string().trim().min(1), qty: int(1, 1000).default(1) }),
  'whatsapp-api': z.object({ planKey: z.string().trim().min(1), qty: int(1, 1000).default(1) }),
};

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
    const { licenseRate, channelRate, didRate } = pricing.telephony;
    const rows = [
      { label: 'User licenses', sub: `${cfg.lic} × ${money(licenseRate)}/mo`, value: cfg.lic * licenseRate },
      { label: 'Extra calling channels', sub: `${cfg.chan} × ${money(channelRate)}/mo`, value: cfg.chan * channelRate },
      { label: 'Extra DIDs', sub: `${cfg.did} × ${money(didRate)}/mo`, value: cfg.did * didRate },
    ];
    return { ...base, mode: 'cart', plan: 'Custom configuration', unit: '/month', billingNote: 'monthly', rows, config: cfg };
  }

  if (productKey === 'dialers') {
    const tier = pricing.dialers.tiers.find((t) => cfg.qty >= t.min && cfg.qty <= t.max);
    if (!tier) throw ApiError.badRequest('That seat count needs custom pricing — please talk to our enterprise team.');
    const rows = [{ label: 'Agent seats', sub: `${cfg.qty} × ${money(tier.rate)}/mo`, value: cfg.qty * tier.rate }];
    return {
      ...base, mode: 'cart', plan: `${cfg.qty} agent seat${cfg.qty > 1 ? 's' : ''}`, unit: '/month', billingNote: 'monthly', rows, config: cfg,
    };
  }

  if (productKey === 'voice-bot') {
    const { setupFee, languageFee, perMinuteRate, languages } = pricing.voiceBot;
    const chosen = [...new Set(cfg.languages)];
    const unknown = chosen.filter((l) => !languages.includes(l));
    if (unknown.length) throw ApiError.badRequest(`Unknown language: ${unknown.join(', ')}`);
    const rows = [{ label: 'Setup & onboarding', sub: 'one-time — English & Hindi', value: setupFee }];
    chosen.forEach((l) => rows.push({ label: `Regional language — ${l}`, sub: 'one-time add-on', value: languageFee }));
    return {
      ...base,
      mode: 'cart',
      plan: `Setup${chosen.length ? ` + ${chosen.length} regional language${chosen.length > 1 ? 's' : ''}` : ''}`,
      unit: 'one-time',
      billingNote: `one-time — usage billed separately at ₹${perMinuteRate}/minute (English & Hindi included; regional languages billed at the same rate once purchased)`,
      rows,
      config: { languages: chosen },
    };
  }

  // Plan-based products: email automation & WhatsApp
  const plans = productKey === 'email-automation' ? pricing.emailAutomation.plans : pricing.whatsapp.plans;
  const plan = plans.find((p) => p.key === cfg.planKey);
  if (!plan) throw ApiError.badRequest('Unknown plan');
  if (plan.contactOnly) throw ApiError.badRequest('This plan is not available for online purchase — please contact sales.');
  return {
    ...base,
    mode: 'plan',
    plan: plan.name,
    unit: plan.unit,
    qtyLabel: 'Quantity',
    qty: cfg.qty,
    unitPrice: plan.price,
    rows: [],
    config: { planKey: plan.key, qty: cfg.qty },
  };
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

import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useAuth, useToast } from '../AdminContext.jsx';
import SettingsEditor from '../components/SettingsEditor.jsx';

// ---------------------------------------------------------------- Pricing
const planFields = [
  { type: 'text', key: 'name', label: 'Plan name', hint: 'Shown in checkout, e.g. "Growth"' },
  { type: 'text', key: 'key', label: 'Plan ID', hint: 'Short internal ID: letters, numbers, dashes (unique per product)' },
  { type: 'text', key: 'badge', label: 'Badge text', hint: 'Small label on the card, e.g. "Growth — most popular"' },
  { type: 'number', key: 'price', label: 'Price', prefix: '₹', hint: 'Ignored for "contact sales" plans' },
  { type: 'text', key: 'unit', label: 'Billing unit', hint: 'e.g. /month' },
  { type: 'boolean', key: 'featured', label: 'Highlight', switchLabel: 'Show as featured (amber outline)' },
  { type: 'boolean', key: 'contactOnly', label: 'Availability', switchLabel: 'Contact sales only (no online purchase, shows "Custom")' },
  { type: 'strings', key: 'features', label: 'Features', addLabel: 'Add feature' },
];
const newPlan = () => ({ key: `plan-${Date.now().toString(36)}`, name: 'New plan', badge: 'New plan', price: 0, unit: '/month', featured: false, contactOnly: false, features: [] });
const planList = () => ({
  type: 'list', key: 'plans', label: 'Plans', addLabel: 'Add plan', fields: planFields, newItem: newPlan,
  itemTitle: (p) => `${p.name || 'Plan'}${p.contactOnly ? ' — contact sales' : p.price ? ` — ₹${Number(p.price).toLocaleString('en-IN')}${p.unit}` : ''}`,
  confirmRemove: 'Remove this plan from the live site?',
});

const PRICING_SECTIONS = [
  {
    id: 'general', label: 'General',
    fields: [{ type: 'number', key: 'gstRate', label: 'GST rate', suffix: '%', hint: 'Added on top of the subtotal (after any discount) at checkout.' }],
  },
  {
    id: 'telephony', label: 'Cloud Telephony',
    fields: [{
      type: 'group', key: 'telephony', label: 'Monthly rates', fields: [
        { type: 'number', key: 'licenseRate', label: 'Per user license', prefix: '₹', suffix: '/ month' },
        { type: 'number', key: 'channelRate', label: 'Per extra calling channel', prefix: '₹', suffix: '/ month' },
        { type: 'number', key: 'didRate', label: 'Per extra DID (number)', prefix: '₹', suffix: '/ month' },
      ],
    }],
  },
  {
    id: 'dialers', label: 'Dialers',
    fields: [{
      type: 'group', key: 'dialers', label: 'Seat-count tiers', hint: 'Tiers must not overlap. Seat counts above the highest tier show "Custom — talk to sales".', fields: [{
        type: 'list', key: 'tiers', label: 'Tiers', addLabel: 'Add tier', confirmRemove: 'Remove this tier?',
        itemTitle: (t) => `${t.min}–${t.max} agents`,
        newItem: () => ({ min: 21, max: 50, rate: 1000 }),
        fields: [
          { type: 'number', key: 'min', label: 'From (seats)', min: 1, step: 1 },
          { type: 'number', key: 'max', label: 'To (seats)', min: 1, step: 1 },
          { type: 'number', key: 'rate', label: 'Rate per agent', prefix: '₹', suffix: '/ month' },
        ],
      }],
    }],
  },
  {
    id: 'voice', label: 'Voice Bot',
    fields: [{
      type: 'group', key: 'voiceBot', label: 'Voice Bot pricing', fields: [
        { type: 'number', key: 'setupFee', label: 'One-time setup fee', prefix: '₹', hint: 'Includes English & Hindi' },
        { type: 'number', key: 'languageFee', label: 'Per regional language add-on', prefix: '₹', hint: 'One-time, per language' },
        { type: 'number', key: 'perMinuteRate', label: 'Usage rate', prefix: '₹', suffix: '/ minute', hint: 'Billed monthly — shown on the site, not charged at checkout' },
        { type: 'strings', key: 'languages', label: 'Regional languages offered', addLabel: 'Add language' },
      ],
    }],
  },
  { id: 'email', label: 'Email Automation', fields: [{ type: 'group', key: 'emailAutomation', label: 'Email Automation', fields: [planList()] }] },
  {
    id: 'whatsapp', label: 'WhatsApp API',
    fields: [{
      type: 'group', key: 'whatsapp', label: 'WhatsApp Business API', fields: [
        planList(),
        {
          type: 'list', key: 'interactionRates', label: 'Meta interaction rates (reference table)', addLabel: 'Add category', confirmRemove: 'Remove this row?',
          itemTitle: (r) => r.category || 'Category',
          newItem: () => ({ category: 'New category', rate: 0, use: '' }),
          fields: [
            { type: 'text', key: 'category', label: 'Category' },
            { type: 'number', key: 'rate', label: 'Rate per message', prefix: '₹' },
            { type: 'text', key: 'use', label: 'Typical use', wide: true },
          ],
        },
      ],
    }],
  },
];

export const PricingScreen = () => (
  <SettingsEditor
    settingKey="pricing"
    title="Pricing"
    subtitle="Every price on the site, the calculators and the checkout comes from here. Checkout totals are always recalculated on the server."
    sections={PRICING_SECTIONS}
    previewPath="/pricing"
  />
);

// ---------------------------------------------------------------- Home
export const HomeScreen = () => (
  <SettingsEditor
    settingKey="home"
    title="Home page"
    subtitle="Hero, trust line, stats and the closing call-to-action on the home page."
    previewPath="/"
    fields={[
      { type: 'text', key: 'eyebrow', label: 'Small heading above the title' },
      { type: 'text', key: 'title', label: 'Main headline', wide: true },
      { type: 'textarea', key: 'sub', label: 'Intro paragraph', rows: 6 },
      { type: 'text', key: 'primaryCta', label: 'Primary button text' },
      { type: 'text', key: 'secondaryCta', label: 'Secondary button text' },
      { type: 'text', key: 'trustQuote', label: 'Trust quote', wide: true },
      {
        type: 'list', key: 'stats', label: 'Stats under the quote', addLabel: 'Add stat', itemTitle: (s) => `${s.value} ${s.label}`,
        newItem: () => ({ value: '', label: '' }),
        fields: [{ type: 'text', key: 'value', label: 'Value', placeholder: '250+' }, { type: 'text', key: 'label', label: 'Label', placeholder: 'enterprise clients' }],
      },
      { type: 'text', key: 'ctaBandTitle', label: 'Closing banner headline', wide: true },
      { type: 'text', key: 'ctaBandButton', label: 'Closing banner button text' },
    ]}
  />
);

// ---------------------------------------------------------------- FAQs
// Each FAQ set is an array stored directly under its key.
const faqList = (key, label) => ({
  type: 'list', key, label: `${label} FAQs`, addLabel: 'Add question', confirmRemove: 'Remove this question?',
  itemTitle: (f) => f.q || 'New question',
  newItem: () => ({ q: '', a: '' }),
  fields: [{ type: 'text', key: 'q', label: 'Question', wide: true }, { type: 'textarea', key: 'a', label: 'Answer', rows: 3 }],
});

const FAQ_SECTIONS = [
  { id: 'audit', label: 'Insights', fields: [faqList('audit', 'Deep Customer Insights')] },
  { id: 'voice', label: 'Voice Bot', fields: [faqList('voice', 'Voice Bot')] },
  { id: 'dialers', label: 'Dialers', fields: [faqList('dialers', 'Dialers')] },
  { id: 'email', label: 'Email', fields: [faqList('email', 'Email Automation')] },
  { id: 'whatsapp', label: 'WhatsApp', fields: [faqList('whatsapp', 'WhatsApp Business API')] },
  { id: 'telephony', label: 'Telephony', fields: [faqList('telephony', 'Cloud Telephony')] },
];

export const FaqScreen = () => (
  <SettingsEditor
    settingKey="faqs"
    title="FAQs"
    subtitle="The FAQ section at the bottom of each product page. Answers support **bold** and [link text](/contact)."
    sections={FAQ_SECTIONS}
  />
);

// ---------------------------------------------------------------- Chatbot
const TARGETS = [
  { value: '', label: '— no link —' },
  { value: 'home', label: 'Home' }, { value: 'audit', label: 'Deep Customer Insights' }, { value: 'voice', label: 'Voice Bot' },
  { value: 'dialers', label: 'Dialers' }, { value: 'email-automation', label: 'Email Automation' },
  { value: 'whatsapp-api', label: 'WhatsApp Business API' }, { value: 'telephony', label: 'Cloud Telephony' },
  { value: 'pricing', label: 'Pricing' }, { value: 'about', label: 'About' }, { value: 'contact', label: 'Contact' },
  { value: 'terms', label: 'Terms & Conditions' }, { value: 'privacy', label: 'Privacy Policy' },
  { value: 'cookie-policy', label: 'Cookie Policy' }, { value: 'data-retention', label: 'Data Retention Policy' },
  { value: 'refund-policy', label: 'Refund & Cancellation Policy' },
];

export const ChatbotScreen = () => (
  <SettingsEditor
    settingKey="chatbot"
    title="Chatbot"
    subtitle="The helpline bubble on the site. Rules are checked top to bottom — the first match wins, so put specific rules above general ones."
    fields={[
      { type: 'textarea', key: 'greeting', label: 'Greeting message', rows: 2 },
      { type: 'textarea', key: 'fallback', label: 'Reply when nothing matches', rows: 2, hint: 'A "Go to Contact" link is added automatically.' },
      { type: 'strings', key: 'quickReplies', label: 'Quick-reply buttons', addLabel: 'Add button' },
      {
        type: 'list', key: 'rules', label: 'Reply rules', addLabel: 'Add rule', confirmRemove: 'Remove this rule?',
        hint: 'Prices can be inserted so they stay in sync with the Pricing screen, e.g. {{voiceBot.setupFee}}, {{voiceBot.perMinuteRate}}, {{dialers.tiers.0.rate}}, {{emailAutomation.plans.0.price}}, {{whatsapp.plans.0.price}}, {{telephony.licenseRate}}, {{gstRate}}.',
        itemTitle: (r, i) => `${i + 1}. ${r.keywords?.filter(Boolean).slice(0, 3).join(', ') || (r.pattern ? `/${r.pattern}/` : 'Untitled rule')}`,
        newItem: () => ({ keywords: [], pattern: '', excludePattern: '', reply: '', target: '', anchor: '', label: '' }),
        fields: [
          { type: 'csv', key: 'keywords', label: 'Keywords', wide: true, placeholder: 'voice bot, voicebot', hint: 'Comma-separated. The rule matches when the visitor’s message contains any of them.' },
          { type: 'textarea', key: 'reply', label: 'Bot reply', rows: 3 },
          { type: 'select', key: 'target', label: 'Link to page', options: TARGETS },
          { type: 'text', key: 'label', label: 'Link text', placeholder: 'Open Voice Bot pricing' },
          { type: 'text', key: 'anchor', label: 'Scroll to section ID (optional)', placeholder: 'voice-pricing' },
          { type: 'text', key: 'pattern', label: 'Advanced: regular expression (optional)', wide: true },
          { type: 'text', key: 'excludePattern', label: 'Advanced: ignore when this expression matches', wide: true },
        ],
      },
    ]}
  />
);

// ---------------------------------------------------------------- Site settings
export const SiteScreen = () => (
  <SettingsEditor
    settingKey="site"
    title="Site settings"
    subtitle="Brand, contact details and the sandbox notices. Entering your domain and company name replaces the [domain] / [operating entity name] placeholders across the site and legal pages."
    previewPath="/"
    fields={[
      { type: 'text', key: 'brandName', label: 'Brand name (navigation bar)' },
      { type: 'text', key: 'siteTitle', label: 'Browser tab title', wide: true },
      { type: 'text', key: 'navCtaLabel', label: 'Navigation button text' },
      { type: 'text', key: 'domain', label: 'Domain', placeholder: 'callmaster.in', hint: 'Used for hello@, sales@, support@, privacy@ when no full address is set below.' },
      { type: 'text', key: 'entityName', label: 'Operating entity name', placeholder: 'CallMaster Pvt Ltd' },
      {
        type: 'group', key: 'emails', label: 'Contact email addresses (optional overrides)', fields: [
          { type: 'text', key: 'hello', label: 'General', placeholder: 'hello@yourdomain.com' },
          { type: 'text', key: 'sales', label: 'Sales' },
          { type: 'text', key: 'support', label: 'Support' },
          { type: 'text', key: 'privacy', label: 'Privacy / grievance' },
        ],
      },
      { type: 'textarea', key: 'phoneAddress', label: 'Phone & office address', rows: 2, hint: 'Shown on the Contact page. Leave empty to keep the placeholder.' },
      {
        type: 'group', key: 'sandboxBanner', label: 'Home page “sandbox build” badge', fields: [
          { type: 'boolean', key: 'show', label: 'Visibility', switchLabel: 'Show the badge' },
          { type: 'text', key: 'text', label: 'Badge text' },
        ],
      },
      { type: 'text', key: 'footerNote', label: 'Footer note', wide: true, hint: 'Leave empty to hide the line under the footer links.' },
    ]}
  />
);

// ---------------------------------------------------------------- Email & notifications
function TestEmailCard() {
  const { admin } = useAuth();
  const toast = useToast();
  const [to, setTo] = useState(admin.email);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await adminApi.testEmail(to);
      setResult({ ok: true, text: `Sent to ${r.to} using the ${r.source} settings. Check the inbox (and spam).` });
      toast.success('Test email sent');
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-card">
      <h3 className="adm-card-title">Send a test email</h3>
      <p className="adm-muted small" style={{ marginTop: -6 }}>Uses the <strong>saved</strong> settings above — save your changes first, then send a test to confirm they work.</p>
      <div className="adm-string-row" style={{ maxWidth: 520 }}>
        <input className="adm-input" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@company.com" />
        <button type="button" className="adm-btn primary" onClick={send} disabled={busy || !to}>{busy ? 'Sending…' : 'Send test'}</button>
      </div>
      {result && <div className={result.ok ? 'adm-toast' : 'adm-error'} style={{ marginTop: 12, display: 'block' }}>{result.text}</div>}
    </div>
  );
}

export const EmailScreen = () => (
  <>
    <SettingsEditor
      settingKey="email"
      title="Email & notifications"
      subtitle="Connect your mailbox so new messages, pricing requests and orders are emailed to you, visitors get an optional confirmation, and you can reply from the Contact messages screen. Everything is still saved in the panel either way."
      fields={[
        {
          type: 'group', key: 'smtp', label: 'Outgoing mail server (SMTP)',
          hint: 'Gmail: smtp.gmail.com · port 587 · SSL off · use an App Password. Microsoft 365: smtp.office365.com · port 587 · SSL off. Port 465 needs SSL on. Leave the host empty to use the SMTP_* values from backend/.env.',
          fields: [
            { type: 'text', key: 'host', label: 'SMTP host', placeholder: 'smtp.yourprovider.com' },
            { type: 'number', key: 'port', label: 'Port', step: 1, min: 1 },
            { type: 'text', key: 'user', label: 'Login (usually the full email address)', placeholder: 'you@yourdomain.com' },
            { type: 'password', key: 'pass', label: 'Password / app password', hint: 'Stored encrypted. Shown as ******** once saved — leave it to keep the current one.' },
            { type: 'boolean', key: 'secure', label: 'Encryption', switchLabel: 'Use SSL/TLS from the start (port 465)' },
          ],
        },
        { type: 'text', key: 'fromName', label: 'Sender name', placeholder: 'CallMaster' },
        { type: 'text', key: 'fromEmail', label: 'Sender email (optional)', placeholder: 'Defaults to the login above', hint: 'Some providers only allow the login address here.' },
        { type: 'text', key: 'notifyTo', label: 'Send notifications to', wide: true, placeholder: 'tausif.ansari@teammas.in, sales@yourdomain.com', hint: 'Comma-separated. The visitor’s address is set as Reply-To, so replying from your inbox goes straight to them.' },
        {
          type: 'group', key: 'notify', label: 'Email me when…', fields: [
            { type: 'boolean', key: 'contact', label: 'Contact form', switchLabel: 'Someone sends a message' },
            { type: 'boolean', key: 'lead', label: 'Pricing requests', switchLabel: 'Someone requests Insights pricing' },
            { type: 'boolean', key: 'order', label: 'Orders', switchLabel: 'A payment completes' },
            { type: 'boolean', key: 'demo', label: 'Demos', switchLabel: 'A demo is run' },
          ],
        },
        {
          type: 'group', key: 'autoReply', label: 'Auto-reply to people who use the Contact form',
          hint: 'Placeholders: {{name}}, {{organization}}, {{email}}.',
          fields: [
            { type: 'boolean', key: 'enabled', label: 'Status', switchLabel: 'Send an automatic confirmation' },
            { type: 'text', key: 'subject', label: 'Subject', wide: true },
            { type: 'textarea', key: 'body', label: 'Message', rows: 7 },
          ],
        },
      ]}
    />
    <TestEmailCard />
  </>
);

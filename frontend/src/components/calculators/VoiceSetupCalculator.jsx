import { useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { isEmail } from '../../utils/validators.js';

/**
 * Voice bot quote builder — markup and copy follow the theme's #vbq block (template-voice-bots.php +
 * assets/js/quotes.js). Prices come from the admin pricing settings; the request opens this app's
 * checkout with the configuration, the visitor's details and the scope of work already filled in.
 */
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const inr2 = (n) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
/** The theme's PHP nimantran_inr(): whole numbers without decimals, otherwise two decimals. */
const inrFixed = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 })}`;
const SCOPE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];

/** Mirrors quotes.js vbRate(); the server recomputes the real price. */
function vendorState(raw, ourRate, vendorMin, vendorMax) {
  const t = String(raw || '').trim();
  if (!t) return { state: 'none' };
  const v = parseFloat(t);
  if (Number.isNaN(v) || v < vendorMin || v > vendorMax) return { state: 'invalid' };
  if (v < ourRate) return { state: 'match', rate: v };
  if (v === ourRate) return { state: 'same', rate: v };
  return { state: 'higher', rate: ourRate, vendor: v };
}

function fileError(f) {
  if (!f) return 'Upload your scope of work so we understand what the bot needs to do.';
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  if (!SCOPE_TYPES.includes(ext)) return 'Upload the scope of work as PDF, Word, Excel, CSV or text.';
  if (f.size > 10 * 1048576) return 'That file is over 10 MB. Please upload a smaller file.';
  return '';
}

export function VoiceQuoteIntro() {
  const { perMinuteRate } = useSite().pricing.voiceBot;
  return (
    <div className="section-head" style={{ margin: '72px 0 24px' }}>
      <div className="kicker">Get a voice bot quote</div>
      <h2>Build your plan and see what it costs.</h2>
      <p>Calls from {inrFixed(perMinuteRate)} per minute in English, Hindi and Hinglish. Upload your scope of work and we&apos;ll come back with a plan.</p>
    </div>
  );
}

export default function VoiceSetupCalculator() {
  const { setupFee, languageFee, languages, perMinuteRate, vendorMin, vendorMax } = useSite().pricing.voiceBot;
  const { openCart } = usePurchase();
  const [selected, setSelected] = useState([]);
  const [minutes, setMinutes] = useState('');
  const [vendorRate, setVendorRate] = useState('');
  const [file, setFile] = useState(null);
  const [who, setWho] = useState({ name: '', company: '', email: '', phone: '' });
  const [error, setError] = useState('');

  const toggle = (lang) => setSelected((s) => (s.includes(lang) ? s.filter((l) => l !== lang) : [...s, lang]));
  const chosen = languages.filter((l) => selected.includes(l)); // keep the admin-defined order
  const r = vendorState(vendorRate, perMinuteRate, vendorMin, vendorMax);
  const eff = ['match', 'same', 'higher'].includes(r.state) ? r.rate : perMinuteRate;
  const mins = Math.max(0, Math.min(100000000, parseInt(minutes, 10) || 0));
  const reg = chosen.length * languageFee;
  const setWhoField = (k) => (e) => setWho((w) => ({ ...w, [k]: e.target.value }));

  const request = () => {
    const t = Object.fromEntries(Object.entries(who).map(([k, v]) => [k, v.trim()]));
    let err = '';
    if (!t.name || !t.company) err = 'Enter your name and company.';
    else if (!isEmail(t.email)) err = 'Enter a valid work email.';
    else if (!t.phone) err = 'Enter a phone number we can reach you on.';
    else if (fileError(file)) err = fileError(file);
    else if (r.state === 'invalid') err = 'Enter your current rate in rupees per minute, or leave it blank.';
    setError(err);
    if (err) return;
    openCart({
      productKey: 'voice-bot',
      product: 'Voice Bot',
      config: { languages: chosen, vendorRate: vendorRate || 0 },
      requiresFileUpload: true,
      scopeFile: file,
      customer: { contact: t.name, company: t.company, email: t.email, phone: t.phone },
    });
  };

  let match = null;
  if (r.state === 'match' || r.state === 'same') {
    match = <div className="match-box good" role="status"><div className="match-title">Congratulations! We can offer you the same rate.</div><p>{inr2(r.rate)} per minute, matching what you pay your current vendor. Our team confirms the rate in writing before you commit. The one-time setup charge applies.</p></div>;
  } else if (r.state === 'higher') {
    match = <div className="match-box good" role="status"><div className="match-title">Good news: our rate is lower than yours.</div><p>You pay {inr2(r.vendor)} per minute today. Nimantran voice bot calls start at {inr2(perMinuteRate)} per minute.</p></div>;
  } else if (r.state === 'invalid') {
    match = <div className="match-box warn" role="status"><p>Enter your current rate in ₹ per minute, between {inr(vendorMin)} and {inr(vendorMax)}.</p></div>;
  }

  return (
    <div className="cfg-grid">
      <div className="cfg-card">
        <div className="field-label">Languages</div>
        <p className="cfg-hint">English, Hindi and Hinglish are included. Each regional language adds {inrFixed(languageFee)} one time.</p>
        <div className="lang-grid">
          {languages.map((l) => <label key={l}><input type="checkbox" value={l} checked={selected.includes(l)} onChange={() => toggle(l)} /> {l}</label>)}
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label htmlFor="vbq_minutes">Expected call minutes per month <span className="opt">(optional)</span></label>
          <input type="number" id="vbq_minutes" min="0" inputMode="numeric" placeholder="e.g. 20000" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>

        <div className="field vendor-field">
          <label htmlFor="vbq_vendor">What rate do you pay your current vendor, per minute?</label>
          <div className="rupee-wrap"><span>&#8377;</span><input type="number" id="vbq_vendor" min="0" step="0.05" inputMode="decimal" placeholder="e.g. 3.25" value={vendorRate} onChange={(e) => setVendorRate(e.target.value)} /></div>
        </div>
        {match}

        <div className="field-label" style={{ marginTop: 20 }} id="vbq_file_label">Scope of work</div>
        <button type="button" className="upload-box" aria-labelledby="vbq_file_label vbq_file_name" onClick={() => document.getElementById('vbq_file').click()}>
          <span id="vbq_file_name">{file ? `Selected: ${file.name}` : 'Click to choose a file (PDF, Word, Excel, CSV or text, up to 10 MB)'}</span>
        </button>
        <input type="file" id="vbq_file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" style={{ display: 'none' }} aria-labelledby="vbq_file_label" onChange={(e) => setFile(e.target.files[0] || null)} />
      </div>

      <div className="est-card">
        <h3>Your estimate</h3>
        <div aria-live="polite">
          <div className="est-line"><span>One-time setup</span><b>{inr(setupFee)}</b></div>
          {chosen.length > 0 && <div className="est-line"><span>{chosen.length} regional language{chosen.length > 1 ? 's' : ''} × {inr(languageFee)} one-time</span><b>{inr(reg)}</b></div>}
          <div className="est-total"><span>One-time total</span><b>{inr(setupFee + reg)}</b></div>
          <div className="est-line" style={{ marginTop: 14 }}><span>Calls (English, Hindi, Hinglish and regional)</span><b>{inr2(eff)} / min</b></div>
          {mins > 0 && <div className="est-line"><span>{mins.toLocaleString('en-IN')} min / month</span><b>{inr(mins * eff)} / month</b></div>}
          <p className="est-note">Excluding GST. Rates from {inr2(perMinuteRate)} per minute.</p>
        </div>
        <div className="req-mini">
          <div>
            <div className="field"><label htmlFor="vbq_name">Full name</label><input type="text" id="vbq_name" autoComplete="name" value={who.name} onChange={setWhoField('name')} /></div>
            <div className="field"><label htmlFor="vbq_company">Company</label><input type="text" id="vbq_company" autoComplete="organization" value={who.company} onChange={setWhoField('company')} /></div>
            <div className="field"><label htmlFor="vbq_email">Work email</label><input type="email" id="vbq_email" autoComplete="email" value={who.email} onChange={setWhoField('email')} /></div>
            <div className="field"><label htmlFor="vbq_phone">Phone</label><input type="tel" id="vbq_phone" autoComplete="tel" value={who.phone} onChange={setWhoField('phone')} /></div>
            <div className="error-text" role="alert" style={{ marginTop: 0, display: error ? 'block' : 'none' }}>{error}</div>
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={request}>Request voice bot plan</button>
            <p className="est-note" style={{ marginTop: 10 }}>Next, confirm your company details and verify your email, then pay the one-time setup online.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

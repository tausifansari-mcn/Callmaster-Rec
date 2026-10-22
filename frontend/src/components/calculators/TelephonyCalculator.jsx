import { useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSite } from '../../context/SiteContext.jsx';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { isEmail } from '../../utils/validators.js';

/**
 * Cloud Telephony configurator — markup and copy follow the theme's template-cloud-telephony.php +
 * assets/js/quotes.js. Prices come from the admin pricing settings; discount codes are checked with
 * the server's quote endpoint, and "Request this plan" opens this app's checkout pre-filled.
 */
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const inr2 = (n) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const clampInt = (raw, min, max) => { const v = parseInt(raw, 10); return Math.max(min, Math.min(max, Number.isNaN(v) ? min : v)); };

/** Mirrors quotes.js ctRate() (and the server's matchVendorRate) for an instant preview. */
function vendorState(rawRate, rawName, c) {
  const raw = String(rawRate || '').trim(); const name = String(rawName || '').trim();
  if (!raw) return { state: 'none' };
  const v = parseFloat(raw);
  if (Number.isNaN(v) || v <= 0 || v > c.vendorMax) return { state: 'invalid' };
  if (!name) return { state: 'noname' };
  if (v < c.vendorMin) return { state: 'low', vendor: v, name };
  if (v < c.licenseRate) return { state: 'match', rate: v, vendor: v, name };
  if (v === c.licenseRate) return { state: 'same', rate: v, vendor: v, name };
  return { state: 'higher', vendor: v, name };
}

function MatchBox({ m, c }) {
  const perk = ' You also get more benefits, including 2% of your calls audited free in your first month.';
  if (m.state === 'match' || m.state === 'same') {
    return <div className="match-box good" role="status" aria-live="polite"><div className="match-title">Congratulations! We can match your price.</div><p>{inr2(m.rate)} per licence per month, the same as you pay {m.name} today.{perk} Our team confirms the price in writing before you commit. The discount code is not available with a price match.</p></div>;
  }
  if (m.state === 'higher') {
    return <div className="match-box good" role="status" aria-live="polite"><div className="match-title">Good news: our price is lower than yours.</div><p>You pay {m.name} {inr2(m.vendor)} per licence today. Nimantran licences are {inr(c.licenseRate)} per month.{perk}</p></div>;
  }
  if (m.state === 'low') {
    return <div className="match-box warn" role="status" aria-live="polite"><p>Thank you. Prices below {inr(c.vendorMin)} per licence need a manual review. Request this plan and our team will come back to you with the best price we can offer. The estimate stays at the standard price for now.</p></div>;
  }
  if (m.state === 'noname') return <div className="match-box warn" role="status" aria-live="polite"><p>Enter the name of your current provider to see if we can match your price.</p></div>;
  if (m.state === 'invalid') return <div className="match-box warn" role="status" aria-live="polite"><p>Enter what you pay per licence per month in rupees, up to {inr(c.vendorMax)}.</p></div>;
  return null;
}

function Row({ id, label, price, value, setValue, min, max, less, more }) {
  const step = (d) => setValue(String(clampInt(clampInt(value, min, max) + d, min, max)));
  return (
    <div className="cfg-row">
      <div><label htmlFor={id}>{label}</label><span className="cfg-price">{price}</span></div>
      <div className="stepper">
        <button type="button" aria-label={less} onClick={() => step(-1)}>&minus;</button>
        <input type="number" id={id} value={value} min={min} max={max} inputMode="numeric" onChange={(e) => setValue(e.target.value)} />
        <button type="button" aria-label={more} onClick={() => step(1)}>+</button>
      </div>
    </div>
  );
}

export default function TelephonyCalculator() {
  const { pricing: { telephony: c }, site } = useSite();
  const { openCart, openCancel } = usePurchase();
  const [licRaw, setLic] = useState('1');
  const [chanRaw, setChan] = useState('0');
  const [didRaw, setDid] = useState('0');
  const [vendorName, setVendorName] = useState('');
  const [vendorRate, setVendorRate] = useState('');
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState({ pct: 0, code: '', msg: '', ok: false });
  const [who, setWho] = useState({ name: '', company: '', email: '', phone: '' });
  const [error, setError] = useState('');

  const lic = clampInt(licRaw, 1, 1000); const chan = clampInt(chanRaw, 0, 5000); const did = clampInt(didRaw, 0, 5000);
  const m = vendorState(vendorRate, vendorName, c);
  const matched = m.state === 'match' || m.state === 'same';
  const unit = matched ? m.rate : c.licenseRate;
  const saving = lic * (c.licenseRate - unit);
  const sub = lic * c.licenseRate + chan * c.channelRate + did * c.didRate - saving;
  const pct = matched ? 0 : promo.pct; // a price match and a discount code are not combined
  const disc = (sub * pct) / 100;
  const config = { lic, chan, did, vendorName: vendorName.trim(), vendorRate: vendorRate || 0 };

  const applyCode = async () => {
    const value = code.trim().toUpperCase();
    if (!value) { setPromo({ pct: 0, code: '', msg: '', ok: false }); return; }
    try {
      const q = await publicApi.quote({ productKey: 'cloud-telephony', config, promoCode: value });
      if (q.discountPct > 0) setPromo({ pct: q.discountPct, code: q.discountCode || value, ok: true, msg: `Code applied: ${q.discountPct}% off your monthly total.` });
      else setPromo({ pct: 0, code: '', ok: false, msg: 'That code is not valid.' });
    } catch (err) {
      setPromo({ pct: 0, code: '', ok: false, msg: err.status && err.status < 500 ? 'That code is not valid.' : 'Could not check the code right now. Try again.' });
    }
  };

  const setWhoField = (k) => (e) => setWho((w) => ({ ...w, [k]: e.target.value }));
  const request = () => {
    const t = Object.fromEntries(Object.entries(who).map(([k, v]) => [k, v.trim()]));
    let err = '';
    if (!t.name || !t.company) err = 'Enter your name and company.';
    else if (!isEmail(t.email)) err = 'Enter a valid work email.';
    else if (!t.phone) err = 'Enter a phone number we can reach you on.';
    else if (m.state === 'invalid') err = 'Enter what you pay per licence per month in rupees, or leave it blank.';
    else if (m.state === 'noname') err = 'Enter the name of your current provider, or clear the price you pay today.';
    setError(err);
    if (err) return;
    openCart({
      productKey: 'cloud-telephony',
      product: 'Cloud Telephony',
      config,
      promoCode: pct ? promo.code : '',
      customer: { contact: t.name, company: t.company, email: t.email, phone: t.phone },
    });
  };

  const care = site.emails?.care || 'care@nimantran.ai';

  return (
    <>
      <div className="cfg-grid">
        <div className="cfg-card">
          <Row id="ct_lic" label="User licences" price={`${inr(c.licenseRate)} per user per month`} value={licRaw} setValue={setLic} min={1} max={1000} less="Fewer licences" more="More licences" />
          <Row id="ct_chan" label="Extra channels" price={`${inr(c.channelRate)} per channel per month`} value={chanRaw} setValue={setChan} min={0} max={5000} less="Fewer channels" more="More channels" />
          <Row id="ct_did" label="Extra numbers (DID)" price={`${inr(c.didRate)} per number per month`} value={didRaw} setValue={setDid} min={0} max={5000} less="Fewer numbers" more="More numbers" />
          <div className="cfg-row cfg-match">
            <div style={{ flex: 1 }}>
              <div className="cfg-title" id="ct_match_h">Already using another provider?</div>
              <span className="cfg-price">Tell us who it is and what you pay per licence. We will match your price and add more benefits.</span>
              <div className="grid2" style={{ marginTop: 12 }}>
                <div className="field" style={{ margin: 0 }}><label htmlFor="ct_vendor_name">Current provider</label><input type="text" id="ct_vendor_name" placeholder="Company name" autoComplete="off" value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></div>
                <div className="field" style={{ margin: 0 }}><label htmlFor="ct_vendor_rate">You pay per licence per month (&#8377;, excl. GST)</label><input type="number" id="ct_vendor_rate" min="0" step="1" inputMode="decimal" placeholder="e.g. 1200" value={vendorRate} onChange={(e) => setVendorRate(e.target.value)} /></div>
              </div>
              <MatchBox m={m} c={c} />
            </div>
          </div>
          {!matched && (
            <div className="cfg-row cfg-code">
              <div style={{ flex: 1 }}>
                <label htmlFor="ct_code">Discount code</label>
                <div className="code-wrap">
                  <input type="text" id="ct_code" placeholder="Enter code" autoComplete="off" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } }} />
                  <button type="button" className="btn btn-outline" onClick={applyCode}>Apply</button>
                </div>
                {promo.msg && <div className={`code-msg ${promo.ok ? 'ok' : 'bad'}`} role="status">{promo.msg}</div>}
              </div>
            </div>
          )}
        </div>
        <div className="est-card">
          <h3>Your monthly estimate</h3>
          <div aria-live="polite">
            <div className="est-line"><span>{lic} user licence{lic > 1 ? 's' : ''} × {inr(c.licenseRate)}</span><b>{inr(lic * c.licenseRate)}</b></div>
            {chan > 0 && <div className="est-line"><span>{chan} extra channel{chan > 1 ? 's' : ''} × {inr(c.channelRate)}</span><b>{inr(chan * c.channelRate)}</b></div>}
            {did > 0 && <div className="est-line"><span>{did} extra number{did > 1 ? 's' : ''} (DID) × {inr(c.didRate)}</span><b>{inr(did * c.didRate)}</b></div>}
            {saving > 0 && <div className="est-line est-disc"><span>Price match: {inr2(unit)} per licence</span><b>−{inr(saving)}</b></div>}
            {pct > 0 && <div className="est-line est-disc"><span>Discount code {promo.code} ({Math.round(pct)}% off)</span><b>−{inr(disc)}</b></div>}
            <div className="est-total"><span>Monthly total</span><b>{inr(sub - disc)}</b></div>
            <p className="est-note">Per month, excluding GST.</p>
          </div>
          <p className="refund-note">
            <strong>Cancel within {site.cancellationWindowDays} days</strong> of purchase for a full refund, paid to you within {site.refundWorkingDays} working days. This applies to Cloud Telephony only. To cancel, email <a href={`mailto:${care}`}>{care}</a> with your company name, or <button type="button" className="link-btn" onClick={openCancel}>request cancellation online</button>.
          </p>
        </div>
      </div>

      <div className="req-card">
        <h2>Request this plan</h2>
        <p>Send your details, verify your email and pay online. Your setup is provisioned as soon as payment completes.</p>
        <div>
          <div className="grid2">
            <div className="field"><label htmlFor="ct_name">Full name</label><input type="text" id="ct_name" autoComplete="name" value={who.name} onChange={setWhoField('name')} /></div>
            <div className="field"><label htmlFor="ct_company">Company</label><input type="text" id="ct_company" autoComplete="organization" value={who.company} onChange={setWhoField('company')} /></div>
            <div className="field"><label htmlFor="ct_email">Work email</label><input type="email" id="ct_email" autoComplete="email" value={who.email} onChange={setWhoField('email')} /></div>
            <div className="field"><label htmlFor="ct_phone">Phone</label><input type="tel" id="ct_phone" autoComplete="tel" value={who.phone} onChange={setWhoField('phone')} /></div>
          </div>
          <div className="error-text" role="alert" style={{ marginTop: 0, display: error ? 'block' : 'none' }}>{error}</div>
          <button type="button" className="btn btn-primary" onClick={request}>Request this plan</button>
        </div>
      </div>
    </>
  );
}

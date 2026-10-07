import { useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { money, rate, rate2 } from '../../utils/format.js';

/** Mirrors the server's matchVendorRate() (pricing.service.js, requireName=false) for an instant preview. */
function matchVendorRate(rawRate, ourRate, vendorMin, vendorMax) {
  const rateNum = parseFloat(rawRate);
  if (!rawRate || !(rateNum > 0)) return { state: 'none' };
  if (rateNum > vendorMax) return { state: 'invalid' };
  if (rateNum < vendorMin) return { state: 'low' };
  if (rateNum < ourRate) return { state: 'match', matchedRate: rateNum };
  if (rateNum === ourRate) return { state: 'same', matchedRate: rateNum };
  return { state: 'higher' };
}

function MatchBox({ match, ourRate, vendorMin, vendorMax }) {
  if (match.state === 'none') return null;
  if (match.state === 'match' || match.state === 'same') {
    return (
      <div className="match-box good">
        <div className="match-title">Congratulations! We can offer you the same rate.</div>
        <p>{rate2(match.matchedRate)} per minute, matching what you pay your current vendor. Our team confirms the rate in writing before you commit — the one-time setup charge above still applies.</p>
      </div>
    );
  }
  if (match.state === 'higher') {
    return <div className="match-box good"><div className="match-title">Good news: our rate is lower than yours.</div><p>Nimantran voice bot calls start at ₹{rate(ourRate)} per minute.</p></div>;
  }
  if (match.state === 'low') {
    return <div className="match-box warn"><p>Rates below ₹{rate(vendorMin)} per minute need a manual review — our team will come back with the best rate we can offer.</p></div>;
  }
  return <div className="match-box warn"><p>Enter your current rate in ₹ per minute, between ₹{rate(vendorMin)} and ₹{rate(vendorMax)}.</p></div>;
}

export default function VoiceSetupCalculator() {
  const { setupFee, languageFee, languages, perMinuteRate, vendorMin, vendorMax } = useSite().pricing.voiceBot;
  const { openCart } = usePurchase();
  const [selected, setSelected] = useState([]);
  const [vendorRate, setVendorRate] = useState('');

  const toggle = (lang) => setSelected((s) => (s.includes(lang) ? s.filter((l) => l !== lang) : [...s, lang]));
  const chosen = languages.filter((l) => selected.includes(l)); // keep the admin-defined order
  const total = setupFee + chosen.length * languageFee;
  const match = matchVendorRate(vendorRate, perMinuteRate, vendorMin, vendorMax);

  return (
    <div className="ct-calc">
      <div className="ct-line">
        <div>
          <div className="ct-line-label">Setup &amp; onboarding (one-time)</div>
          <div className="ct-line-sub">Build, testing, and go-live on English &amp; Hindi</div>
        </div>
        <div className="ct-price-tag">{money(setupFee)}</div>
      </div>
      {languages.length > 0 && (
        <div style={{ padding: '16px 0 4px' }}>
          <div className="ct-line-label" style={{ marginBottom: 2 }}>Add regional Indian languages</div>
          <div className="ct-line-sub" style={{ marginBottom: 12 }}>
            +{money(languageFee)} one-time, per language — billed at the same ₹{rate(perMinuteRate)}/min once selected
          </div>
          <div className="lang-check-list">
            {languages.map((lang) => (
              <label key={lang} className={`lang-check-item${selected.includes(lang) ? ' checked' : ''}`}>
                <input type="checkbox" checked={selected.includes(lang)} onChange={() => toggle(lang)} /> {lang}
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '16px 0 4px' }}>
        <div className="ct-line-label" style={{ marginBottom: 2 }}>What rate do you pay your current vendor, per minute?</div>
        <div className="ct-line-sub" style={{ marginBottom: 10 }}>Paying less elsewhere? Tell us and see if we can match it — confirmed with you before it applies.</div>
        <div className="field" style={{ maxWidth: 220 }}>
          <input type="number" min="0" step="0.05" value={vendorRate} onChange={(e) => setVendorRate(e.target.value)} placeholder={`e.g. ${rate2(perMinuteRate)}`} />
        </div>
        <MatchBox match={match} ourRate={perMinuteRate} vendorMin={vendorMin} vendorMax={vendorMax} />
      </div>

      <div className="ct-total-row"><span>One-time total</span><span>{money(total)}</span></div>
      <div className="btn-row" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn"
          onClick={() => openCart({ productKey: 'voice-bot', product: 'Voice Bot', config: { languages: chosen, vendorRate: vendorRate || 0 }, requiresFileUpload: true })}
        >
          Proceed to Purchase
        </button>
      </div>
    </div>
  );
}

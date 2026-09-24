import { useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { money, rate } from '../../utils/format.js';

export default function VoiceSetupCalculator() {
  const { setupFee, languageFee, languages, perMinuteRate } = useSite().pricing.voiceBot;
  const { openCart } = usePurchase();
  const [selected, setSelected] = useState([]);

  const toggle = (lang) => setSelected((s) => (s.includes(lang) ? s.filter((l) => l !== lang) : [...s, lang]));
  const chosen = languages.filter((l) => selected.includes(l)); // keep the admin-defined order
  const total = setupFee + chosen.length * languageFee;

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
      <div className="ct-total-row"><span>One-time total</span><span>{money(total)}</span></div>
      <div className="btn-row" style={{ marginTop: 18 }}>
        <button
          type="button"
          className="btn"
          onClick={() => openCart({ productKey: 'voice-bot', product: 'Voice Bot', config: { languages: chosen }, requiresFileUpload: true })}
        >
          Proceed to Purchase
        </button>
      </div>
    </div>
  );
}

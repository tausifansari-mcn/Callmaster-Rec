import { useState } from 'react';
import { useSite } from '../../context/SiteContext.jsx';
import { useIntField } from '../../hooks/useIntField.js';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { money, rate2 } from '../../utils/format.js';
import { Stepper, TotalRow } from './Stepper.jsx';

/** Mirrors the server's matchVendorRate() (pricing.service.js) for an instant preview — the server always recomputes the real price. */
function matchVendorRate(rawRate, name, ourRate, vendorMin, vendorMax) {
  const rateNum = parseFloat(rawRate);
  if (!rawRate || !(rateNum > 0)) return { state: 'none' };
  if (rateNum > vendorMax) return { state: 'invalid' };
  if (!name.trim()) return { state: 'noname' };
  if (rateNum < vendorMin) return { state: 'low' };
  if (rateNum < ourRate) return { state: 'match', matchedRate: rateNum };
  if (rateNum === ourRate) return { state: 'same', matchedRate: rateNum };
  return { state: 'higher' };
}

function MatchBox({ match, ourRate, vendorMin, vendorMax, vendorName }) {
  if (match.state === 'none') return null;
  if (match.state === 'match' || match.state === 'same') {
    return (
      <div className="match-box good">
        <div className="match-title">Congratulations! We can match your price.</div>
        <p>{money(match.matchedRate)} per licence per month, the same as you pay {vendorName} today. Confirmed in writing before you commit — plus 2% of your calls audited free in your first month.</p>
      </div>
    );
  }
  if (match.state === 'higher') {
    return (
      <div className="match-box good">
        <div className="match-title">Good news: our price is lower than yours.</div>
        <p>Nimantran licences are {money(ourRate)} per month — already less than what you told us.</p>
      </div>
    );
  }
  if (match.state === 'low') {
    return <div className="match-box warn"><p>Rates below {money(vendorMin)} per licence need a manual review. Proceed to purchase and our team will come back with the best price we can offer.</p></div>;
  }
  if (match.state === 'noname') {
    return <div className="match-box warn"><p>Enter the name of your current provider to see if we can match your price.</p></div>;
  }
  return <div className="match-box warn"><p>Enter what you pay per licence per month in rupees, up to {money(vendorMax)}.</p></div>;
}

export default function TelephonyCalculator() {
  const { pricing: { telephony }, site } = useSite();
  const { openCart, openCancel } = usePurchase();
  const lic = useIntField(1, 1);
  const chan = useIntField(0, 0);
  const did = useIntField(0, 0);
  const [vendorName, setVendorName] = useState('');
  const [vendorRate, setVendorRate] = useState('');

  const match = matchVendorRate(vendorRate, vendorName, telephony.licenseRate, telephony.vendorMin, telephony.vendorMax);
  const matched = match.state === 'match' || match.state === 'same';
  const unitRate = matched ? match.matchedRate : telephony.licenseRate;
  const total = lic.value * unitRate + chan.value * telephony.channelRate + did.value * telephony.didRate;

  const buy = () =>
    openCart({
      productKey: 'cloud-telephony',
      product: 'Cloud Telephony',
      config: { lic: lic.value, chan: chan.value, did: did.value, vendorName: vendorName.trim(), vendorRate: vendorRate || 0 },
    });

  return (
    <div className="ct-calc">
      <div className="ct-line">
        <div>
          <div className="ct-line-label">User licenses</div>
          <div className="ct-line-sub">{money(unitRate)} / license / month{matched ? ' (price-matched)' : ''}</div>
        </div>
        <Stepper field={lic} label="User licenses" />
        <div className="ct-price-tag">{money(lic.value * unitRate)}</div>
      </div>
      <div className="ct-line">
        <div>
          <div className="ct-line-label">Extra calling channels</div>
          <div className="ct-line-sub">{money(telephony.channelRate)} / channel / month — beyond your included channel</div>
        </div>
        <Stepper field={chan} label="Extra calling channels" />
        <div className="ct-price-tag">{money(chan.value * telephony.channelRate)}</div>
      </div>
      <div className="ct-line">
        <div>
          <div className="ct-line-label">Extra DIDs (numbers)</div>
          <div className="ct-line-sub">{money(telephony.didRate)} / DID / month — includes the mobile look-alike format</div>
        </div>
        <Stepper field={did} label="Extra DIDs" />
        <div className="ct-price-tag">{money(did.value * telephony.didRate)}</div>
      </div>

      <div style={{ padding: '18px 0 4px' }}>
        <div className="ct-line-label" style={{ marginBottom: 2 }}>Already using another provider?</div>
        <div className="ct-line-sub" style={{ marginBottom: 12 }}>Tell us who it is and what you pay per licence. We'll try to match your price and add more benefits.</div>
        <div className="field-row2">
          <div className="field"><label>Current provider</label><input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Company name" /></div>
          <div className="field"><label>You pay per licence/month (₹, excl. GST)</label><input type="number" min="0" step="1" value={vendorRate} onChange={(e) => setVendorRate(e.target.value)} placeholder={`e.g. ${rate2(telephony.licenseRate)}`} /></div>
        </div>
        <MatchBox match={match} ourRate={telephony.licenseRate} vendorMin={telephony.vendorMin} vendorMax={telephony.vendorMax} vendorName={vendorName} />
      </div>

      <div className="ct-audit-note" style={{ marginTop: 20 }}>
        ✓ 2% of your monthly call volume is automatically audited via Quality Audits — included in every plan, no extra line item.
      </div>

      <TotalRow amount={total} />
      {!matched && (
        <p className="plan-indicative" style={{ marginTop: 8 }}>
          Have a discount code, e.g. {site.promoCodeExample}? Apply it at checkout on the payment step — 10% off, subtracted before GST.
        </p>
      )}
      <p className="plan-indicative" style={{ marginTop: 2 }}>
        Cancel within {site.cancellationWindowDays} days of purchase for a full refund — processed to your original payment method within {site.refundWorkingDays} working days. This cancellation window applies to Cloud Telephony only.
      </p>
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button type="button" className="btn" onClick={buy}>Proceed to Purchase</button>
      </div>
      <p className="ct-cancel-note">
        Already subscribed and need to cancel? <button type="button" className="link-btn" onClick={openCancel}>Request cancellation →</button>
      </p>
    </div>
  );
}

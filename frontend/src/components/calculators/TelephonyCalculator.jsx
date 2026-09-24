import { useSite } from '../../context/SiteContext.jsx';
import { useIntField } from '../../hooks/useIntField.js';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { money } from '../../utils/format.js';
import { Stepper, TotalRow } from './Stepper.jsx';

export default function TelephonyCalculator() {
  const { telephony } = useSite().pricing;
  const { openCart } = usePurchase();
  const lic = useIntField(1, 1);
  const chan = useIntField(0, 0);
  const did = useIntField(0, 0);

  const total = lic.value * telephony.licenseRate + chan.value * telephony.channelRate + did.value * telephony.didRate;

  const buy = () =>
    openCart({
      productKey: 'cloud-telephony',
      product: 'Cloud Telephony',
      config: { lic: lic.value, chan: chan.value, did: did.value },
    });

  return (
    <div className="ct-calc">
      <div className="ct-line">
        <div>
          <div className="ct-line-label">User licenses</div>
          <div className="ct-line-sub">{money(telephony.licenseRate)} / license / month</div>
        </div>
        <Stepper field={lic} label="User licenses" />
        <div className="ct-price-tag">{money(lic.value * telephony.licenseRate)}</div>
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

      <div className="ct-audit-note" style={{ marginTop: 20 }}>
        ✓ 2% of your monthly call volume is automatically audited via Deep Customer Insights — included in every plan, no extra line item.
      </div>

      <TotalRow amount={total} />
      <p className="plan-indicative" style={{ marginTop: 8 }}>
        Have a discount code, e.g. CALLMASTER10? Apply it at checkout on the payment step — 10% off, subtracted before GST.
      </p>
      <div className="btn-row" style={{ marginTop: 10 }}>
        <button type="button" className="btn" onClick={buy}>Proceed to Purchase</button>
      </div>
    </div>
  );
}

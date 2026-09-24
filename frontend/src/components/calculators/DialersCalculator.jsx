import { useSite } from '../../context/SiteContext.jsx';
import { GoButton } from '../../hooks/useGoto.jsx';
import { useIntField } from '../../hooks/useIntField.js';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { money } from '../../utils/format.js';
import { Stepper, TotalRow } from './Stepper.jsx';

export default function DialersCalculator() {
  const { tiers } = useSite().pricing.dialers;
  const { openCart } = usePurchase();
  const qty = useIntField(1, 1);

  const tier = tiers.find((t) => qty.value >= t.min && qty.value <= t.max);
  const rate = tier ? tier.rate : null; // null → above the last tier: enterprise, not self-serve
  const total = rate === null ? 0 : qty.value * rate;
  const maxSeats = Math.max(...tiers.map((t) => t.max));

  const buy = () => {
    if (rate === null) return;
    openCart({ productKey: 'dialers', product: 'Dialers', config: { qty: qty.value } });
  };

  return (
    <div className="ct-calc" id="dialers-calc">
      <div className="ct-line">
        <div>
          <div className="ct-line-label">Number of agent seats</div>
          <div className="ct-line-sub">
            {rate === null ? `More than ${maxSeats} agents — custom pricing, talk to our team` : `${money(rate)} / agent / month at this seat count`}
          </div>
        </div>
        <Stepper field={qty} label="Number of agent seats" />
        <div className="ct-price-tag">{rate === null ? '—' : money(total)}</div>
      </div>
      <TotalRow amount={total} custom={rate === null} />
      {rate !== null && (
        <p className="plan-indicative" style={{ marginTop: 8 }}>
          Have a discount code, e.g. CALLMASTER10? Apply it at checkout on the payment step — 10% off, subtracted before GST.
        </p>
      )}
      <div className="btn-row" style={{ marginTop: 10 }}>
        {rate !== null
          ? <button type="button" className="btn" onClick={buy}>Proceed to Purchase</button>
          : <GoButton to="contact" className="btn secondary">Talk to Enterprise Sales</GoButton>}
      </div>
    </div>
  );
}

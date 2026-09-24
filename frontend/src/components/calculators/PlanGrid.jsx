import { GoButton } from '../../hooks/useGoto.jsx';
import { usePurchase } from '../purchase/PurchaseContext.jsx';
import { money } from '../../utils/format.js';

/** Plan cards for the plan-based products (Email Automation, WhatsApp). `plans` come from the pricing settings. */
export default function PlanGrid({ productKey, product, plans }) {
  const { openPlan } = usePurchase();
  return (
    <div className="plan-grid">
      {plans.map((plan) => (
        <div key={plan.key} className={`plan-card${plan.featured ? ' featured' : ''}`}>
          <div className="plan-badge">{plan.badge || plan.name}</div>
          <h3>
            {plan.contactOnly ? 'Custom' : <>{money(plan.price)} <small>{plan.unit}</small></>}
          </h3>
          <ul>{plan.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
          {plan.contactOnly ? (
            <GoButton to="contact" className="btn secondary">Talk to Enterprise Sales</GoButton>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={() => openPlan({ productKey, product, planKey: plan.key, planName: plan.name, unitPrice: plan.price, unit: plan.unit })}
            >
              Buy Now
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

import { money } from '../../utils/format.js';

/** − [n] + control bound to a useIntField() result. */
export function Stepper({ field, label }) {
  return (
    <div className="ct-stepper">
      <button type="button" aria-label={`Decrease ${label}`} onClick={field.dec}>−</button>
      <input aria-label={label} {...field.inputProps} />
      <button type="button" aria-label={`Increase ${label}`} onClick={field.inc}>+</button>
    </div>
  );
}

export function TotalRow({ amount, suffix = '/month, excl. GST', label = 'Total', custom = false }) {
  return (
    <div className="ct-total-row">
      <span>{label}</span>
      <span>
        {custom ? 'Custom' : (
          <>{money(amount)} <small style={{ fontWeight: 500, color: 'var(--ink-faint)', fontSize: 12 }}>{suffix}</small></>
        )}
      </span>
    </div>
  );
}

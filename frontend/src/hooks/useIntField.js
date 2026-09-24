import { useState } from 'react';

/**
 * Numeric stepper input that lets the user clear the field while typing but always exposes a valid
 * integer (>= min) to the calculator; the field snaps back to that value on blur.
 */
export function useIntField(initial, min = 0) {
  const [draft, setDraft] = useState(String(initial));
  const parsed = parseInt(draft, 10);
  const value = Number.isFinite(parsed) ? Math.max(min, parsed) : min;

  return {
    value,
    inputProps: {
      type: 'number',
      min,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: () => setDraft(String(value)),
    },
    inc: () => setDraft(String(value + 1)),
    dec: () => setDraft(String(Math.max(min, value - 1))),
    set: (n) => setDraft(String(Math.max(min, n))),
  };
}

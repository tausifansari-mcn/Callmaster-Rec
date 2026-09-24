import { useEffect, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSite } from '../../context/SiteContext.jsx';
import { isEmail } from '../../utils/validators.js';
import Field from '../ui/Field.jsx';

/** Standalone cancellation request — for an existing Cloud Telephony subscriber who isn't in a checkout. */
export default function CancelModal({ onClose }) {
  const { site } = useSite();
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    const next = {
      orderId: !orderId.trim() && 'Enter your order ID',
      email: !isEmail(email.trim()) && 'Enter the email registered on the order',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setApiError('');
    setBusy(true);
    try {
      setDone(await publicApi.cancelRequest({ orderId: orderId.trim(), email: email.trim() }));
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const windowDays = done?.windowDays ?? site.cancellationWindowDays;
  const refundDays = done?.refundDays ?? site.refundWorkingDays;

  return (
    <div className="pm-overlay open" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-box">
        <button type="button" className="pm-close" aria-label="Close" onClick={onClose}>&times;</button>
        {done ? (
          <>
            <div className="pm-success-icon">✓</div>
            <h2 className="pm-title">Cancellation requested</h2>
            <p className="pm-sub">
              We've received your cancellation request for order {orderId.trim() || '—'}. If it falls within the {windowDays}-day window, your refund will be processed within {refundDays} working days to your original payment method. If the details match an order, we'll confirm by email to the address registered on it.
            </p>
            <div className="btn-row" style={{ marginTop: 20 }}><button type="button" className="btn" onClick={onClose}>Done</button></div>
          </>
        ) : (
          <>
            <div className="pm-eyebrow">CLOUD TELEPHONY — CANCEL SUBSCRIPTION</div>
            <h2 className="pm-title">Request cancellation</h2>
            <p className="pm-sub">Cancellations within {windowDays} days of purchase qualify for a full refund, processed to your original payment method within {refundDays} working days.</p>
            <Field label="Order ID" error={errors.orderId}>
              <input type="text" placeholder="e.g. CM-CL-4F9K2A" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            </Field>
            <Field label="Registered email" error={errors.email}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
            </Field>
            {apiError && <div className="field-error-banner">{apiError}</div>}
            <div className="btn-row">
              <button type="button" className="btn secondary" onClick={onClose}>Close</button>
              <button type="button" className="btn" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Request cancellation'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

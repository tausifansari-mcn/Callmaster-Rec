import { useEffect, useRef, useState } from 'react';
import Field from '../ui/Field.jsx';
import OtpInput from '../wizards/OtpInput.jsx';
import { money } from '../../utils/format.js';
import { ERR, GST_RE, PHONE_RE, isOfficialEmail } from '../../utils/validators.js';

const SummaryRow = ({ children, total }) => <div className={`pm-summary-row${total ? ' total' : ''}`}>{children}</div>;

// ---------------------------------------------------------------- 1. requirement (single-plan flow only)
export function RequirementStep({ session, qty, setQty, onNext }) {
  const [draft, setDraft] = useState(String(qty));
  const commit = (v) => {
    const n = parseInt(v, 10);
    setQty(n > 0 ? n : 1);
  };
  return (
    <>
      <div className="pm-eyebrow">STEP 1 OF 3 — REQUIREMENT</div>
      <h2 className="pm-title">{session.product} — {session.planName} plan</h2>
      <p className="pm-sub">Confirm what you need, then we'll take your company details.</p>
      <Field label="Quantity">
        <div className="pm-qty-row">
          <input
            type="number"
            min="1"
            value={draft}
            onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }}
            onBlur={() => setDraft(String(qty))}
          />
          <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>× {money(session.unitPrice)}{session.unit}</span>
        </div>
      </Field>
      <div className="pm-summary">
        <SummaryRow><span>{session.product} — {session.planName}</span><span>{money(session.unitPrice)}{session.unit}</span></SummaryRow>
        <SummaryRow><span>Quantity</span><span>{qty}</span></SummaryRow>
        <SummaryRow total><span>Subtotal</span><span>{money(session.unitPrice * qty)}</span></SummaryRow>
      </div>
      <div className="btn-row"><button type="button" className="btn" onClick={onNext}>Continue</button></div>
    </>
  );
}

// ---------------------------------------------------------------- 2. company details
export function DetailsStep({ eyebrow, customer, setCustomer, requiresFile, file, setFile, onBack, onSendOtp }) {
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState(false);
  const [apiError, setApiError] = useState('');
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setCustomer((c) => ({ ...c, [k]: k === 'gstNumber' ? e.target.value.toUpperCase() : e.target.value }));

  const submit = async () => {
    const c = Object.fromEntries(Object.entries(customer).map(([k, v]) => [k, v.trim()]));
    const next = {
      company: !c.company && 'Enter your company name',
      contact: !c.contact && "Enter the contact person's name",
      gstNumber: !GST_RE.test(c.gstNumber.toUpperCase()) && 'Enter a valid 15-character GST number',
      phone: !PHONE_RE.test(c.phone) && ERR.phone,
      email: !isOfficialEmail(c.email) && ERR.officialEmail,
    };
    const missingFile = requiresFile && !file;
    setErrors(next);
    setFileError(missingFile);
    if (Object.values(next).some(Boolean) || missingFile) return;

    setCustomer({ ...c, gstNumber: c.gstNumber.toUpperCase() });
    setApiError('');
    setSending(true);
    try {
      await onSendOtp();
    } catch (err) {
      setApiError(err.message);
      setSending(false);
    }
  };

  return (
    <>
      <div className="pm-eyebrow">{eyebrow} — COMPANY DETAILS</div>
      <h2 className="pm-title">Tell us who this is for</h2>
      <p className="pm-sub">We'll send a one-time code to your Email ID to verify before checkout.</p>
      <div className="field-row2">
        <Field label="Company name" error={errors.company}><input type="text" value={customer.company} onChange={set('company')} /></Field>
        <Field label="Contact person" error={errors.contact}><input type="text" value={customer.contact} onChange={set('contact')} /></Field>
      </div>
      <div className="field-row2">
        <Field label="GST number" error={errors.gstNumber}>
          <input type="text" maxLength={15} style={{ textTransform: 'uppercase' }} value={customer.gstNumber} onChange={set('gstNumber')} />
        </Field>
        <Field label="Contact number" error={errors.phone}><input type="tel" value={customer.phone} onChange={set('phone')} /></Field>
      </div>
      <Field label="Email ID" error={errors.email}><input type="email" value={customer.email} onChange={set('email')} /></Field>

      {requiresFile && (
        <Field label="Scope of Work" error={fileError ? 'Attach a Scope of Work file before continuing' : ''}>
          <label className={`upload-box${file ? ' filled' : ''}`} htmlFor="pm-file">
            <span className="upload-icon">⬆</span>
            <input
              type="file"
              id="pm-file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx"
              onChange={(e) => { if (e.target.files.length) { setFile(e.target.files[0]); setFileError(false); } }}
            />
            <span>
              {file ? `Attached: ${file.name}` : (
                <><b>Click to upload</b> your Scope of Work document<br /><span style={{ color: 'var(--ink-faint)', fontSize: 11.5 }}>PDF, DOCX — required to proceed</span></>
              )}
            </span>
          </label>
        </Field>
      )}

      {apiError && <div className="field-error-banner">{apiError}</div>}
      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn" onClick={submit} disabled={sending}>{sending ? 'Sending…' : 'Send OTP'}</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 3. OTP
export function OtpStep({ eyebrow, email, devOtp, onResend, onBack, onVerified }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendNotice, setResendNotice] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const verify = async () => {
    if (code.length !== 4) return setError("That code doesn't match. Try again.");
    setError('');
    setBusy(true);
    try {
      await onVerified(code);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  };

  const resend = async () => {
    setCooldown(true);
    setError('');
    try {
      await onResend();
      setResendNotice(true);
    } catch (err) {
      setError(err.message);
    }
    timer.current = setTimeout(() => setCooldown(false), 5000);
  };

  return (
    <>
      <div className="pm-eyebrow">{eyebrow} — VERIFY EMAIL</div>
      <h2 className="pm-title">Enter the code sent to {email}</h2>
      {devOtp && (
        <div className="otp-hint">
          SANDBOX MODE — {resendNotice ? 'new code sent. ' : 'a real build emails this code. '}Your test code is <b>{devOtp}</b>
        </div>
      )}
      <div className="field">
        <OtpInput value={code} onChange={setCode} onEnter={verify} />
        {error && <div className="err" style={{ display: 'block' }}>{error}</div>}
        <div className="resend"><button type="button" onClick={resend} disabled={cooldown}>Resend code</button></div>
      </div>
      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn" onClick={verify} disabled={busy}>Verify</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 4. payment
export function PaymentStep({ eyebrow, session, sandbox, busy, promoCode, setPromoCode, loadQuote, onBack, onPay }) {
  const [quote, setQuote] = useState(null);
  const [appliedCode, setAppliedCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadQuote('')
      .then((q) => alive && setQuote(q))
      .catch((err) => alive && (setLoadFailed(true), setError(err.message)));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = async () => {
    const code = promoCode.trim().toUpperCase();
    setPromoError('');
    try {
      const q = await loadQuote(code);
      setQuote(q);
      setAppliedCode(q.discountCode);
      if (!code) setPromoError("That code isn't valid. Try again.");
    } catch (err) {
      const q = await loadQuote('').catch(() => null);
      if (q) setQuote(q);
      setAppliedCode('');
      setPromoError(code ? "That code isn't valid. Try again." : err.message);
    }
  };

  const pay = async () => {
    setError('');
    try {
      await onPay(appliedCode);
    } catch (err) {
      setError(err.message);
    }
  };

  if (busy) {
    return <div className="pm-processing"><div className="pm-spinner" />Connecting to Razorpay — do not close this window…</div>;
  }
  if (!quote) {
    return loadFailed
      ? <div className="field-error-banner">{error}</div>
      : <div className="pm-processing"><div className="pm-spinner" />Preparing your order…</div>;
  }

  return (
    <>
      <div className="pm-eyebrow">{eyebrow} — PAYMENT</div>
      <h2 className="pm-title">Review &amp; pay</h2>
      <p className="pm-sub">Email verified. Complete payment to activate {session.product}.</p>

      <div className="pm-summary">
        {quote.mode === 'cart' ? (
          <>
            {quote.rows.map((r) => (
              <SummaryRow key={r.label}>
                <span>{r.label}{r.sub && <span style={{ color: 'var(--ink-faint)' }}> ({r.sub})</span>}</span>
                <span>{money(r.value)}</span>
              </SummaryRow>
            ))}
            <SummaryRow><span>Subtotal{quote.billingNote ? ` — ${quote.billingNote}` : ''}</span><span>{money(quote.subtotal)}</span></SummaryRow>
          </>
        ) : (
          <>
            <SummaryRow><span>{quote.product} — {quote.plan}</span><span>{money(quote.unitPrice)}{quote.unit}</span></SummaryRow>
            <SummaryRow><span>{quote.qtyLabel}</span><span>{quote.qty}</span></SummaryRow>
            <SummaryRow><span>Subtotal</span><span>{money(quote.subtotal)}</span></SummaryRow>
          </>
        )}
        {quote.discountAmount > 0 && (
          <SummaryRow><span>Discount ({quote.discountCode})</span><span>−{money(quote.discountAmount)}</span></SummaryRow>
        )}
        <SummaryRow><span>GST ({quote.gstRate}%)</span><span>{money(quote.gst)}</span></SummaryRow>
        <SummaryRow total><span>Total payable</span><span>{money(quote.total)}</span></SummaryRow>
      </div>

      <div className="ct-promo-row" style={{ marginTop: 0 }}>
        <input type="text" placeholder="Have a discount code? Enter it here" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') apply(); }} />
        <button type="button" className="btn secondary" onClick={apply}>Apply</button>
      </div>
      {quote.discountPct > 0 && (
        <div className="ct-discount-applied">
          Code {quote.discountCode} applied — {quote.discountPct}% off ({money(quote.discountAmount)} saved).
        </div>
      )}
      {promoError && <div className="ct-discount-error" style={{ display: 'block' }}>{promoError}</div>}

      {error && <div className="field-error-banner" style={{ marginTop: 14 }}>{error}</div>}
      <button type="button" className="btn pm-pay-btn" style={{ marginTop: 16 }} onClick={pay}>
        Pay {money(quote.total)} via Razorpay
      </button>
      <div className="razorpay-mark">
        {sandbox ? 'SANDBOX MODE — simulates the Razorpay Checkout popup. No real payment is captured.' : 'Secure payment powered by Razorpay.'}
      </div>
      <div className="btn-row" style={{ marginTop: 14 }}>
        <button type="button" className="btn secondary" onClick={onBack}>Back</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 5. success
export function SuccessStep({ result, sandbox, onDone }) {
  return (
    <>
      <div className="pm-success-icon">✓</div>
      <h2 className="pm-title">Payment successful{sandbox ? ' (sandbox)' : ''}</h2>
      <p className="pm-sub">{result.product} — {result.plan} is now provisioning for {result.company}.</p>
      <div className="pm-order-id">Order ID: {result.orderId}</div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '10px 0 0' }}>
        Receipt and onboarding instructions sent to {result.email}. Our team will reach out on {result.phone} if any setup step needs you.
      </p>
      <div className="btn-row" style={{ marginTop: 20 }}><button type="button" className="btn" onClick={onDone}>Done</button></div>
    </>
  );
}

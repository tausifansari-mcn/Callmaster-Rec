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
  const [dpdp, setDpdp] = useState(false);
  const [dpdpError, setDpdpError] = useState(false);
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
    setDpdpError(!dpdp);
    if (Object.values(next).some(Boolean) || missingFile || !dpdp) return;

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
      <p className="pm-sub">Two minutes — company details, a one-time code to your email, then payment. That's the whole checkout.</p>
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

      <div className="checkbox-row" id="pm-dpdp-f">
        <input type="checkbox" id="pm-dpdp" checked={dpdp} onChange={(e) => { setDpdp(e.target.checked); if (e.target.checked) setDpdpError(false); }} />
        <label htmlFor="pm-dpdp">
          I understand CallMaster does not store or retain what I enter on this website beyond what's needed to process this order and meet legal record-keeping requirements, in line with India's Digital Personal Data Protection Act, 2023 (DPDP Act). <a href="/privacy" target="_blank" rel="noreferrer">Read the Privacy Policy</a>.
        </label>
      </div>
      {dpdpError && <div className="err" id="pm-dpdp-err" style={{ display: 'block', marginTop: -8, marginBottom: 8 }}>Please confirm you've read and understood this before continuing</div>}

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
      <div className="pm-trust-note">🔒 Secured checkout — card details go straight to Razorpay, never stored on this site.</div>
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
/** The welcome email as it was sent (shown here too, so the buyer has their login details even if the mail is slow). */
function WelcomePreview({ result, sandbox }) {
  const { account } = result;
  const isCT = Boolean(result.welcomeOffer);
  const onCancel = result.onCancel;
  return (
    <div className="pm-email-preview">
      <div className="pep-flag">
        {account.emailed
          ? `A copy of this welcome email has been sent to ${result.email}`
          : `${sandbox ? 'SANDBOX MODE — ' : ''}email delivery isn't configured on this server, so here is the welcome message we would send to ${result.email}`}
      </div>
      <div className="pep-subject">Welcome to CallMaster — your {result.product} purchase is confirmed</div>
      <div className="pep-body">
        <p>Hi {result.contact},</p>
        <p>Thanks for purchasing <b>{result.product}</b> ({result.plan}). We've received your payment of <b>{money(result.total)}</b> against Order <b>{result.orderId}</b>.</p>
        {account.created ? (
          <>
            <p><b>Your account is ready.</b> Manage billing and your subscription anytime from your <a href="/account" target="_blank" rel="noreferrer">CallMaster dashboard</a>:</p>
            <div className="pep-cred">
              Username: {account.username}<br />
              {account.tempPassword
                ? <>Temporary password: {account.tempPassword} (you'll be asked to change this on first login)</>
                : <>Temporary password: sent to your email (you'll be asked to change it on first login)</>}
            </div>
          </>
        ) : (
          <p>This order has been added to your existing CallMaster account (<b>{account.username}</b>) — sign in to your <a href="/account" target="_blank" rel="noreferrer">dashboard</a> with your current password.</p>
        )}
        {isCT && result.cancellation && (
          <>
            <p><b>Your welcome offer:</b> for your first billing month, we'll audit 2% of your call volume through Deep Customer Insights and share the results with you at no extra cost.</p>
            <p>
              <b>Cancellation &amp; refunds:</b> you can cancel within {result.cancellation.windowDays} days of this purchase for a full refund, processed to your original payment method within {result.cancellation.refundDays} working days.{' '}
              <button type="button" className="link-btn" onClick={onCancel}>Cancel this subscription</button>.
            </p>
          </>
        )}
        <p>Questions? Just reply to this email or reach the helpline from the site.</p>
      </div>
    </div>
  );
}

export function SuccessStep({ result, sandbox, accessToken, onDone }) {
  const [view, setView] = useState('summary'); // summary → confirm → cancelled
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refund, setRefund] = useState(null);

  const confirmCancel = async () => {
    setBusy(true);
    setError('');
    try {
      setRefund(await result.cancelOrder(accessToken));
      setView('cancelled');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (view === 'confirm') {
    return (
      <>
        <h2 className="pm-title">Cancel Cloud Telephony subscription?</h2>
        <p className="pm-sub">
          Order {result.orderId} — you're within the {result.cancellation.windowDays}-day cancellation window, so this qualifies for a full refund of {money(result.total)}, processed to your original payment method within {result.cancellation.refundDays} working days.
        </p>
        {error && <div className="field-error-banner">{error}</div>}
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={() => setView('summary')} disabled={busy}>Keep subscription</button>
          <button type="button" className="btn dark" onClick={confirmCancel} disabled={busy}>{busy ? 'Cancelling…' : 'Confirm cancellation'}</button>
        </div>
      </>
    );
  }
  if (view === 'cancelled') {
    return (
      <>
        <div className="pm-success-icon">✓</div>
        <h2 className="pm-title">Cancellation confirmed</h2>
        <p className="pm-sub">
          Order {result.orderId} has been cancelled. A refund of {money(refund?.refundAmount ?? result.total)} will reach your original payment method within {refund?.refundDays ?? result.cancellation.refundDays} working days. A confirmation has been sent to {result.email}.
        </p>
        <div className="btn-row" style={{ marginTop: 20 }}><button type="button" className="btn" onClick={onDone}>Done</button></div>
      </>
    );
  }
  return (
    <>
      <div className="pm-success-icon">✓</div>
      <h2 className="pm-title">Payment successful{sandbox ? ' (sandbox)' : ''}</h2>
      <p className="pm-sub">{result.product} — {result.plan} is now provisioning for {result.company}.</p>
      <div className="pm-order-id">Order ID: {result.orderId}</div>
      <WelcomePreview result={{ ...result, onCancel: () => setView('confirm') }} sandbox={sandbox} />
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '12px 0 0' }}>
        Our team will reach out on {result.phone} if any setup step needs you.
      </p>
      <div className="btn-row" style={{ marginTop: 20 }}><button type="button" className="btn" onClick={onDone}>Done</button></div>
    </>
  );
}

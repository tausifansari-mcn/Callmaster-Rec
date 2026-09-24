import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { GoButton } from '../../hooks/useGoto.jsx';
import { safeGet, safeRemove, safeSet } from '../../utils/storage.js';
import { LANGUAGES, cancelSpeech, playLanguagePreview, speechReady } from '../../utils/speech.js';
import { ERR, PHONE_RE, isEmail } from '../../utils/validators.js';
import Field from '../ui/Field.jsx';
import StepDots from '../ui/StepDots.jsx';
import OtpInput from './OtpInput.jsx';

const TOTAL = 8;
const INDUSTRIES = ['Personal Care', 'FMCG', 'Automobiles', 'Financial Services', 'E-commerce'];
const CALL_TYPES = ['Inbound', 'Outbound', 'Collections', 'Abandoned Cart Recovery', 'Renewals/Retention'];
const USED_NUMBER_KEY = 'callmaster_used_number';
const EMPTY = { industry: '', callType: '', gender: '', language: null, name: '', company: '', email: '', phone: '' };

const Label = ({ n, suffix }) => <div className="step-label">STEP {n} OF {TOTAL}{suffix ? ` — ${suffix}` : ''}</div>;

function ChoiceGrid({ options, value, onPick }) {
  return (
    <div className="choice-grid">
      {options.map((o) => (
        <div key={o} className={`choice${value === o ? ' selected' : ''}`} role="button" tabIndex={0}
          onClick={() => onPick(o)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(o); } }}>
          {o}
        </div>
      ))}
    </div>
  );
}

function CallPanel({ state, data, onReset }) {
  if (state.kind === 'placeholder') return <div className="placeholder-state">Verify your number to configure and place a demo call.</div>;
  if (state.kind === 'dialing') {
    return (
      <>
        <div className="call-status"><span className="status-dot pulse" /><span>Dialing {data.phone}…</span></div>
        <div className="waveform">
          {Array.from({ length: 20 }, (_, i) => <div key={i} className="bar" style={{ animationDelay: `${i * 0.06}s` }} />)}
        </div>
      </>
    );
  }
  return (
    <>
      <div className="call-status"><span className="status-dot" /><span>Call connected — 0:38</span></div>
      <details className="transcript" open>
        <summary>What the bot said</summary>
        <div className="transcript-body">
          <div><span className="who">Bot:</span> Hi, this is CallMaster's {data.industry} {data.callType} assistant calling — this is a short demo, is now an okay time?</div><br />
          <div><span className="who">You (simulated):</span> Sure, go ahead.</div><br />
          <div style={{ opacity: 0.6 }}>[sandbox transcript — mock content for layout testing only]</div>
        </div>
      </details>
      <div className="btn-row">
        <GoButton to="voice" anchor="voice-pricing" className="btn secondary">See pricing</GoButton>
        <GoButton to="contact" className="btn">Talk to sales</GoButton>
      </div>
      <div className="sandbox-note">{data.company} · {data.email} · one trial per number is now enforced for {data.phone}</div>
      <div className="btn-row" style={{ marginTop: 14 }}><button type="button" className="btn secondary" onClick={onReset}>Reset sandbox</button></div>
    </>
  );
}

export default function VoiceWizard() {
  const [step, setStep] = useState(1);
  const [d, setD] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState(false);
  const [code, setCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendLocked, setResendLocked] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [consent, setConsent] = useState(false);
  const [panel, setPanel] = useState({ kind: 'placeholder' });
  const [demo, setDemo] = useState(null); // { id, accessToken } — the visitor saved at step 5
  const usedNumber = safeGet(USED_NUMBER_KEY);
  const timers = useRef([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); cancelSpeech(); }, []);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  const set = (k) => (e) => setD((s) => ({ ...s, [k]: e.target.value }));
  const go = (n) => { setApiError(''); setStep(n); };

  const pickLanguage = (lang) => {
    setD((s) => ({ ...s, language: lang }));
    playLanguagePreview(lang, d.gender);
  };

  const leaveLanguageStep = (n) => { cancelSpeech(); go(n); };

  /** Step 5: validate, then SAVE the visitor and the bot they configured right away. */
  const next5 = async () => {
    const name = d.name.trim(); const company = d.company.trim(); const email = d.email.trim();
    const e = { name: !name && ERR.name, company: !company && ERR.org, email: !isEmail(email) && ERR.email };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setApiError('');
    setBusy(true);
    try {
      const saved = await publicApi.voiceRegister({
        industry: d.industry, callType: d.callType, gender: d.gender, language: d.language.label, name, company, email, ...(demo || {}),
      });
      setDemo({ id: saved.id, accessToken: saved.accessToken });
      setD((s2) => ({ ...s2, name, company, email }));
      go(6);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const next6 = async () => {
    const phone = d.phone.trim();
    if (!PHONE_RE.test(phone)) return setErrors({ phone: ERR.phone });
    if (safeGet(USED_NUMBER_KEY) === phone) return setErrors({ phone: 'This number has already used its one-time trial.' });
    setErrors({});
    setApiError('');
    setBusy(true);
    try {
      const r = await publicApi.sendOtp({ purpose: 'voice-demo', phone });
      setD((s) => ({ ...s, phone }));
      setDevOtp(r.devOtp || '');
      setOtpNotice(false);
      setCode('');
      setOtpError('');
      setStep(7);
    } catch (err) {
      setErrors({ phone: err.message });
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const resend = async () => {
    setResendLocked(true);
    setOtpError('');
    try {
      const r = await publicApi.sendOtp({ purpose: 'voice-demo', phone: d.phone });
      setDevOtp(r.devOtp || '');
      setOtpNotice(true);
    } catch (err) {
      setOtpError(err.message);
    }
    later(() => setResendLocked(false), 5000);
  };

  const verify = async () => {
    if (code.length !== 4) return setOtpError("That code doesn't match. Try again.");
    setOtpError('');
    setBusy(true);
    try {
      const r = await publicApi.verifyOtp({ purpose: 'voice-demo', target: d.phone, code });
      setVerifyToken(r.verifyToken);
      safeSet(USED_NUMBER_KEY, d.phone);
      go(8);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const call = async () => {
    setApiError('');
    setBusy(true);
    try {
      await publicApi.voiceDemo({
        industry: d.industry, callType: d.callType, gender: d.gender, language: d.language.label,
        name: d.name, company: d.company, email: d.email, phone: d.phone, consent, verifyToken,
        ...(demo ? { demoId: demo.id, demoToken: demo.accessToken } : {}),
      });
      setPanel({ kind: 'dialing' });
      later(() => setPanel({ kind: 'connected' }), 2200);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    safeRemove(USED_NUMBER_KEY);
    timers.current.forEach(clearTimeout);
    setD(EMPTY); setErrors({}); setApiError(''); setCode(''); setVerifyToken(''); setConsent(false); setDevOtp(''); setDemo(null);
    setPanel({ kind: 'placeholder' });
    setStep(1);
  };

  return (
    <div className="split">
      <div className="left">
        <StepDots total={TOTAL} current={step} />
        <div>
          {step === 1 && (
            <>
              <Label n={1} suffix="INDUSTRY" />
              <ChoiceGrid options={INDUSTRIES} value={d.industry} onPick={(v) => setD((s) => ({ ...s, industry: v }))} />
              <div className="btn-row" style={{ marginTop: 18 }}>
                <button type="button" className="btn" disabled={!d.industry} onClick={() => go(2)}>Continue</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Label n={2} suffix="TYPE OF CALLS" />
              <ChoiceGrid options={CALL_TYPES} value={d.callType} onPick={(v) => setD((s) => ({ ...s, callType: v }))} />
              <div className="btn-row" style={{ marginTop: 18 }}>
                <button type="button" className="btn secondary" onClick={() => go(1)}>Back</button>
                <button type="button" className="btn" disabled={!d.callType} onClick={() => go(3)}>Continue</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Label n={3} suffix="MALE OR FEMALE" />
              <ChoiceGrid options={['Male', 'Female']} value={d.gender} onPick={(v) => setD((s) => ({ ...s, gender: v }))} />
              <div className="btn-row" style={{ marginTop: 18 }}>
                <button type="button" className="btn secondary" onClick={() => go(2)}>Back</button>
                <button type="button" className="btn" disabled={!d.gender} onClick={() => go(4)}>Continue</button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <Label n={4} suffix="LANGUAGE" />
              <div className="voice-preview-note">
                {speechReady
                  ? 'Tap a language to hear a sample in that accent — this is browser text-to-speech standing in for the real prerecorded script.'
                  : "Voice preview isn't supported in this browser."}
              </div>
              <div className="lang-grid">
                {LANGUAGES.map((l) => (
                  <div key={l.label} className={`lang-chip${d.language === l ? ' selected' : ''}`} role="button" tabIndex={0}
                    onClick={() => pickLanguage(l)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickLanguage(l); } }}>
                    <span>{l.label}</span><span className="play-icon">▶</span>
                  </div>
                ))}
              </div>
              <div className="btn-row" style={{ marginTop: 18 }}>
                <button type="button" className="btn secondary" onClick={() => leaveLanguageStep(3)}>Back</button>
                <button type="button" className="btn" disabled={!d.language} onClick={() => leaveLanguageStep(5)}>Continue</button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="config-summary">
                Your bot: <b>{d.language.label}</b>, <b>{d.gender}</b> voice, <b>{d.callType}</b> · <b>{d.industry}</b>.{' '}
                <a href="#" style={{ color: 'var(--accent-live)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); go(4); }}>Change</a>
              </div>
              <Label n={5} />
              <Field label="Name" error={errors.name}><input type="text" value={d.name} onChange={set('name')} /></Field>
              <Field label="Organization" error={errors.company}><input type="text" value={d.company} onChange={set('company')} /></Field>
              <Field label="Email" error={errors.email}><input type="email" value={d.email} onChange={set('email')} /></Field>
              {apiError && <div className="field-error-banner">{apiError}</div>}
              <div className="btn-row">
                <button type="button" className="btn secondary" onClick={() => go(4)}>Back</button>
                <button type="button" className="btn" onClick={next5} disabled={busy}>{busy ? 'Saving…' : 'Continue'}</button>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <Label n={6} />
              <Field label="Mobile number" error={errors.phone}>
                <input type="tel" placeholder="10-digit mobile number" value={d.phone} onChange={set('phone')} />
              </Field>
              {usedNumber && (
                <div className="otp-hint" style={{ color: 'var(--accent-alert)', borderColor: 'rgba(255,110,94,0.35)', background: 'rgba(255,110,94,0.08)' }}>
                  This browser already used a number (ending {usedNumber.slice(-4)}). One trial per number is enforced — reset to test again.
                </div>
              )}
              <div className="btn-row">
                <button type="button" className="btn secondary" onClick={() => go(5)}>Back</button>
                <button type="button" className="btn" onClick={next6} disabled={busy}>{busy ? 'Sending…' : 'Generate OTP'}</button>
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <Label n={7} />
              {devOtp && (
                <div className="otp-hint">
                  SANDBOX MODE — {otpNotice ? 'new code sent. ' : 'real builds send this via SMS. '}Your test code is <b>{devOtp}</b>
                </div>
              )}
              <div className="field">
                <label>Enter the 4-digit code</label>
                <OtpInput value={code} onChange={setCode} onEnter={verify} />
                {otpError && <div className="err" style={{ display: 'block' }}>{otpError}</div>}
                <div className="resend"><button type="button" onClick={resend} disabled={resendLocked}>Resend code</button></div>
              </div>
              <div className="btn-row">
                <button type="button" className="btn secondary" onClick={() => go(6)}>Back</button>
                <button type="button" className="btn" onClick={verify} disabled={busy}>Verify</button>
              </div>
            </>
          )}

          {step === 8 && (
            <>
              <Label n={8} />
              <div className="config-summary">
                Calling <b>{d.phone}</b> — a <b>{d.callType}</b> bot for <b>{d.industry}</b>, in <b>{d.language.label}</b>, <b>{d.gender}</b> voice.
              </div>
              <div className="checkbox-row">
                <input type="checkbox" id="v-consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <label htmlFor="v-consent">This is my own number. I've read the Privacy Policy and consent to receive this demo call.</label>
              </div>
              {apiError && <div className="field-error-banner">{apiError}</div>}
              <div className="btn-row">
                <button type="button" className="btn secondary" onClick={() => go(7)}>Back</button>
                <button type="button" className="btn" disabled={!consent || busy || panel.kind !== 'placeholder'} onClick={call}>Call me now</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="right">
        <CallPanel state={panel} data={d} onReset={reset} />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { GoLink } from '../../hooks/useGoto.jsx';
import { safeGet, safeSet } from '../../utils/storage.js';
import { LANGUAGES, cancelSpeech, playLanguagePreview } from '../../utils/speech.js';
import { PHONE_RE, isEmail } from '../../utils/validators.js';
import { StepsTrack } from './InsightsWizard.jsx';

/**
 * Voice Bots sandbox. Markup and step order follow the theme's template-voice-bots.php
 * (details → verify → consent → configure → call); the data flow is this app's: SMS OTP to the
 * number the bot will call, then the bot configuration is saved and the demo call requested.
 */
const TOTAL = 5;
// Option values are the ones the backend accepts (validators/publicSchemas.js).
const INDUSTRIES = ['Personal Care', 'FMCG', 'Automobiles', 'Financial Services', 'E-commerce'];
const CALL_TYPES = ['Inbound', 'Outbound', 'Collections', 'Abandoned Cart Recovery', 'Renewals/Retention'];
const BASE_LANGUAGES = ['English', 'Hindi', 'Hinglish'];
const AVATARS = [
  { id: 'aditi', name: 'Aditi', gender: 'Female', accent: 'Indian English' },
  { id: 'arjun', name: 'Arjun', gender: 'Male', accent: 'Indian English' },
  { id: 'emma', name: 'Emma', gender: 'Female', accent: 'British' },
  { id: 'james', name: 'James', gender: 'Male', accent: 'British' },
  { id: 'sophia', name: 'Sophia', gender: 'Female', accent: 'American' },
  { id: 'michael', name: 'Michael', gender: 'Male', accent: 'American' },
];
const USED_NUMBER_KEY = 'callmaster_used_number';
const EMPTY = { name: '', email: '', company: '', phone: '', industry: '', callType: '', language: '', avatar: '', script: '', consent: false };

/** The backend's language value: English plus a British / American avatar means that accent. */
function languageFor(language, avatar) {
  if (language !== 'English' || !avatar) return language;
  if (avatar.accent === 'British') return 'British English';
  if (avatar.accent === 'American') return 'American English';
  return 'English';
}
const previewFor = (label) => LANGUAGES.find((l) => l.label === label) || LANGUAGES[0];

function ErrorText({ children, style }) {
  return <div className="error-text" style={{ display: children ? 'block' : 'none', ...style }} role="alert">{children}</div>;
}

export default function VoiceWizard() {
  const [step, setStep] = useState(1);
  const [d, setD] = useState(EMPTY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [code, setCode] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [playing, setPlaying] = useState('');
  const [call, setCall] = useState({ stage: 'processing', message: '', failed: false });
  const timers = useRef([]);
  const demo = useRef(null); // { id, accessToken } — reused if the visitor retries, so one record per visitor

  useEffect(() => () => { timers.current.forEach(clearTimeout); cancelSpeech(); }, []);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  const set = (k) => (e) => setD((s) => ({ ...s, [k]: e.target.value }));
  const go = (n) => { setError(''); setNotice(''); setStep(n); };
  const avatar = AVATARS.find((a) => a.id === d.avatar);

  const next1 = async () => {
    const name = d.name.trim(); const email = d.email.trim(); const company = d.company.trim(); const phone = d.phone.trim();
    if (!name || !isEmail(email) || !company || !PHONE_RE.test(phone)) return setError('Enter your name, email, organization and mobile number to continue.');
    if (safeGet(USED_NUMBER_KEY) === phone) { setError(''); return setBlocked(true); }
    setBlocked(false);
    setError('');
    setBusy(true);
    try {
      const r = await publicApi.sendOtp({ purpose: 'voice-demo', phone });
      setD((s) => ({ ...s, name, email, company, phone }));
      setDevOtp(r.devOtp || '');
      setCode('');
      go(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const resend = async () => {
    setError('');
    try {
      const r = await publicApi.sendOtp({ purpose: 'voice-demo', phone: d.phone });
      setDevOtp(r.devOtp || '');
      setNotice('A new code has been sent.');
    } catch (err) {
      setNotice('');
      setError(err.message);
    }
  };

  const verify = async () => {
    if (!/^\d{4}$/.test(code.trim())) return setError('Enter the 4-digit code from the SMS.');
    setError('');
    setBusy(true);
    try {
      const r = await publicApi.verifyOtp({ purpose: 'voice-demo', target: d.phone, code: code.trim() });
      setVerifyToken(r.verifyToken);
      safeSet(USED_NUMBER_KEY, d.phone);
      go(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const next3 = () => (d.consent ? go(4) : setError('Consent is required before we can place the call.'));

  const playSample = (a) => {
    setPlaying(a.id);
    playLanguagePreview(previewFor(languageFor(d.language || 'English', a)), a.gender, () => setPlaying((p) => (p === a.id ? '' : p)));
  };

  const generate = async () => {
    if (!d.industry || !d.callType || !d.language || !avatar) return setError('Choose industry, activity, language and a voice avatar.');
    cancelSpeech();
    setPlaying('');
    go(5);
    setCall({ stage: 'processing', message: '', failed: false });
    later(() => setCall((c) => (c.stage === 'processing' ? { ...c, stage: 'anim' } : c)), 700);
    const config = { industry: d.industry, callType: d.callType, gender: avatar.gender, language: languageFor(d.language, avatar), name: d.name, company: d.company, email: d.email };
    try {
      const saved = await publicApi.voiceRegister({ ...config, ...(demo.current || {}) });
      demo.current = { id: saved.id, accessToken: saved.accessToken };
      await publicApi.voiceDemo({ ...config, phone: d.phone, consent: d.consent, verifyToken, script: d.script.trim(), demoId: saved.id, demoToken: saved.accessToken });
      later(() => setCall({ stage: 'done', failed: false, message: `Your call is on its way. ${avatar.name} will call ${d.phone} shortly with your ${d.callType.toLowerCase()} demo for ${d.industry}.` }), 1600);
    } catch (err) {
      setCall({ stage: 'done', failed: true, message: err.message || 'Something went wrong — please try again.' });
    }
    return undefined;
  };

  return (
    <>
      <StepsTrack total={TOTAL} current={step} />

      {blocked && (
        <div className="blocked-state">
          This number has already used its one-time Voice Bot trial. <GoLink to="contact" style={{ color: 'var(--danger)', textDecoration: 'underline' }}>Contact sales</GoLink> for a full account.
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 1 && (
          <div className="step-panel active" data-step="1">
            <div className="grid2">
              <div className="field"><label htmlFor="vb_name">Full name</label><input type="text" id="vb_name" placeholder="Rohan Verma" value={d.name} onChange={set('name')} /></div>
              <div className="field"><label htmlFor="vb_email">Work email</label><input type="email" id="vb_email" placeholder="rohan@company.com" value={d.email} onChange={set('email')} /></div>
            </div>
            <div className="grid2">
              <div className="field"><label htmlFor="vb_company">Organization</label><input type="text" id="vb_company" placeholder="Company name" autoComplete="organization" value={d.company} onChange={set('company')} /></div>
              <div className="field"><label htmlFor="vb_phone">Phone number the bot will call</label><input type="tel" id="vb_phone" placeholder="98XXXXXXXX" inputMode="tel" autoComplete="tel-national" value={d.phone} onChange={(e) => { setBlocked(false); set('phone')(e); }} /></div>
            </div>
            <ErrorText>{error}</ErrorText>
            <div className="step-actions"><span /><button type="button" className="btn btn-primary" onClick={next1} disabled={busy}>{busy ? 'Sending…' : 'Send OTP'}</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="step-panel active" data-step="2">
            <p style={{ fontSize: 14 }}>We sent a 4-digit code by SMS to <span className="mono">{d.phone}</span>. It is valid for 10 minutes.</p>
            {devOtp && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Sandbox mode: SMS delivery isn&apos;t set up on this server. Your test code is <b className="mono">{devOtp}</b>.</p>}
            <div className="field" style={{ maxWidth: 180 }}>
              <input
                type="text" maxLength={4} id="vb_otp" aria-label="4-digit verification code" placeholder="1234" inputMode="numeric" autoComplete="one-time-code"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
              />
            </div>
            <ErrorText style={notice && !error ? { color: 'var(--teal-dark)' } : undefined}>{error || notice}</ErrorText>
            <div className="step-actions">
              <button type="button" className="btn btn-outline" onClick={() => go(1)}>Back</button>
              <button type="button" className="btn btn-outline" onClick={resend}>Resend code</button>
              <button type="button" className="btn btn-primary" onClick={verify} disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-panel active" data-step="3">
            <div className="consent-box">
              <h4>Before we call you</h4>
              <ul>
                <li>We collect your name, email, organization, verified phone number, and the script you upload.</li>
                <li>A single call is placed to the number above using this script, for demo purposes only.</li>
                <li>Call recording retention window: to be confirmed before launch — see the <GoLink to="data-retention">Data Retention Policy</GoLink>.</li>
              </ul>
              <label className="consent-check"><input type="checkbox" checked={d.consent} onChange={(e) => setD((s) => ({ ...s, consent: e.target.checked }))} /> I consent to Nimantran placing this call and processing this data as described above.</label>
            </div>
            <ErrorText>{error}</ErrorText>
            <div className="step-actions"><button type="button" className="btn btn-outline" onClick={() => go(2)}>Back</button><button type="button" className="btn btn-primary" onClick={next3}>Continue</button></div>
          </div>
        )}

        {step === 4 && (
          <div className="step-panel active" data-step="4">
            <div className="grid2">
              <div className="field"><label htmlFor="vb_industry">Industry</label><select id="vb_industry" value={d.industry} onChange={set('industry')}><option value="">Choose one</option>{INDUSTRIES.map((o) => <option key={o}>{o}</option>)}</select></div>
              <div className="field"><label htmlFor="vb_activity">Activity type</label><select id="vb_activity" value={d.callType} onChange={set('callType')}><option value="">Choose one</option>{CALL_TYPES.map((o) => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div className="field"><label htmlFor="vb_lang">Language</label><select id="vb_lang" value={d.language} onChange={set('language')}><option value="">Choose one</option>{BASE_LANGUAGES.map((o) => <option key={o}>{o}</option>)}</select></div>
            <div className="field">
              <span className="field-label">Voice avatar — play a sample to hear each one</span>
              <div className="avatar-grid">
                {AVATARS.map((a) => (
                  <div key={a.id} className={`avatar-card${d.avatar === a.id ? ' selected' : ''}`} onClick={() => setD((s) => ({ ...s, avatar: a.id }))}>
                    <div className="avatar-circle">{a.name.slice(0, 1)}</div>
                    <div className="avatar-name">{a.name}</div>
                    <div className="avatar-tags"><span className="avatar-tag">{a.gender}</span><span className="avatar-tag">{a.accent}</span></div>
                    <button type="button" className={`play-btn${playing === a.id ? ' playing' : ''}`} onClick={(e) => { e.stopPropagation(); playSample(a); }}>
                      {playing === a.id ? 'Playing…' : 'Play sample'}
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Samples use your browser&apos;s built-in voices for this demo — the live product uses studio-quality TTS matched to each avatar.</p>
            </div>
            <div className="field"><label htmlFor="vb_script">Script</label><textarea id="vb_script" rows={3} placeholder="Paste your call script, or upload a file below" value={d.script} onChange={set('script')} /></div>
            <ErrorText>{error}</ErrorText>
            <div className="step-actions"><button type="button" className="btn btn-outline" onClick={() => go(3)}>Back</button><button type="button" className="btn btn-primary" onClick={generate}>Generate call</button></div>
          </div>
        )}

        {step === 5 && (
          <div className="step-panel active" data-step="5">
            {call.stage === 'processing' && <div className="processing" style={{ display: 'flex' }}><div className="spinner" /> Placing your call to <span className="mono" style={{ marginLeft: 4 }}>{d.phone}</span>…</div>}
            {call.stage === 'anim' && (
              <div className="call-anim" style={{ display: 'flex' }}>
                {[0, 0.1, 0.2, 0.3, 0.15, 0.05].map((delay, i) => <span key={i} style={{ animationDelay: `${delay}s` }} />)}
              </div>
            )}
            {call.stage === 'done' && (
              <div>
                <div
                  className="blocked-state"
                  style={call.failed
                    ? { background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }
                    : { background: 'var(--teal-bg)', borderColor: 'var(--teal)', color: 'var(--teal-dark)' }}
                >
                  {call.message}
                </div>
                {!call.failed && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ marginTop: 8 }}>
                      <span className="tier-label tier-minute">Per-minute</span>
                      <p style={{ fontSize: 13.5 }}>Full rate card on the <GoLink to="pricing" style={{ color: 'var(--teal-dark)', textDecoration: 'underline' }}>Pricing page</GoLink>.</p>
                    </div>
                  </div>
                )}
                {call.failed && <div className="step-actions"><button type="button" className="btn btn-outline" onClick={() => go(4)}>Back</button></div>}
              </div>
            )}
          </div>
        )}
      </form>
    </>
  );
}

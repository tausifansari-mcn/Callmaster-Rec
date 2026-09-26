import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSite } from '../../context/SiteContext.jsx';
import { sleep } from '../../utils/format.js';
import { ERR, isEmail } from '../../utils/validators.js';
import AuditReport from '../audit/AuditReport.jsx';
import Field from '../ui/Field.jsx';
import StepDots from '../ui/StepDots.jsx';
import OtpInput from './OtpInput.jsx';

const FRAMEWORK_BY_LOB = {
  'Inbound Support': 'CLAP',
  'Outbound Sales': 'MAGIC Script — CRT / CST',
  Collections: 'RESO',
  Retention: 'MAGIC Script — CRT / CST',
};
const LOBS = Object.keys(FRAMEWORK_BY_LOB);
const EMPTY = { name: '', company: '', email: '', file: null, lob: '', rights: false };
const POLL_MS = 2500;
const MAX_WAIT_MS = 6 * 60 * 1000;
const MESSAGE_MS = 3200;

/** What the processing panel says. Which set is shown follows the real stage reported by the server. */
const stageMessages = (stage, framework) => (stage === 'auditing'
  ? [`Scoring against ${framework}…`, 'Checking compliance…', 'Flagging improvement areas…', 'Writing your coaching plan…']
  : ['Uploading your call…', 'Transcribing your call…', 'Identifying speakers…']);

const Placeholder = () => (
  <div className="placeholder-state">
    <div className="placeholder-illo" aria-hidden="true">
      <div className="ring" />
      <div className="hub"><span className="b" /><span className="b" /><span className="b" /><span className="b" /><span className="b" /></div>
    </div>
    <div className="placeholder-skel" aria-hidden="true">
      <div className="sk-line w100" /><div className="sk-line w85" /><div className="sk-line w70" /><div className="sk-line w50" />
    </div>
    Your transcript, score, and improvement areas will build here once you upload a call.
  </div>
);

/** Compact result shown beside the wizard; the full report renders below it. */
const mmss = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`;

function Summary({ results, transcript }) {
  return (
    <div className="ar-summary-mini">
      <div className="fw-applied-wrap"><span className="fw-applied">{results.framework}</span></div>
      <div className="score-hero">
        <div className={`score-num score-${results.band}`}>{results.score}</div>
        <div className="score-band">{results.bandLabel} · quality score out of 100</div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '4px 0 0' }}>{results.summary}</p>
      {transcript?.turns?.length > 0 && (
        <details className="transcript" open style={{ marginTop: 16 }}>
          <summary>
            View full transcript
            <span style={{ fontWeight: 400, color: 'var(--ink-faint)', fontSize: 11.5 }}> · {results.mock ? 'sample only' : 'speech-to-text by Deepgram'}</span>
          </summary>
          <div className="transcript-body" style={{ maxHeight: 340 }}>
            {transcript.turns.map((t, i) => (
              <div key={i}>
                <span className="who">{t.role === 'agent' ? 'Agent' : t.role === 'customer' ? 'Customer' : `Speaker ${t.speaker}`}</span>
                <span style={{ color: 'var(--ink-faint)' }}> [{mmss(t.start)}]</span>: {t.text}
                <br /><br />
              </div>
            ))}
            {results.mock && <div style={{ opacity: 0.6 }}>[sample transcript — the Deepgram key is not configured on the server]</div>}
          </div>
        </details>
      )}
      <a className="btn secondary" href="#audit-report" onClick={(e) => { e.preventDefault(); document.getElementById('audit-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>View the full audit report ↓</a>
    </div>
  );
}

export default function InsightsWizard() {
  const { limits } = useSite();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [right, setRight] = useState({ kind: 'placeholder' });
  const [report, setReport] = useState(null); // { results, transcript, submitter }
  const [session, setSession] = useState(null); // { id, accessToken } — the visitor saved at step 1
  const [busy, setBusy] = useState(false);
  // Email verification (step 1): the visitor must enter the code we send to their inbox before anything is saved.
  const [otp, setOtp] = useState({ stage: 'details', code: '', devOtp: '', error: '', resent: false });
  const [verified, setVerified] = useState({ email: '', token: '' });
  const alive = useRef(true);
  const messageTimer = useRef();
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearInterval(messageTimer.current); };
  }, []);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  /** Step 1: validate, then SAVE the visitor right away (name / organization / email) before moving on. */
  const next1 = async () => {
    const name = data.name.trim();
    const company = data.company.trim();
    const email = data.email.trim();
    const e = { name: !name && ERR.name, company: !company && ERR.org, email: !isEmail(email) && ERR.email };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    setApiError('');
    setBusy(true);
    try {
      setData((d) => ({ ...d, name, company, email }));
      // Already proved this address a moment ago (e.g. they pressed Back and Continue again): no second code needed.
      if (verified.token && verified.email === email.toLowerCase()) {
        await saveVisitor({ name, company, email }, verified.token);
        return;
      }
      const sent = await publicApi.sendOtp({ purpose: 'audit-demo', email: email.toLowerCase() });
      setOtp({ stage: 'code', code: '', devOtp: sent.devOtp || '', error: '', resent: false });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /** Saves name / organization / email (the row appears in the admin panel) and moves to the upload step. */
  const saveVisitor = async ({ name, company, email }, verifyToken) => {
    const saved = await publicApi.auditRegister({ name, company, email, verifyToken, ...(session || {}) });
    setSession({ id: saved.id, accessToken: saved.accessToken });
    setOtp({ stage: 'details', code: '', devOtp: '', error: '', resent: false });
    setStep(2);
  };

  const verifyCode = async () => {
    if (otp.code.length !== 4) return setOtp((o) => ({ ...o, error: "That code doesn't match. Try again." }));
    setOtp((o) => ({ ...o, error: '' }));
    setBusy(true);
    try {
      const email = data.email.toLowerCase();
      const r = await publicApi.verifyOtp({ purpose: 'audit-demo', target: email, code: otp.code });
      setVerified({ email, token: r.verifyToken });
      await saveVisitor(data, r.verifyToken);
    } catch (err) {
      // clear the boxes (and put the cursor back in the first one) so the visitor can simply retype
      setOtp((o) => ({ ...o, code: '', attempt: (o.attempt || 0) + 1, error: err.message }));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const resendCode = async () => {
    setOtp((o) => ({ ...o, error: '' }));
    try {
      const sent = await publicApi.sendOtp({ purpose: 'audit-demo', email: data.email.toLowerCase() });
      setOtp((o) => ({ ...o, code: '', devOtp: sent.devOtp || '', resent: true }));
    } catch (err) {
      setOtp((o) => ({ ...o, error: err.message }));
    }
  };

  /** Cycles the friendly progress lines for the current stage while we wait on the server. */
  const showProgress = (stage, framework) => {
    clearInterval(messageTimer.current);
    const lines = stageMessages(stage, framework);
    let i = 0;
    setRight({ kind: 'processing', message: lines[0], framework });
    messageTimer.current = setInterval(() => {
      i = Math.min(i + 1, lines.length - 1);
      setRight({ kind: 'processing', message: lines[i], framework });
    }, MESSAGE_MS);
  };

  const finish = (results, transcript, snapshot) => {
    clearInterval(messageTimer.current);
    setRight({ kind: 'results', results, transcript });
    setReport({ results, transcript, submitter: snapshot });
    setStep(4);
    setTimeout(() => document.getElementById('audit-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
  };

  const fail = (message) => {
    clearInterval(messageTimer.current);
    setApiError(message);
    setRight({ kind: 'placeholder' });
    setStep(2);
  };

  const run = async () => {
    setApiError('');
    setReport(null);
    setStep(3);
    const framework = FRAMEWORK_BY_LOB[data.lob] || 'CLAP';
    const snapshot = { ...data };
    showProgress('transcribing', framework);

    const form = new FormData();
    form.append('file', data.file);
    form.append('accessToken', session.accessToken);
    form.append('lob', data.lob);
    form.append('rights', String(data.rights));

    try {
      const started = await publicApi.auditSubmit(session.id, form);
      if (!alive.current) return;
      if (started.status === 'completed') { // sandbox mode: no API keys on the server, result is immediate
        await sleep(1500);
        if (alive.current) finish(started.results, started.transcript, snapshot);
        return;
      }

      // Live audit: poll until the background job finishes (transcribing → auditing → completed).
      const deadline = Date.now() + MAX_WAIT_MS;
      let stage = 'transcribing';
      while (alive.current && Date.now() < deadline) {
        await sleep(POLL_MS);
        if (!alive.current) return;
        const s = await publicApi.auditStatus(session.id, session.accessToken);
        if (s.status === 'completed') { finish(s.results, s.transcript, snapshot); return; }
        if (s.status === 'failed') { fail(s.error); return; }
        if (s.stage && s.stage !== stage) { stage = s.stage; showProgress(stage, framework); }
      }
      if (alive.current) fail('This is taking longer than expected. Please try again in a few minutes.');
    } catch (err) {
      if (alive.current) fail(err.message);
    }
  };

  const reset = () => {
    clearInterval(messageTimer.current);
    setData(EMPTY);
    setErrors({});
    setApiError('');
    setRight({ kind: 'placeholder' });
    setReport(null);
    setSession(null); // the next audit starts a fresh record
    setOtp({ stage: 'details', code: '', devOtp: '', error: '', resent: false });
    setStep(1);
  };

  const canSubmit = data.file && data.lob && data.rights;

  return (
    <>
      <div className="split">
        <div className="left">
          <StepDots total={4} current={step} />
          <div>
            {step === 1 && otp.stage === 'code' && (
              <>
                <div className="step-label">STEP 1 OF 4 — VERIFY YOUR EMAIL</div>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 10px' }}>We sent a 4-digit code to <b style={{ color: 'var(--ink)' }}>{data.email}</b>. Enter it to continue — this makes sure the report and recording stay with the person who owns this address.</p>
                {otp.devOtp && (
                  <div className="otp-hint">
                    SANDBOX MODE — email delivery isn't set up on this server, so the code is shown here. Your test code is <b>{otp.devOtp}</b>
                  </div>
                )}
                <div className="field">
                  <OtpInput key={otp.attempt || 0} value={otp.code} onChange={(code) => setOtp((o) => ({ ...o, code }))} onEnter={verifyCode} />
                  {otp.error && <div className="err" style={{ display: 'block' }}>{otp.error}</div>}
                  {otp.resent && !otp.error && <div className="hint">A new code has been sent.</div>}
                  <div className="resend"><button type="button" onClick={resendCode}>Resend code</button></div>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn secondary" onClick={() => setOtp({ stage: 'details', code: '', devOtp: '', error: '', resent: false })}>Back</button>
                  <button type="button" className="btn" onClick={verifyCode} disabled={busy}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
                </div>
              </>
            )}

            {step === 1 && otp.stage === 'details' && (
              <>
                <div className="step-label">STEP 1 OF 4</div>
                <Field label="Name" error={errors.name}><input type="text" value={data.name} onChange={set('name')} /></Field>
                <Field label="Organization" error={errors.company}><input type="text" value={data.company} onChange={set('company')} /></Field>
                <Field label="Email" error={errors.email}><input type="email" value={data.email} onChange={set('email')} /></Field>
                {apiError && <div className="field-error-banner">{apiError}</div>}
                <div className="btn-row"><button type="button" className="btn" onClick={next1} disabled={busy}>{busy ? 'Sending code…' : 'Continue'}</button></div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="step-label">STEP 2 OF 4</div>
                <label className={`upload-box${data.file ? ' filled' : ''}`} htmlFor="a-file">
                  <span className="upload-icon">⬆</span>
                  <input
                    type="file"
                    id="a-file"
                    accept="audio/*,.mp3,.wav,.m4a,.mpeg"
                    onChange={(e) => { if (e.target.files.length) setData((d) => ({ ...d, file: e.target.files[0] })); }}
                  />
                  <span>
                    {data.file ? `Selected: ${data.file.name}` : (
                      <><b>Click to upload</b> a call recording<br /><span style={{ color: 'var(--ink-faint)', fontSize: 11.5 }}>MP3, WAV, M4A — up to {limits.uploadMaxMb} MB</span></>
                    )}
                  </span>
                </label>
                <Field label="Line of business" hint={data.lob ? `Framework applied: ${FRAMEWORK_BY_LOB[data.lob]}` : ''}>
                  <select value={data.lob} onChange={set('lob')}>
                    <option value="">Select LOB</option>
                    {LOBS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <div className="checkbox-row">
                  <input type="checkbox" id="a-rights" checked={data.rights} onChange={(e) => setData((d) => ({ ...d, rights: e.target.checked }))} />
                  <label htmlFor="a-rights">I confirm I have the right to submit this recording.</label>
                </div>
                {apiError && <div className="field-error-banner">{apiError}</div>}
                <div className="btn-row">
                  <button type="button" className="btn secondary" onClick={() => setStep(1)}>Back</button>
                  <button type="button" className="btn" disabled={!canSubmit} onClick={run}>Get results</button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="step-label">STEP 3 OF 4</div>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Processing your call. A full audit usually takes about a minute — keep this page open.</p>
              </>
            )}

            {step === 4 && (
              <>
                <div className="step-label">STEP 4 OF 4 — DONE</div>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Your audit report is ready. Try another call or reset.</p>
                <div className="btn-row"><button type="button" className="btn secondary" onClick={reset}>Audit another call</button></div>
              </>
            )}
          </div>
        </div>

        <div className="right">
          {right.kind === 'placeholder' && <Placeholder />}
          {right.kind === 'processing' && (
            <>
              <div className="waveform">
                {Array.from({ length: 24 }, (_, i) => <div key={i} className="bar" style={{ animationDelay: `${i * 0.05}s` }} />)}
              </div>
              <div className="proc-msg">{right.message}</div>
              <div className="sandbox-note" style={{ marginTop: 'auto' }}>We transcribe the recording, then score it against the {right.framework} rubric for your line of business.</div>
            </>
          )}
          {right.kind === 'results' && <Summary results={right.results} transcript={right.transcript} />}
        </div>
      </div>

      {report && <AuditReport results={report.results} transcript={report.transcript} submitter={report.submitter} />}
    </>
  );
}

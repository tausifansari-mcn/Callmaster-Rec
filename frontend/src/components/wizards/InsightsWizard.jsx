import { useEffect, useRef, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSite } from '../../context/SiteContext.jsx';
import { GoLink } from '../../hooks/useGoto.jsx';
import { sleep } from '../../utils/format.js';
import { isEmail } from '../../utils/validators.js';
import AuditReport from '../audit/AuditReport.jsx';

/**
 * Quality Audits sandbox. Markup and step order follow the theme's template-quality-audits.php
 * (details → verify → consent → upload → result); the data flow is this app's: email OTP, the visitor
 * is saved once verified, the recording is scored by the backend and the full report renders below.
 */
const FRAMEWORK_BY_LOB = {
  'Inbound Support': 'CLAP',
  'Outbound Sales': 'MAGIC Script — CRT / CST',
  Collections: 'RESO',
  Retention: 'MAGIC Script — CRT / CST',
};
const LOBS = Object.keys(FRAMEWORK_BY_LOB);
const TOTAL = 5;
const EMPTY = { name: '', company: '', email: '', file: null, lob: '', consent: false, rights: false, paramMode: 'standard', customParams: ['', ''] };
const POLL_MS = 2500;
const MAX_WAIT_MS = 6 * 60 * 1000;
const MESSAGE_MS = 3200;

const stageMessages = (stage, framework) => (stage === 'auditing'
  ? [`Scoring against ${framework}…`, 'Checking compliance…', 'Flagging improvement areas…', 'Writing your coaching plan…']
  : ['Transcribing and scoring your call…', 'Transcribing your call…', 'Identifying speakers…']);

const mmss = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
const speaker = (t) => (t.role === 'agent' ? 'Agent' : t.role === 'customer' ? 'Customer' : `Speaker ${t.speaker}`);

export function StepsTrack({ total, current }) {
  return (
    <div className="steps-track">
      {Array.from({ length: total }, (_, i) => <div key={i} className={`dot ${i + 1 < current ? 'done' : i + 1 === current ? 'now' : ''}`} />)}
    </div>
  );
}

function ErrorText({ children }) {
  return <div className="error-text" style={{ display: children ? 'block' : 'none' }} role="alert">{children}</div>;
}

export default function InsightsWizard() {
  const { limits } = useSite();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null); // { id, accessToken } — the visitor saved once verified
  const [otp, setOtp] = useState({ code: '', devOtp: '', notice: '' });
  const [verified, setVerified] = useState({ email: '', token: '' });
  const [progress, setProgress] = useState(null); // processing message while the audit runs
  const [report, setReport] = useState(null); // { results, transcript, submitter }
  const alive = useRef(true);
  const messageTimer = useRef();
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearInterval(messageTimer.current); };
  }, []);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  const go = (n) => { setError(''); setStep(n); };

  /** Step 1: send the email code (or skip straight on if this address was verified a moment ago). */
  const next1 = async () => {
    const name = data.name.trim();
    const company = data.company.trim();
    const email = data.email.trim();
    if (!name || !company || !isEmail(email)) return setError('Enter your name, email and organization to continue.');
    setError('');
    setBusy(true);
    try {
      setData((d) => ({ ...d, name, company, email }));
      if (verified.token && verified.email === email.toLowerCase()) {
        await saveVisitor({ name, company, email }, verified.token);
        return undefined;
      }
      const sent = await publicApi.sendOtp({ purpose: 'audit-demo', email: email.toLowerCase() });
      setOtp({ code: '', devOtp: sent.devOtp || '', notice: '' });
      go(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  /** Saves name / organization / email (the row appears in the admin panel) and moves to consent. */
  const saveVisitor = async ({ name, company, email }, verifyToken) => {
    const saved = await publicApi.auditRegister({ name, company, email, verifyToken, ...(session || {}) });
    setSession({ id: saved.id, accessToken: saved.accessToken });
    go(3);
  };

  const verifyCode = async () => {
    if (!/^\d{4}$/.test(otp.code.trim())) return setError('Enter the 4-digit code from the email.');
    setError('');
    setBusy(true);
    try {
      const email = data.email.toLowerCase();
      const r = await publicApi.verifyOtp({ purpose: 'audit-demo', target: email, code: otp.code.trim() });
      setVerified({ email, token: r.verifyToken });
      await saveVisitor(data, r.verifyToken);
    } catch (err) {
      setOtp((o) => ({ ...o, code: '', notice: '' }));
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  const resendCode = async () => {
    setError('');
    try {
      const sent = await publicApi.sendOtp({ purpose: 'audit-demo', email: data.email.toLowerCase() });
      setOtp((o) => ({ ...o, code: '', devOtp: sent.devOtp || '', notice: 'A new code has been sent.' }));
    } catch (err) {
      setError(err.message);
    }
  };

  const next3 = () => {
    if (!data.consent || !data.rights) return setError('Consent is required before you can upload a call.');
    return go(4);
  };

  const showProgress = (stage, framework) => {
    clearInterval(messageTimer.current);
    const lines = stageMessages(stage, framework);
    let i = 0;
    setProgress(lines[0]);
    messageTimer.current = setInterval(() => {
      i = Math.min(i + 1, lines.length - 1);
      setProgress(lines[i]);
    }, MESSAGE_MS);
  };

  const finish = (results, transcript, snapshot) => {
    clearInterval(messageTimer.current);
    setProgress(null);
    setReport({ results, transcript, submitter: snapshot });
  };

  const fail = (message) => {
    clearInterval(messageTimer.current);
    setProgress(null);
    setError(message);
    setStep(4);
  };

  const customParamNames = data.customParams.map((p) => p.trim()).filter(Boolean);

  const run = async () => {
    if (!data.file || !data.lob || (data.paramMode === 'custom' && !customParamNames.length)) {
      return setError('Upload a recording, choose a line of business, and complete your scoring parameters.');
    }
    go(5);
    setReport(null);
    const framework = FRAMEWORK_BY_LOB[data.lob] || 'CLAP';
    const snapshot = { ...data };
    showProgress('transcribing', framework);

    const form = new FormData();
    form.append('file', data.file);
    form.append('accessToken', session.accessToken);
    form.append('lob', data.lob);
    form.append('rights', String(data.rights));
    if (data.paramMode === 'custom' && customParamNames.length) form.append('customParams', JSON.stringify(customParamNames));

    try {
      const started = await publicApi.auditSubmit(session.id, form);
      if (!alive.current) return undefined;
      if (started.status === 'completed') { // sandbox mode: no API keys on the server, result is immediate
        await sleep(1500);
        if (alive.current) finish(started.results, started.transcript, snapshot);
        return undefined;
      }
      const deadline = Date.now() + MAX_WAIT_MS;
      let stage = 'transcribing';
      while (alive.current && Date.now() < deadline) {
        await sleep(POLL_MS);
        if (!alive.current) return undefined;
        const s = await publicApi.auditStatus(session.id, session.accessToken);
        if (s.status === 'completed') { finish(s.results, s.transcript, snapshot); return undefined; }
        if (s.status === 'failed') { fail(s.error); return undefined; }
        if (s.stage && s.stage !== stage) { stage = s.stage; showProgress(stage, framework); }
      }
      if (alive.current) fail('This is taking longer than expected. Please try again in a few minutes.');
    } catch (err) {
      if (alive.current) fail(err.message);
    }
    return undefined;
  };

  const reset = () => {
    clearInterval(messageTimer.current);
    setData(EMPTY);
    setError('');
    setProgress(null);
    setReport(null);
    setSession(null);
    setOtp({ code: '', devOtp: '', notice: '' });
    setStep(1);
  };

  const setParams = (fn) => setData((d) => ({ ...d, customParams: fn(d.customParams) }));
  const r = report?.results;

  return (
    <>
      <StepsTrack total={TOTAL} current={step} />

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 1 && (
          <div className="step-panel active" data-step="1">
            <div className="grid2">
              <div className="field"><label htmlFor="qa_name">Full name</label><input type="text" id="qa_name" placeholder="Ananya Sharma" value={data.name} onChange={set('name')} /></div>
              <div className="field"><label htmlFor="qa_email">Work email</label><input type="email" id="qa_email" placeholder="ananya@company.com" value={data.email} onChange={set('email')} /></div>
            </div>
            <div className="field"><label htmlFor="qa_company">Organization</label><input type="text" id="qa_company" placeholder="Company name" autoComplete="organization" value={data.company} onChange={set('company')} /></div>
            <ErrorText>{error}</ErrorText>
            <div className="step-actions"><span /><button type="button" className="btn btn-primary" onClick={next1} disabled={busy}>{busy ? 'Sending…' : 'Send OTP'}</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="step-panel active" data-step="2">
            <p style={{ fontSize: 14 }}>We sent a 4-digit code by email to <span className="mono">{data.email}</span>. It is valid for 10 minutes.</p>
            {otp.devOtp && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Sandbox mode: email delivery isn&apos;t set up on this server. Your test code is <b className="mono">{otp.devOtp}</b>.</p>}
            <div className="field" style={{ maxWidth: 180 }}>
              <input
                type="text" maxLength={4} id="qa_otp" aria-label="4-digit verification code" placeholder="1234" inputMode="numeric" autoComplete="one-time-code"
                value={otp.code} onChange={(e) => setOtp((o) => ({ ...o, code: e.target.value.replace(/\D/g, '') }))}
                onKeyDown={(e) => { if (e.key === 'Enter') verifyCode(); }}
              />
            </div>
            {otp.notice && !error && <div className="error-text" style={{ display: 'block', color: 'var(--teal-dark)' }}>{otp.notice}</div>}
            <ErrorText>{error}</ErrorText>
            <div className="step-actions">
              <button type="button" className="btn btn-outline" onClick={() => go(1)}>Back</button>
              <button type="button" className="btn btn-outline" onClick={resendCode}>Resend code</button>
              <button type="button" className="btn btn-primary" onClick={verifyCode} disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-panel active" data-step="3">
            <div className="consent-box">
              <h4>Before you upload</h4>
              <ul>
                <li>We collect your name, verified email, organization, the call recording you upload, its transcript, and any custom parameters you provide.</li>
                <li>This is used only to generate your sandbox result and for our sales team to follow up.</li>
                <li>Recording and transcript retention window: to be confirmed before launch — see the <GoLink to="data-retention">Data Retention Policy</GoLink>.</li>
              </ul>
              <label className="consent-check"><input type="checkbox" checked={data.consent} onChange={(e) => setData((d) => ({ ...d, consent: e.target.checked }))} /> I consent to Nimantran processing this data as described above.</label>
              <label className="consent-check"><input type="checkbox" checked={data.rights} onChange={(e) => setData((d) => ({ ...d, rights: e.target.checked }))} /> I confirm I have the right to submit this recording.</label>
            </div>
            <ErrorText>{error}</ErrorText>
            <div className="step-actions"><button type="button" className="btn btn-outline" onClick={() => go(2)}>Back</button><button type="button" className="btn btn-primary" onClick={next3}>Continue</button></div>
          </div>
        )}

        {step === 4 && (
          <div className="step-panel active" data-step="4">
            <div className="field">
              <label htmlFor="qa_file" id="qa_file_label">Upload call recording (mp3, wav, m4a; max {limits.uploadMaxMb} MB)</label>
              <div
                className={`upload-box${data.file ? ' has-file' : ''}`} role="button" tabIndex={0} aria-labelledby="qa_file_label"
                onClick={() => document.getElementById('qa_file').click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
              >
                {data.file ? `Selected: ${data.file.name}` : 'Click to choose a file'}
              </div>
              <input type="file" id="qa_file" accept=".mp3,.wav,.m4a,.mpeg,.ogg,audio/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files.length) { const f = e.target.files[0]; setData((d) => ({ ...d, file: f })); } }} />
            </div>
            <div className="field">
              <label htmlFor="qa_lob">Line of business</label>
              <select id="qa_lob" value={data.lob} onChange={set('lob')}>
                <option value="">Choose one</option>
                {LOBS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Scoring parameters</span>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button type="button" className={`seg-btn${data.paramMode === 'standard' ? ' active' : ''}`} onClick={() => setData((d) => ({ ...d, paramMode: 'standard' }))}>Use standard parameters</button>
                <button type="button" className={`seg-btn${data.paramMode === 'custom' ? ' active' : ''}`} onClick={() => setData((d) => ({ ...d, paramMode: 'custom' }))}>Use my own parameters</button>
              </div>
              {data.paramMode === 'custom' && (
                <div>
                  {data.customParams.map((val, i) => (
                    <div className="param-row" key={i}>
                      <input type="text" className="param-name" placeholder="e.g. Opening script adherence" value={val} onChange={(e) => setParams((ps) => ps.map((p, pi) => (pi === i ? e.target.value : p)))} />
                      <button type="button" className="btn btn-outline" onClick={() => setParams((ps) => ps.filter((_, pi) => pi !== i))}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline" style={{ marginTop: 2, fontSize: 13, padding: '8px 14px' }} onClick={() => setParams((ps) => [...ps, ''])}>+ Add parameter</button>
                </div>
              )}
            </div>
            <ErrorText>{error}</ErrorText>
            <div className="step-actions"><button type="button" className="btn btn-outline" onClick={() => go(3)}>Back</button><button type="button" className="btn btn-primary" onClick={run}>Run audit</button></div>
          </div>
        )}

        {step === 5 && (
          <div className="step-panel active" data-step="5">
            {progress && <div className="processing"><div className="spinner" /> {progress}</div>}
            {r && (
              <div>
                {r.mock && <div className="demo-badge" role="note"><strong>Demo output.</strong> The transcript and scores below are a sample, not an analysis of your recording. Live scoring is being connected.</div>}
                {report.transcript?.turns?.length > 0 && (
                  <div className="result-block">
                    <h4>Call transcript</h4>
                    <div className="transcript-box">
                      {report.transcript.turns.map((t, i) => (
                        <span key={i}>{i > 0 && <br />}{speaker(t)} [{mmss(t.start)}]: {t.text}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="result-block">
                  <h4>Quality scorecard</h4>
                  <p className="score-note">{r.framework} · {r.bandLabel} · overall score {r.score} out of 100</p>
                  <div className="score-grid">
                    <div className="score-card"><div className="num">{r.score}</div><div className="lbl">Overall</div></div>
                    {(r.parameters || []).filter((p) => p.applicable).slice(0, 7).map((p) => (
                      <div className="score-card" key={p.key}><div className="num">{p.score * 10}</div><div className="lbl">{p.name}</div></div>
                    ))}
                  </div>
                </div>
                {r.summary && (
                  <div className="result-block">
                    <h4>Summary</h4>
                    <p style={{ fontSize: 13.5, margin: 0 }}>{r.summary}</p>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <span className="tier-label tier-minute">Per-minute</span>
                  <p style={{ fontSize: 13.5 }}>Full rate card on the <GoLink to="pricing" style={{ color: 'var(--teal-dark)', textDecoration: 'underline' }}>Pricing page</GoLink>.</p>
                </div>
                <div className="step-actions">
                  <button type="button" className="btn btn-outline" onClick={() => document.getElementById('audit-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View the full audit report</button>
                  <button type="button" className="btn btn-outline" onClick={reset}>Audit another call</button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      {report && <div className="pp-report"><AuditReport results={report.results} transcript={report.transcript} submitter={report.submitter} /></div>}
    </>
  );
}

import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { useAuth } from '../AdminContext.jsx';

/** Step 2 of "Forgot password" — enter the 4-digit code that was emailed, plus a new password. */
function ResetForm({ email, onDone, onBack }) {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(code.trim())) return setError('Enter the 4-digit code from the email.');
    if (newPassword.length < 8) return setError('Use at least 8 characters.');
    if (newPassword !== confirm) return setError("The passwords don't match.");
    setError('');
    setBusy(true);
    try {
      await adminApi.resetPassword(email, code.trim(), newPassword);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await adminApi.forgotPassword(email);
      setResent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="adm-login-card" onSubmit={submit}>
      <div className="brand"><span className="dot" />CallMaster</div>
      <h1>Enter the reset code</h1>
      <p className="adm-muted">
        If <strong>{email}</strong> has an admin account, we've emailed it a 4-digit code — it expires in 10 minutes.
      </p>
      <label className="adm-label" htmlFor="adm-reset-code">Reset code</label>
      <input
        id="adm-reset-code" className="adm-input" inputMode="numeric" maxLength={4} autoComplete="one-time-code"
        value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus
      />
      <label className="adm-label" htmlFor="adm-reset-pw">New password</label>
      <input
        id="adm-reset-pw" className="adm-input" type={show ? 'text' : 'password'} autoComplete="new-password"
        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
      />
      <label className="adm-label" htmlFor="adm-reset-pw2">Confirm new password</label>
      <input
        id="adm-reset-pw2" className="adm-input" type={show ? 'text' : 'password'} autoComplete="new-password"
        value={confirm} onChange={(e) => setConfirm(e.target.value)} required
      />
      <label className="adm-switch" style={{ marginTop: -4 }}><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /><span>Show passwords</span></label>
      {error && <div className="adm-error">{error}</div>}
      {resent && !error && <div className="adm-toast" style={{ display: 'block' }}>A new code has been sent.</div>}
      <button type="submit" className="adm-btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
      <div className="adm-login-links">
        <button type="button" className="link-btn" onClick={resend}>Resend code</button>
        <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
      </div>
    </form>
  );
}

/** Step 1 — enter the email to request a reset code. Always succeeds visibly, whether or not it's a real admin. */
function ForgotForm({ onSent, onBack }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return setError('Enter your admin email address.');
    setError('');
    setBusy(true);
    try {
      await adminApi.forgotPassword(v);
      onSent(v);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="adm-login-card" onSubmit={submit}>
      <div className="brand"><span className="dot" />CallMaster</div>
      <h1>Reset your password</h1>
      <p className="adm-muted">Enter the email on your admin account and we'll send a reset code to it.</p>
      <label className="adm-label" htmlFor="adm-forgot-email">Email</label>
      <input id="adm-forgot-email" className="adm-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      {error && <div className="adm-error">{error}</div>}
      <button type="submit" className="adm-btn primary block" disabled={busy}>{busy ? 'Sending…' : 'Send reset code'}</button>
      <button type="button" className="adm-muted small center link-btn" onClick={onBack} style={{ marginTop: 6 }}>← Back to sign in</button>
    </form>
  );
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // 'login' | 'forgot' | 'reset' | 'done'
  const [view, setView] = useState('login');
  const [resetEmail, setResetEmail] = useState('');

  if (status === 'authed') return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (view === 'forgot') {
    return (
      <div className="adm-login">
        <ForgotForm onSent={(v) => { setResetEmail(v); setView('reset'); }} onBack={() => setView('login')} />
      </div>
    );
  }
  if (view === 'reset') {
    return (
      <div className="adm-login">
        <ResetForm email={resetEmail} onBack={() => setView('forgot')} onDone={() => setView('done')} />
      </div>
    );
  }
  if (view === 'done') {
    return (
      <div className="adm-login">
        <div className="adm-login-card">
          <div className="brand"><span className="dot" />CallMaster</div>
          <h1>Password updated</h1>
          <p className="adm-muted">Sign in with your new password.</p>
          <button type="button" className="adm-btn primary block" onClick={() => setView('login')}>Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <div className="brand"><span className="dot" />CallMaster</div>
        <h1>Admin sign in</h1>
        <p className="adm-muted">Manage pricing, content, leads and orders.</p>
        <label className="adm-label" htmlFor="adm-email">Email</label>
        <input id="adm-email" className="adm-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label className="adm-label" htmlFor="adm-pw">Password</label>
        <input id="adm-pw" className="adm-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <label className="adm-switch" style={{ marginTop: -4 }}><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /><span>Show password</span></label>
        {error && <div className="adm-error">{error}</div>}
        <button type="submit" className="adm-btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="adm-login-links">
          <button type="button" className="link-btn" onClick={() => setView('forgot')}>Forgot password?</button>
        </div>
        <a className="adm-muted small center" href="/">← Back to the website</a>
      </form>
    </div>
  );
}

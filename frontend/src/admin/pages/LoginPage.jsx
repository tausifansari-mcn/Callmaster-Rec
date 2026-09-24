import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AdminContext.jsx';

export default function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
        <a className="adm-muted small center" href="/">← Back to the website</a>
      </form>
    </div>
  );
}

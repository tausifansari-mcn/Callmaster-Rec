import { useCallback, useEffect, useState } from 'react';
import { publicApi } from '../api/public.js';
import { money } from '../utils/format.js';

// The token lives in sessionStorage only: closing the tab signs the customer out.
const TOKEN_KEY = 'cm-customer-token';
const readToken = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const writeToken = (t) => { try { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } };

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function LoginForm({ onLoggedIn }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password) return setError('Enter your username and password');
    setError('');
    setBusy(true);
    try {
      const r = await publicApi.customerLogin({ login: login.trim(), password });
      onLoggedIn(r.token);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  };

  return (
    <form className="quote-box acct-box" onSubmit={submit} noValidate>
      <h2>Sign in</h2>
      <p>Use the username and temporary password from your welcome email. You can also sign in with your email address.</p>
      <div className="field"><label htmlFor="acct_login">Username or email</label><input id="acct_login" type="text" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} /></div>
      <div className="field"><label htmlFor="acct_password">Password</label><input id="acct_password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div className="error-text" role="alert" style={{ display: error ? 'block' : 'none' }}>{error}</div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}

function ChangePassword({ token, forced, onDone, onCancel }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) return setError('Use at least 8 characters');
    if (next !== again) return setError("The new passwords don't match");
    setError('');
    setBusy(true);
    try {
      await publicApi.customerChangePassword(token, { currentPassword: current, newPassword: next });
      setSaved(true);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  };

  return (
    <form className="quote-box acct-box" onSubmit={submit} noValidate>
      <h2>{forced ? 'Set a new password' : 'Change password'}</h2>
      {forced && <p>For your security, please replace the temporary password before continuing.</p>}
      <div className="field"><label htmlFor="acct_cur">{forced ? 'Temporary password' : 'Current password'}</label><input id="acct_cur" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
      <div className="field"><label htmlFor="acct_new">New password</label><input id="acct_new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
      <div className="field"><label htmlFor="acct_again">Repeat new password</label><input id="acct_again" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} /></div>
      <div className="error-text" role="alert" style={{ display: error ? 'block' : 'none' }}>{error}</div>
      {saved && <div className="quote-success" role="status" style={{ display: 'block', marginBottom: 14 }}>Password updated.</div>}
      <div className="hero-cta" style={{ marginTop: 0 }}>
        {!forced && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </div>
    </form>
  );
}

function Dashboard({ token, account, onSignOut, onChangePassword, onExpired }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await publicApi.customerOrders(token));
    } catch (err) {
      if (err.status === 401) return onExpired();
      setError(err.message);
    }
    return undefined;
  }, [token, onExpired]);
  useEffect(() => { load(); }, [load]);

  const cancel = async (orderId) => {
    setBusy(true);
    setError('');
    try {
      const r = await publicApi.customerCancel(token, orderId);
      setNotice(`Order ${orderId} has been cancelled. A refund of ${money(r.refundAmount)} will reach your original payment method within ${r.refundDays} working days.`);
      setConfirming('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="acct-bar">
        <div className="acct-who">
          Signed in as <b style={{ color: 'var(--ink)' }}>{account.username}</b>{account.company ? ` · ${account.company}` : ''}
        </div>
        <div className="hero-cta" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-outline" onClick={onChangePassword}>Change password</button>
          <button type="button" className="btn btn-outline" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div>
        <h2 className="block-title">Your orders</h2>
        {notice && <div className="quote-success" role="status" style={{ display: 'block', marginBottom: 14 }}>{notice}</div>}
        {error && <div className="error-text" role="alert" style={{ display: 'block', marginTop: 0 }}>{error}</div>}
        {!data && !error && <div className="pm-processing"><div className="pm-spinner" />Loading your orders…</div>}
        {data && data.orders.length === 0 && <p className="no-price-note">No orders on this account yet.</p>}
        {data && data.orders.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="customer-table">
              <thead><tr><th>Order</th><th>Product</th><th>Date</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{o.orderId}</td>
                    <td>{o.product}<div style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{o.plan}</div></td>
                    <td>{fmtDate(o.paidAt || o.createdAt)}</td>
                    <td>{money(o.total)}</td>
                    <td><span className={`status-pill ${['paid', 'fulfilled'].includes(o.status) ? 'ok' : 'warn'}`}>{o.status}</span></td>
                    <td>
                      {o.cancellable && confirming !== o.orderId && (
                        <button type="button" className="link-btn" onClick={() => setConfirming(o.orderId)}>Cancel</button>
                      )}
                      {confirming === o.orderId && (
                        <div style={{ fontSize: 12.5 }}>
                          Cancel for a full refund of {money(o.total)}?<br />
                          <button type="button" className="link-btn" disabled={busy} onClick={() => cancel(o.orderId)}>{busy ? 'Cancelling…' : 'Yes, cancel'}</button>
                          {' · '}
                          <button type="button" className="link-btn" disabled={busy} onClick={() => setConfirming('')}>Keep</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.policy && (
          <p className="no-price-note" style={{ marginTop: 14 }}>
            Cloud Telephony orders can be cancelled here within {data.policy.windowDays} days of purchase for a full refund ({data.policy.refundDays} working days to your original payment method). For anything else, contact our team.
          </p>
        )}
      </div>
    </>
  );
}

export default function AccountPage() {
  const [token, setToken] = useState(readToken);
  const [account, setAccount] = useState(null);
  const [view, setView] = useState(token ? 'loading' : 'login'); // loading | login | force-password | dashboard | password

  const signOut = useCallback(() => {
    writeToken('');
    setToken('');
    setAccount(null);
    setView('login');
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    publicApi.customerMe(token)
      .then((r) => {
        if (!alive) return;
        setAccount(r.account);
        setView(r.account.mustChangePassword ? 'force-password' : 'dashboard');
      })
      .catch(() => alive && signOut());
    return () => { alive = false; };
  }, [token, signOut]);

  const onLoggedIn = (t) => {
    writeToken(t);
    setView('loading');
    setToken(t);
  };

  return (
    <div className="tp-ct tp-account">
      <div className="wrap section">
        <div className="section-head">
          <div className="kicker">Customer dashboard</div>
          <h1>Your Nimantran account</h1>
          <p>Manage your orders and subscription. Your login details are in the welcome email we sent after your purchase.</p>
        </div>
        {view === 'loading' && <div className="pm-processing"><div className="pm-spinner" />Loading…</div>}
        {view === 'login' && <LoginForm onLoggedIn={onLoggedIn} />}
        {view === 'force-password' && (
          <ChangePassword token={token} forced onDone={() => { setAccount((a) => ({ ...a, mustChangePassword: false })); setTimeout(() => setView('dashboard'), 700); }} />
        )}
        {view === 'password' && (
          <ChangePassword token={token} onDone={() => setTimeout(() => setView('dashboard'), 900)} onCancel={() => setView('dashboard')} />
        )}
        {view === 'dashboard' && account && (
          <Dashboard token={token} account={account} onSignOut={signOut} onChangePassword={() => setView('password')} onExpired={signOut} />
        )}
      </div>
    </div>
  );
}

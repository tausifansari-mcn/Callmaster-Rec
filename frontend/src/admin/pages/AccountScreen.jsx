import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { PageHeader } from '../components/ui.jsx';
import { useAuth, useToast } from '../AdminContext.jsx';

export default function AccountScreen() {
  const { admin } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('Use at least 8 characters for the new password.');
    if (next !== confirm) return setError("The new passwords don't match.");
    setBusy(true);
    try {
      await adminApi.changePassword(current, next);
      toast.success('Password changed');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <>
      <PageHeader title="My account" subtitle={`${admin.name} · ${admin.email}`} />
      <form className="adm-card narrow" onSubmit={submit}>
        <h3 className="adm-card-title">Change password</h3>
        <div className="adm-field"><label className="adm-label">Current password</label><input className="adm-input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></div>
        <div className="adm-field"><label className="adm-label">New password</label><input className="adm-input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required /></div>
        <div className="adm-field"><label className="adm-label">Confirm new password</label><input className="adm-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
        {error && <div className="adm-error">{error}</div>}
        <button type="submit" className="adm-btn primary" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </>
  );
}

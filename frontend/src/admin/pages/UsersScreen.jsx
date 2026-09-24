import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { Fields } from '../components/SchemaForm.jsx';
import { Badge, ErrorNote, Loading, Modal, PageHeader, fmtDate } from '../components/ui.jsx';
import { useAuth, useToast } from '../AdminContext.jsx';

function UserForm({ user, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !user.id;
  const [v, setV] = useState({ name: user.name || '', email: user.email || '', role: user.role || 'admin', active: user.active ?? true, password: '' });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const body = { name: v.name, email: v.email, role: v.role, active: v.active, ...(v.password ? { password: v.password } : {}) };
      if (isNew) await adminApi.createUser(body); else await adminApi.updateUser(user.id, body);
      toast.success('Saved');
      onSaved();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'New admin user' : `Edit ${user.name}`}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="adm-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      )}
    >
      <Fields
        value={v}
        onChange={setV}
        fields={[
          { type: 'text', key: 'name', label: 'Name' },
          { type: 'text', key: 'email', label: 'Email (login)' },
          { type: 'select', key: 'role', label: 'Role', options: [{ value: 'admin', label: 'Admin — manage content & inbox' }, { value: 'superadmin', label: 'Super admin — also manages admin users' }] },
          { type: 'boolean', key: 'active', label: 'Access', switchLabel: 'Account enabled' },
          { type: 'text', key: 'password', label: isNew ? 'Initial password' : 'New password (leave blank to keep)', hint: 'At least 8 characters.', wide: true },
        ]}
      />
    </Modal>
  );
}

export default function UsersScreen() {
  const { admin: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setUsers(await adminApi.users()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { if (me.role === 'superadmin') load(); }, [load, me.role]);

  if (me.role !== 'superadmin') return <Navigate to="/admin" replace />;

  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.name} (${u.email})?`)) return;
    try { await adminApi.deleteUser(u.id); toast.success('Removed'); load(); } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        title="Admin users"
        subtitle="People who can sign in to this panel."
        actions={<button type="button" className="adm-btn primary" onClick={() => setEditing({})}>+ New admin</button>}
      />
      <ErrorNote error={error} onRetry={load} />
      {!users && !error && <Loading />}
      {users && (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong>{u.id === me.id && <span className="adm-muted small"> (you)</span>}</td>
                    <td>{u.email}</td>
                    <td><Badge value={u.role} label={u.role === 'superadmin' ? 'Super admin' : 'Admin'} /></td>
                    <td><Badge value={u.active ? 'active' : 'disabled'} /></td>
                    <td>{fmtDate(u.lastLoginAt)}</td>
                    <td className="adm-row-actions">
                      <button type="button" className="adm-btn small" onClick={() => setEditing(u)}>Edit</button>
                      {u.id !== me.id && <button type="button" className="adm-btn small danger" onClick={() => remove(u)}>Remove</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <UserForm user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

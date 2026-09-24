import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { Fields } from '../components/SchemaForm.jsx';
import { Badge, ErrorNote, Loading, Modal, PageHeader, fmtDate } from '../components/ui.jsx';
import { useToast } from '../AdminContext.jsx';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const EMPTY = { code: '', percent: 10, description: '', active: true, validFrom: '', validUntil: '', maxUses: 0 };

const FIELDS = [
  { type: 'text', key: 'code', label: 'Code', placeholder: 'WELCOME15', hint: 'Letters, numbers, dashes. Customers type this at checkout (not case sensitive).' },
  { type: 'number', key: 'percent', label: 'Discount', suffix: '%', min: 1, step: 1, hint: 'Taken off the subtotal before GST.' },
  { type: 'text', key: 'description', label: 'Internal description', wide: true },
  { type: 'boolean', key: 'active', label: 'Status', switchLabel: 'Active' },
  { type: 'number', key: 'maxUses', label: 'Usage limit', step: 1, hint: '0 = unlimited' },
];

function PromoForm({ promo, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState({ ...promo, validFrom: toDateInput(promo.validFrom), validUntil: toDateInput(promo.validUntil) });
  const [busy, setBusy] = useState(false);
  const isNew = !promo.id;

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        code: v.code, percent: Number(v.percent), description: v.description, active: v.active, maxUses: Number(v.maxUses) || 0,
        validFrom: v.validFrom || null, validUntil: v.validUntil || null,
      };
      if (isNew) await adminApi.createPromo(body); else await adminApi.updatePromo(promo.id, body);
      toast.success('Saved');
      onSaved();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'New promo code' : `Edit ${promo.code}`}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="adm-btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </>
      )}
    >
      <Fields fields={FIELDS} value={v} onChange={setV} />
      <div className="adm-fields" style={{ marginTop: 14 }}>
        <div className="adm-field"><label className="adm-label">Valid from (optional)</label><input className="adm-input" type="date" value={v.validFrom} onChange={(e) => setV({ ...v, validFrom: e.target.value })} /></div>
        <div className="adm-field"><label className="adm-label">Valid until (optional)</label><input className="adm-input" type="date" value={v.validUntil} onChange={(e) => setV({ ...v, validUntil: e.target.value })} /></div>
      </div>
    </Modal>
  );
}

export default function PromosScreen() {
  const toast = useToast();
  const [promos, setPromos] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setPromos(await adminApi.promos()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Delete promo code ${p.code}?`)) return;
    try { await adminApi.deletePromo(p.id); toast.success('Deleted'); load(); } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        title="Promo codes"
        subtitle="Discount codes customers can apply on the payment step, for every product."
        actions={<button type="button" className="adm-btn primary" onClick={() => setEditing(EMPTY)}>+ New code</button>}
      />
      <ErrorNote error={error} onRetry={load} />
      {!promos && !error && <Loading />}
      {promos && (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Used</th><th>Valid</th><th></th></tr></thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.code}</strong><div className="adm-muted small">{p.description}</div></td>
                    <td>{p.percent}%</td>
                    <td><Badge value={p.active ? 'active' : 'disabled'} /></td>
                    <td>{p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                    <td>{p.validFrom || p.validUntil ? `${p.validFrom ? fmtDate(p.validFrom).split(',')[0] : '…'} → ${p.validUntil ? fmtDate(p.validUntil).split(',')[0] : '…'}` : 'Always'}</td>
                    <td className="adm-row-actions">
                      <button type="button" className="adm-btn small" onClick={() => setEditing(p)}>Edit</button>
                      <button type="button" className="adm-btn small danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!promos.length && <tr><td colSpan={6} className="adm-empty-cell">No promo codes.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <PromoForm promo={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

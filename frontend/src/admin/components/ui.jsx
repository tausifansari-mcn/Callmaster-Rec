import { useEffect } from 'react';

export function Modal({ title, onClose, children, wide = false, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="adm-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`adm-modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-modal-head">
          <h3>{title}</h3>
          <button type="button" className="adm-icon-btn" aria-label="Close" onClick={onClose}>&times;</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="adm-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-actions">{actions}</div>}
    </div>
  );
}

const STATUS_TONE = {
  new: 'amber', contacted: 'blue', qualified: 'green', closed: 'grey', read: 'blue', replied: 'green',
  pending: 'amber', paid: 'green', fulfilled: 'green', cancelled: 'grey', refunded: 'red', failed: 'red',
  audit: 'blue', voice: 'amber', simulated: 'grey', requested: 'green',
  superadmin: 'amber', admin: 'blue', active: 'green', disabled: 'grey', published: 'green', draft: 'grey',
  legal: 'blue', custom: 'grey',
};
export const Badge = ({ value, label }) => <span className={`adm-badge ${STATUS_TONE[value] || 'grey'}`}>{label || value}</span>;

export const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

export function Loading({ text = 'Loading…' }) {
  return <div className="adm-empty"><div className="pm-spinner" />{text}</div>;
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="adm-error">
      {error}{onRetry && <> <button type="button" className="link-btn" onClick={onRetry}>Retry</button></>}
    </div>
  );
}

export function KV({ label, children }) {
  return (
    <div className="adm-kv">
      <dt>{label}</dt>
      <dd>{children === undefined || children === null || children === '' ? '—' : children}</dd>
    </div>
  );
}

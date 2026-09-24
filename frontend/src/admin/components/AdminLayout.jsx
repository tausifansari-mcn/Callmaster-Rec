import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../AdminContext.jsx';

const NAV = [
  { group: 'Overview', items: [{ to: '/admin', label: 'Dashboard', end: true }] },
  {
    group: 'Inbox',
    items: [
      { to: '/admin/orders', label: 'Orders' },
      { to: '/admin/leads', label: 'Pricing requests' },
      { to: '/admin/contacts', label: 'Contact messages' },
      { to: '/admin/cancellations', label: 'Cancellations & refunds' },
      { to: '/admin/whitepaper-leads', label: 'White paper downloads' },
      { to: '/admin/customers', label: 'Customer accounts' },
      { to: '/admin/email', label: 'Email & notifications' },
      { to: '/admin/demos', label: 'Demo activity' },
    ],
  },
  {
    group: 'Website content',
    items: [
      { to: '/admin/pricing', label: 'Pricing' },
      { to: '/admin/home', label: 'Home page' },
      { to: '/admin/insights', label: 'Insights page' },
      { to: '/admin/whitepapers', label: 'White papers' },
      { to: '/admin/faqs', label: 'FAQs' },
      { to: '/admin/pages', label: 'Pages & legal' },
      { to: '/admin/chatbot', label: 'Chatbot' },
      { to: '/admin/integrations', label: 'API keys (Deepgram & Claude)', superOnly: true },
      { to: '/admin/promos', label: 'Promo codes' },
      { to: '/admin/site', label: 'Site settings' },
    ],
  },
  { group: 'Admin', items: [{ to: '/admin/users', label: 'Admin users', superOnly: true }, { to: '/admin/account', label: 'My account' }] },
];

export default function AdminLayout() {
  const { status, admin, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => document.body.classList.remove('admin-mode');
  }, []);
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  if (status === 'checking') return <div className="app-loading"><div className="pm-spinner" />Loading…</div>;
  if (status !== 'authed') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="adm-shell">
      <header className="adm-topbar">
        <button type="button" className="adm-icon-btn" aria-label="Menu" onClick={() => setOpen((o) => !o)}>☰</button>
        <div className="brand"><span className="dot" />CallMaster <span className="adm-tag">Admin</span></div>
      </header>

      <aside className={`adm-side${open ? ' open' : ''}`}>
        <div className="brand adm-side-brand"><span className="dot" />CallMaster <span className="adm-tag">Admin</span></div>
        <nav>
          {NAV.map((g) => (
            <div key={g.group} className="adm-nav-group">
              <div className="adm-nav-title">{g.group}</div>
              {g.items.filter((i) => !i.superOnly || admin.role === 'superadmin').map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} className="adm-nav-link">{i.label}</NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <div className="adm-muted small">Signed in as</div>
          <div className="adm-who">{admin.name}</div>
          <div className="adm-muted small">{admin.email}</div>
          <div className="adm-side-actions">
            <a className="adm-btn small" href="/" target="_blank" rel="noreferrer">View site ↗</a>
            <button type="button" className="adm-btn small" onClick={logout}>Sign out</button>
          </div>
        </div>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}

      <main className="adm-main"><Outlet /></main>
    </div>
  );
}

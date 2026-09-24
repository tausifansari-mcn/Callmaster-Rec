import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { Badge, ErrorNote, Loading, PageHeader, fmtDate, inr } from '../components/ui.jsx';

function Stat({ label, value, sub, to }) {
  const body = (
    <>
      <div className="adm-stat-value">{value}</div>
      <div className="adm-stat-label">{label}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </>
  );
  return to ? <Link to={to} className="adm-stat">{body}</Link> : <div className="adm-stat">{body}</div>;
}

function Chart({ series }) {
  const max = Math.max(1, ...series.map((d) => d.orders + d.leads + d.contacts));
  return (
    <div className="adm-chart" role="img" aria-label="Orders, pricing requests and messages over the last 14 days">
      {series.map((d) => {
        const total = d.orders + d.leads + d.contacts;
        return (
          <div className="adm-bar-col" key={d.date} title={`${d.date}: ${d.orders} orders, ${d.leads} pricing requests, ${d.contacts} messages`}>
            <div className="adm-bar" style={{ height: `${(total / max) * 100}%` }}>
              <span className="seg orders" style={{ flexGrow: d.orders }} />
              <span className="seg leads" style={{ flexGrow: d.leads }} />
              <span className="seg contacts" style={{ flexGrow: d.contacts }} />
            </div>
            <div className="adm-bar-label">{d.date.slice(8)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setData(await adminApi.stats()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <><PageHeader title="Dashboard" /><ErrorNote error={error} onRetry={load} /></>;
  if (!data) return <><PageHeader title="Dashboard" /><Loading /></>;
  const { totals: t } = data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="What's happening on the site." actions={<button type="button" className="adm-btn" onClick={load}>Refresh</button>} />
      <div className="adm-stats">
        <Stat label="Revenue (paid orders)" value={inr(t.revenue)} sub={`${t.paidOrders} paid order${t.paidOrders === 1 ? '' : 's'}`} to="/admin/orders" />
        <Stat label="Pricing requests" value={t.leads} sub={`${t.newLeads} new`} to="/admin/leads" />
        <Stat label="Contact messages" value={t.contacts} sub={`${t.newContacts} new`} to="/admin/contacts" />
        <Stat label="Demos run" value={t.auditDemos + t.voiceDemos} sub={`${t.auditDemos} Insights · ${t.voiceDemos} Voice Bot${t.demoRegistered ? ` · ${t.demoRegistered} signed up, no call yet` : ''}`} to="/admin/demos" />
      </div>

      <div className="adm-grid-2">
        <div className="adm-card">
          <h3 className="adm-card-title">Last 14 days</h3>
          <Chart series={data.series} />
          <div className="adm-legend">
            <span><i className="dot orders" /> Orders</span><span><i className="dot leads" /> Pricing requests</span><span><i className="dot contacts" /> Messages</span>
          </div>
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title">Revenue by product</h3>
          {data.byProduct.length ? (
            <table className="adm-table compact">
              <tbody>
                {data.byProduct.map((p) => (
                  <tr key={p.product}><td>{p.product}<div className="adm-muted small">{p.orders} order{p.orders === 1 ? '' : 's'}</div></td><td className="num">{inr(p.revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          ) : <p className="adm-muted">No paid orders yet.</p>}
        </div>
      </div>

      <div className="adm-grid-3">
        <div className="adm-card">
          <h3 className="adm-card-title">Recent orders <Link to="/admin/orders">View all</Link></h3>
          {data.recent.orders.map((o) => (
            <div className="adm-row" key={o.id}>
              <div><strong>{o.orderId}</strong><div className="adm-muted small">{o.customer.company} · {fmtDate(o.createdAt)}</div></div>
              <div className="adm-row-end"><span className="num">{inr(o.total)}</span><Badge value={o.status} /></div>
            </div>
          ))}
          {!data.recent.orders.length && <p className="adm-muted">Nothing yet.</p>}
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title">Recent pricing requests <Link to="/admin/leads">View all</Link></h3>
          {data.recent.leads.map((l) => (
            <div className="adm-row" key={l.id}>
              <div><strong>{l.name}</strong><div className="adm-muted small">{l.organization} · {fmtDate(l.createdAt)}</div></div>
              <Badge value={l.status} />
            </div>
          ))}
          {!data.recent.leads.length && <p className="adm-muted">Nothing yet.</p>}
        </div>
        <div className="adm-card">
          <h3 className="adm-card-title">Recent messages <Link to="/admin/contacts">View all</Link></h3>
          {data.recent.contacts.map((c) => (
            <div className="adm-row" key={c.id}>
              <div><strong>{c.name}</strong><div className="adm-muted small">{c.organization} · {fmtDate(c.createdAt)}</div></div>
              <Badge value={c.status} />
            </div>
          ))}
          {!data.recent.contacts.length && <p className="adm-muted">Nothing yet.</p>}
        </div>
      </div>
    </>
  );
}

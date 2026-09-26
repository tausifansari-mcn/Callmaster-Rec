import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { publicApi } from '../../api/public.js';
import { API_BASE } from '../../api/http.js';
import ResourcePage from '../components/ResourcePage.jsx';
import { Fields } from '../components/SchemaForm.jsx';
import SettingsEditor from '../components/SettingsEditor.jsx';
import { Badge, ErrorNote, KV, Loading, Modal, PageHeader, fmtDate, inr } from '../components/ui.jsx';
import { useToast } from '../AdminContext.jsx';
import { TriageForm } from './ResourceScreens.jsx';

const fmtSize = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);

// ---------------------------------------------------------------- cancellations
const CANCEL_STATUSES = ['requested', 'approved', 'refunded', 'rejected'];

function CancellationDetail({ item: c, onClose, onChanged, onDeleted }) {
  return (
    <Modal title={`Cancellation — ${c.orderRef}`} onClose={onClose}>
      <dl className="adm-kvs">
        <KV label="Received">{fmtDate(c.createdAt)}</KV>
        <KV label="Order ID">{c.orderRef}</KV>
        <KV label="Email given"><a href={`mailto:${c.email}`}>{c.email}</a></KV>
        <KV label="Came from">{c.source === 'page' ? 'Cancellation form on the site' : c.source === 'checkout' ? 'Checkout success screen' : 'Customer dashboard'}</KV>
        <KV label="Matched an order">{c.matched ? 'Yes' : 'No — order ID and email did not match any order'}</KV>
        <KV label="Inside the cancellation window">{c.matched ? (c.eligible ? 'Yes' : 'No — outside the window, or not a paid Cloud Telephony order') : '—'}</KV>
        <KV label="Refund due">{c.refundAmount ? inr(c.refundAmount) : '—'}</KV>
      </dl>
      <p className="adm-muted small">
        <b>Approved</b> marks the order cancelled. <b>Refunded</b> means you have paid the money back (do that from your Razorpay dashboard) — it marks the order refunded and closes the request.
      </p>
      <TriageForm key={`${c.status}|${c.notes}`} resource="cancellations" item={c} statuses={CANCEL_STATUSES} onChanged={onChanged} onDeleted={onDeleted} />
    </Modal>
  );
}

export const CancellationsScreen = () => (
  <ResourcePage
    resource="cancellations"
    title="Cancellations & refunds"
    subtitle="Cloud Telephony cancellation requests. Requests from the site form wait here for review; cancellations made from the checkout screen or a customer dashboard are approved automatically and just need the refund paying."
    searchPlaceholder="Search order ID or email…"
    filters={[{ param: 'status', label: 'Status', options: CANCEL_STATUSES }, { param: 'source', label: 'Source', options: ['page', 'checkout', 'dashboard'] }]}
    columns={[
      { label: 'Date', render: (c) => fmtDate(c.createdAt) },
      { label: 'Order', render: (c) => <><strong>{c.orderRef}</strong><div className="adm-muted small">{c.email}</div></> },
      { label: 'Refund', render: (c) => (c.refundAmount ? <span className="num">{inr(c.refundAmount)}</span> : '—') },
      { label: 'Check', render: (c) => (!c.matched ? <Badge value="failed" label="no match" /> : c.eligible ? <Badge value="paid" label="in window" /> : <Badge value="cancelled" label="outside window" />) },
      { label: 'Status', render: (c) => <Badge value={c.status === 'requested' ? 'pending' : c.status === 'approved' ? 'paid' : c.status === 'refunded' ? 'refunded' : 'cancelled'} label={c.status} /> },
    ]}
    Detail={CancellationDetail}
  />
);

// ---------------------------------------------------------------- white-paper downloads (leads)
const WP_LEAD_STATUSES = ['new', 'contacted', 'closed'];

function WhitepaperLeadDetail({ item: l, onClose, onChanged, onDeleted }) {
  return (
    <Modal title={`White paper request — ${l.name}`} onClose={onClose}>
      <dl className="adm-kvs">
        <KV label="Received">{fmtDate(l.createdAt)}</KV>
        <KV label="White paper">{l.whitepaper}</KV>
        <KV label="Name">{l.name}</KV>
        <KV label="Work email"><a href={`mailto:${l.email}`}>{l.email}</a></KV>
        <KV label="PDF delivered">{l.delivered ? 'Yes — the link was given' : 'No — no PDF was uploaded at the time (send it to them by email)'}</KV>
      </dl>
      <TriageForm key={`${l.status}|${l.notes}`} resource="whitepaper-leads" item={l} statuses={WP_LEAD_STATUSES} onChanged={onChanged} onDeleted={onDeleted} />
    </Modal>
  );
}

export const WhitepaperLeadsScreen = () => (
  <ResourcePage
    resource="whitepaper-leads"
    title="White paper downloads"
    subtitle="People who left their name and work email to unlock a white paper on the Insights page."
    searchPlaceholder="Search name, email or paper…"
    filters={[{ param: 'status', label: 'Status', options: WP_LEAD_STATUSES }]}
    columns={[
      { label: 'Date', render: (l) => fmtDate(l.createdAt) },
      { label: 'Name', render: (l) => <><strong>{l.name}</strong><div className="adm-muted small">{l.email}</div></> },
      { label: 'White paper', render: (l) => l.whitepaper },
      { label: 'PDF', render: (l) => <Badge value={l.delivered ? 'paid' : 'pending'} label={l.delivered ? 'delivered' : 'not delivered'} /> },
      { label: 'Status', render: (l) => <Badge value={l.status} /> },
    ]}
    Detail={WhitepaperLeadDetail}
  />
);

// ---------------------------------------------------------------- customers
function CustomerDetail({ item: c, onClose, onChanged }) {
  const toast = useToast();
  const [temp, setTemp] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    if (!window.confirm(`Issue a new temporary password for ${c.username}? Their current password stops working immediately.`)) return;
    setBusy(true);
    try {
      const r = await adminApi.resetCustomerPassword(c.id);
      setTemp(r.tempPassword);
      onChanged({ ...c, mustChangePassword: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const toggle = async () => {
    setBusy(true);
    try {
      onChanged(await adminApi.setCustomerActive(c.id, !c.active));
      toast.success(c.active ? 'Account disabled' : 'Account enabled');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Customer — ${c.company || c.username}`} onClose={onClose}>
      <dl className="adm-kvs">
        <KV label="Username">{c.username}</KV>
        <KV label="Company">{c.company}</KV>
        <KV label="Contact">{c.contactName}</KV>
        <KV label="Email"><a href={`mailto:${c.email}`}>{c.email}</a></KV>
        <KV label="Phone">{c.phone}</KV>
        <KV label="Status"><Badge value={c.active ? 'active' : 'disabled'} /></KV>
        <KV label="Password">{c.mustChangePassword ? 'Still the temporary password' : 'Changed by the customer'}</KV>
        <KV label="Last sign-in">{c.lastLoginAt ? fmtDate(c.lastLoginAt) : 'Never'}</KV>
        <KV label="Account created">{fmtDate(c.createdAt)}</KV>
      </dl>
      {temp && (
        <div className="adm-toast" style={{ display: 'block', marginTop: 12 }}>
          New temporary password (shown once — send it to the customer): <b style={{ fontFamily: 'var(--font-mono)' }}>{temp}</b>
        </div>
      )}
      <div className="adm-modal-actions">
        <button type="button" className={`adm-btn${c.active ? ' danger' : ''}`} onClick={toggle} disabled={busy}>{c.active ? 'Disable account' : 'Enable account'}</button>
        <button type="button" className="adm-btn primary" onClick={reset} disabled={busy}>Reset password</button>
      </div>
    </Modal>
  );
}

export const CustomersScreen = () => (
  <ResourcePage
    resource="customers"
    exportable={false}
    title="Customer accounts"
    subtitle="Dashboard logins created automatically when someone buys (they sign in at /account). Passwords are never visible — you can only issue a new temporary one."
    searchPlaceholder="Search username, company, email…"
    columns={[
      { label: 'Company', render: (c) => <><strong>{c.company}</strong><div className="adm-muted small">{c.contactName}</div></> },
      { label: 'Login', render: (c) => <>{c.username}<div className="adm-muted small">{c.email}</div></> },
      { label: 'Last sign-in', render: (c) => (c.lastLoginAt ? fmtDate(c.lastLoginAt) : 'Never') },
      { label: 'Status', render: (c) => <Badge value={c.active ? 'active' : 'disabled'} /> },
    ]}
    Detail={CustomerDetail}
  />
);

// ---------------------------------------------------------------- white papers (the documents themselves)
const WP_FIELDS = [
  { type: 'text', key: 'title', label: 'Title', wide: true },
  { type: 'text', key: 'slug', label: 'Short ID', hint: 'Lowercase letters, numbers and dashes, e.g. my-white-paper' },
  { type: 'textarea', key: 'description', label: 'Short description (shown on the card)', rows: 2 },
  { type: 'number', key: 'order', label: 'Position', step: 1, hint: 'Lower numbers show first' },
  { type: 'boolean', key: 'active', label: 'Visibility', switchLabel: 'Show on the Insights page' },
];
const EMPTY_WP = { title: '', slug: '', description: '', order: 100, active: true };

function WhitepaperForm({ paper, onClose, onSaved }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [v, setV] = useState(paper);
  const [current, setCurrent] = useState(paper);
  const [busy, setBusy] = useState(false);
  const isNew = !current.id;

  const save = async () => {
    setBusy(true);
    try {
      const body = { title: v.title, slug: v.slug, description: v.description, order: Number(v.order) || 0, active: v.active };
      const saved = isNew ? await adminApi.createWhitepaper(body) : await adminApi.updateWhitepaper(current.id, body);
      toast.success('Saved');
      setCurrent(saved);
      setV(saved);
      onSaved(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const saved = await adminApi.uploadWhitepaperPdf(current.id, file);
      setCurrent(saved);
      toast.success('PDF uploaded — it is live on the site now');
      onSaved(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const removePdf = async () => {
    if (!window.confirm('Remove the PDF? Visitors can still request the paper, but will be told it is being finalised.')) return;
    setBusy(true);
    try {
      setCurrent(await adminApi.removeWhitepaperPdf(current.id));
      onSaved(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'New white paper' : `Edit — ${current.title}`}
      onClose={() => onSaved(true)}
      footer={(
        <>
          <button type="button" className="adm-btn" onClick={() => onSaved(true)}>Close</button>
          <button type="button" className="adm-btn primary" onClick={save} disabled={busy}>{busy ? 'Working…' : 'Save details'}</button>
        </>
      )}
    >
      <Fields fields={WP_FIELDS} value={v} onChange={setV} />
      <h4 className="adm-subhead">PDF file</h4>
      {isNew ? (
        <p className="adm-muted small">Save the details first, then upload the PDF.</p>
      ) : (
        <>
          <p className="adm-muted small" style={{ marginTop: 0 }}>
            {current.file
              ? <>Current file: <b>{current.file.originalName}</b> ({fmtSize(current.file.size)}). Uploading a new one replaces it.</>
              : 'No PDF uploaded yet. Until you upload one, visitors who request this paper are saved as leads and told it is being finalised.'}
          </p>
          <div className="adm-modal-actions" style={{ justifyContent: 'flex-start' }}>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={(e) => upload(e.target.files[0])} disabled={busy} />
            {current.file && <button type="button" className="adm-btn danger" onClick={removePdf} disabled={busy}>Remove PDF</button>}
          </div>
        </>
      )}
    </Modal>
  );
}

export function WhitepapersScreen() {
  const toast = useToast();
  const [papers, setPapers] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setPapers((await adminApi.whitepapers()).items); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.title}” and its PDF? People who already requested it stay in the downloads list.`)) return;
    try { await adminApi.deleteWhitepaper(p.id); toast.success('Deleted'); load(); } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        title="White papers"
        subtitle="The papers offered on the Insights page. Upload a PDF for each — visitors get it after leaving their name and work email."
        actions={<button type="button" className="adm-btn primary" onClick={() => setEditing(EMPTY_WP)}>+ New white paper</button>}
      />
      <ErrorNote error={error} onRetry={load} />
      {!papers && !error && <Loading />}
      {papers && (
        <div className="adm-card flush">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Title</th><th>PDF</th><th>Downloads</th><th>Visible</th><th /></tr></thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong><div className="adm-muted small">{p.description}</div></td>
                    <td>{p.file ? <>{p.file.originalName}<div className="adm-muted small">{fmtSize(p.file.size)}</div></> : <Badge value="pending" label="not uploaded" />}</td>
                    <td>{p.downloadCount}</td>
                    <td><Badge value={p.active ? 'active' : 'disabled'} label={p.active ? 'shown' : 'hidden'} /></td>
                    <td className="adm-row-actions">
                      <button type="button" className="adm-btn small" onClick={() => setEditing(p)}>Edit / upload</button>
                      <button type="button" className="adm-btn small danger" onClick={() => remove(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!papers.length && <tr><td colSpan={5} className="adm-empty-cell">No white papers.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <WhitepaperForm key={editing.id || 'new'} paper={editing} onClose={() => setEditing(null)} onSaved={(close) => { load(); if (close) setEditing(null); }} />}
    </>
  );
}

// ---------------------------------------------------------------- Insights page copy
export const InsightsContentScreen = () => (
  <SettingsEditor
    settingKey="insights"
    title="Insights & Resources page"
    subtitle="The articles and the copy around the white papers. The papers themselves (and their PDFs) are managed under “White papers”."
    previewPath="/insights"
    fields={[
      { type: 'text', key: 'eyebrow', label: 'Small heading above the title' },
      { type: 'text', key: 'title', label: 'Page title', wide: true },
      { type: 'textarea', key: 'sub', label: 'Intro paragraph', rows: 3 },
      { type: 'text', key: 'articlesHeading', label: 'Articles heading' },
      {
        type: 'list', key: 'articles', label: 'Articles', addLabel: 'Add article', confirmRemove: 'Remove this article?',
        itemTitle: (a) => a.title || 'New article',
        newItem: () => ({ tag: 'OPERATIONS', title: '', body: '' }),
        fields: [
          { type: 'text', key: 'tag', label: 'Category label', placeholder: 'OPERATIONS' },
          { type: 'text', key: 'title', label: 'Title', wide: true },
          { type: 'textarea', key: 'body', label: 'Text (shown when the visitor clicks “Read the piece”)', rows: 8 },
        ],
      },
      { type: 'text', key: 'whitepapersHeading', label: 'White papers heading' },
      { type: 'textarea', key: 'whitepapersSub', label: 'White papers intro', rows: 2 },
      { type: 'textarea', key: 'gateNote', label: 'Note under the download forms', rows: 2, hint: 'Keep this accurate: we save the name and work email that visitors enter.' },
    ]}
  />
);

// ---------------------------------------------------------------- logo (used on the Site settings screen)
export function LogoCard() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null); // null = loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    publicApi.config().then((c) => setLogoFile(c.site.logoFile || '')).catch(() => setLogoFile(''));
  }, []);

  const src = logoFile ? `${API_BASE}/public/branding/logo?v=${encodeURIComponent(logoFile)}` : '';

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await adminApi.uploadLogo(file);
      setLogoFile(r.logoFile);
      toast.success('Logo updated — it shows in the header, footer and browser tab');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const remove = async () => {
    if (!window.confirm('Remove the logo? The header goes back to the text brand name.')) return;
    setBusy(true);
    try {
      await adminApi.deleteLogo();
      setLogoFile('');
      toast.success('Logo removed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-card">
      <h3 className="adm-card-title">Logo</h3>
      <p className="adm-muted small" style={{ marginTop: -6 }}>
        Shown in the header, the footer and as the browser-tab icon. PNG, JPG, WebP or GIF, up to 2 MB — a wide logo on a transparent or dark background works best. Uploading applies immediately (no need to press Save below).
      </p>
      {src && <div style={{ background: '#0d1017', border: '1px solid var(--border, #2a2f3a)', borderRadius: 8, padding: 14, display: 'inline-block', marginBottom: 12 }}><img src={src} alt="Current logo" style={{ height: 72, width: 'auto', display: 'block' }} /></div>}
      {logoFile === '' && <p className="adm-muted small">No logo uploaded — the header shows the brand name as text.</p>}
      <div className="adm-modal-actions" style={{ justifyContent: 'flex-start' }}>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => upload(e.target.files[0])} disabled={busy} />
        {logoFile && <button type="button" className="adm-btn danger" onClick={remove} disabled={busy}>Remove logo</button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- booked calls
const APPT_STATUSES = ['booked', 'confirmed', 'completed', 'cancelled', 'no_show'];

function AppointmentDetail({ item: a, onClose, onChanged, onDeleted }) {
  return (
    <Modal title={`Call with ${a.name}`} onClose={onClose}>
      <dl className="adm-kvs">
        <KV label="Call time">{a.slotLabel}</KV>
        <KV label="Name">{a.name}</KV>
        <KV label="Organization">{a.organization}</KV>
        <KV label="Email"><a href={`mailto:${a.email}`}>{a.email}</a></KV>
        <KV label="Phone"><a href={`tel:${a.phone}`}>{a.phone}</a></KV>
        <KV label="Booked from">{a.source === 'home' ? 'Home page' : 'Contact page'}</KV>
        <KV label="Booked on">{fmtDate(a.createdAt)}</KV>
      </dl>
      <p className="adm-muted small">Setting the status to <b>cancelled</b> frees the slot so someone else can book it.</p>
      <TriageForm key={`${a.status}|${a.notes}`} resource="appointments" item={a} statuses={APPT_STATUSES} onChanged={onChanged} onDeleted={onDeleted} />
    </Modal>
  );
}

const apptTone = { booked: 'pending', confirmed: 'paid', completed: 'fulfilled', cancelled: 'cancelled', no_show: 'failed' };

export const AppointmentsScreen = () => (
  <ResourcePage
    resource="appointments"
    title="Booked calls"
    subtitle="Calls booked from the Home and Contact pages (times are IST). Each booking emails the visitor a confirmation with a calendar invite and notifies your team."
    searchPlaceholder="Search name, organization, email, phone…"
    filters={[{ param: 'status', label: 'Status', options: APPT_STATUSES }, { param: 'source', label: 'From', options: ['home', 'contact'] }]}
    columns={[
      { label: 'Call time', render: (a) => <strong>{a.slotLabel}</strong> },
      { label: 'Person', render: (a) => <>{a.name}<div className="adm-muted small">{a.organization}</div></> },
      { label: 'Contact', render: (a) => <>{a.email}<div className="adm-muted small">{a.phone}</div></> },
      { label: 'From', render: (a) => (a.source === 'home' ? 'Home' : 'Contact') },
      { label: 'Status', render: (a) => <Badge value={apptTone[a.status]} label={a.status.replace('_', ' ')} /> },
    ]}
    Detail={AppointmentDetail}
  />
);

// ---------------------------------------------------------------- home hero video (used on the Home page screen)
export function HeroVideoCard() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null); // null = loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    publicApi.config().then((c) => setFile(c.home.heroVideoFile || '')).catch(() => setFile(''));
  }, []);

  const src = file ? `${API_BASE}/public/branding/hero-video?v=${encodeURIComponent(file)}` : '';

  const upload = async (f) => {
    if (!f) return;
    setBusy(true);
    try {
      const r = await adminApi.uploadHeroVideo(f);
      setFile(r.heroVideoFile);
      toast.success('Hero video updated — it plays behind the Home page headline');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const remove = async () => {
    if (!window.confirm('Remove the hero video? The Home page hero goes back to a plain dark background.')) return;
    setBusy(true);
    try {
      await adminApi.deleteHeroVideo();
      setFile('');
      toast.success('Hero video removed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-card">
      <h3 className="adm-card-title">Hero background video</h3>
      <p className="adm-muted small" style={{ marginTop: -6 }}>
        Plays muted and looping behind the Home page headline. MP4 (H.264), WebM or MOV, up to 80 MB — keep it short (10–20 s) and compressed so the page stays fast. Uploading applies immediately (no need to press Save below).
      </p>
      {src && <video key={src} src={src} controls muted style={{ width: '100%', maxWidth: 420, borderRadius: 8, marginBottom: 12, display: 'block' }} />}
      {file === '' && <p className="adm-muted small">No video uploaded — the hero shows a plain dark background behind the headline.</p>}
      <div className="adm-modal-actions" style={{ justifyContent: 'flex-start' }}>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => upload(e.target.files[0])} disabled={busy} />
        {file && <button type="button" className="adm-btn danger" onClick={remove} disabled={busy}>Remove video</button>}
      </div>
    </div>
  );
}

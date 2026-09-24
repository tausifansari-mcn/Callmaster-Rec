import { useEffect, useState } from 'react';
import AuditReport from '../../components/audit/AuditReport.jsx';
import { adminApi } from '../../api/admin.js';
import ResourcePage from '../components/ResourcePage.jsx';
import { Badge, KV, Modal, fmtDate, inr } from '../components/ui.jsx';
import { useToast } from '../AdminContext.jsx';

/** Status + internal notes editor shared by orders, leads and contact messages. */
export function TriageForm({ resource, item, statuses, onChanged, onDeleted, deleteLabel = 'Delete' }) {
  const toast = useToast();
  const [status, setStatus] = useState(item.status);
  const [notes, setNotes] = useState(item.notes || '');
  const [busy, setBusy] = useState(false);
  const dirty = status !== item.status || notes !== (item.notes || '');

  const save = async () => {
    setBusy(true);
    try {
      onChanged(await adminApi.update(resource, item.id, { status, notes }));
      toast.success('Saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!window.confirm('Delete this record permanently? This cannot be undone.')) return;
    try {
      await adminApi.remove(resource, item.id);
      toast.success('Deleted');
      onDeleted();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="adm-triage">
      <div className="adm-fields">
        <div className="adm-field">
          <label className="adm-label">Status</label>
          <select className="adm-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="adm-field full">
          <label className="adm-label">Internal notes</label>
          <textarea className="adm-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only visible to admins" />
        </div>
      </div>
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn danger" onClick={remove}>{deleteLabel}</button>
        <button type="button" className="adm-btn primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- orders
const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded', 'failed'];

function OrderDetail({ item: o, onClose, onChanged, onDeleted }) {
  const toast = useToast();
  const downloadSow = async () => {
    try { await adminApi.downloadFile('sow', o.scopeOfWork.storedName, o.scopeOfWork.originalName); } catch (err) { toast.error(err.message); }
  };
  return (
    <Modal title={`Order ${o.orderId}`} onClose={onClose} wide>
      <div className="adm-cols">
        <dl className="adm-kvs">
          <KV label="Status"><Badge value={o.status} /></KV>
          <KV label="Placed">{fmtDate(o.createdAt)}</KV>
          <KV label="Product">{o.product} — {o.plan}</KV>
          <KV label="Payment">{o.payment?.mode}{o.payment?.paidAt ? ` · paid ${fmtDate(o.payment.paidAt)}` : ''}</KV>
          {o.payment?.razorpayPaymentId && <KV label="Razorpay payment ID">{o.payment.razorpayPaymentId}</KV>}
        </dl>
        <dl className="adm-kvs">
          <KV label="Company">{o.customer.company}</KV>
          <KV label="Contact">{o.customer.contact}</KV>
          <KV label="Email"><a href={`mailto:${o.customer.email}`}>{o.customer.email}</a></KV>
          <KV label="Phone">{o.customer.phone}</KV>
          <KV label="GST number">{o.customer.gstNumber}</KV>
          {o.scopeOfWork?.storedName && <KV label="Scope of Work"><button type="button" className="link-btn" onClick={downloadSow}>{o.scopeOfWork.originalName}</button></KV>}
        </dl>
      </div>

      <h4 className="adm-subhead">Order summary</h4>
      <table className="adm-table compact">
        <tbody>
          {o.mode === 'cart'
            ? o.rows.map((r) => <tr key={r.label}><td>{r.label}{r.sub && <span className="adm-muted"> ({r.sub})</span>}</td><td className="num">{inr(r.value)}</td></tr>)
            : <>
                <tr><td>{o.product} — {o.plan}</td><td className="num">{inr(o.unitPrice)}{o.unit}</td></tr>
                <tr><td>{o.qtyLabel || 'Quantity'}</td><td className="num">{o.qty}</td></tr>
              </>}
          <tr><td>Subtotal</td><td className="num">{inr(o.subtotal)}</td></tr>
          {o.discountAmount > 0 && <tr><td>Discount ({o.discountCode}, {o.discountPct}%)</td><td className="num">−{inr(o.discountAmount)}</td></tr>}
          <tr><td>GST ({o.gstRate}%)</td><td className="num">{inr(o.gst)}</td></tr>
          <tr className="total"><td>Total</td><td className="num">{inr(o.total)}</td></tr>
        </tbody>
      </table>
      {o.billingNote && <p className="adm-muted small">{o.billingNote}</p>}

      <h4 className="adm-subhead">Fulfilment</h4>
      <TriageForm resource="orders" item={o} statuses={ORDER_STATUSES} onChanged={onChanged} onDeleted={onDeleted} />
    </Modal>
  );
}

export const OrdersScreen = () => (
  <ResourcePage
    resource="orders"
    title="Orders"
    subtitle="Self-serve purchases. Paid orders need provisioning — mark them fulfilled when done."
    searchPlaceholder="Search order ID, company, email, phone…"
    filters={[
      { param: 'status', label: 'Status', options: ORDER_STATUSES },
      { param: 'product', label: 'Product', options: ['cloud-telephony', 'dialers', 'voice-bot', 'email-automation', 'whatsapp-api'] },
    ]}
    columns={[
      { label: 'Order', render: (o) => <strong>{o.orderId}</strong> },
      { label: 'Date', render: (o) => fmtDate(o.createdAt) },
      { label: 'Product', render: (o) => <>{o.product}<div className="adm-muted small">{o.plan}</div></> },
      { label: 'Customer', render: (o) => <>{o.customer.company}<div className="adm-muted small">{o.customer.email}</div></> },
      { label: 'Total', render: (o) => <span className="num">{inr(o.total)}</span> },
      { label: 'Status', render: (o) => <Badge value={o.status} /> },
    ]}
    Detail={OrderDetail}
  />
);

// ---------------------------------------------------------------- leads
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed'];

function LeadDetail({ item: l, onClose, onChanged, onDeleted }) {
  return (
    <Modal title={`Pricing request — ${l.name}`} onClose={onClose}>
      <dl className="adm-kvs">
        <KV label="Received">{fmtDate(l.createdAt)}</KV>
        <KV label="Name">{l.name}</KV>
        <KV label="Organization">{l.organization}</KV>
        <KV label="Email"><a href={`mailto:${l.email}`}>{l.email}</a></KV>
        <KV label="Phone">{l.phone}</KV>
        <KV label="Call type">{l.callType}</KV>
        <KV label="Monthly volume">{l.monthlyVolume}</KV>
        <KV label="Current QA setup">{l.qaSetup}</KV>
      </dl>
      <TriageForm resource="leads" item={l} statuses={LEAD_STATUSES} onChanged={onChanged} onDeleted={onDeleted} />
    </Modal>
  );
}

export const LeadsScreen = () => (
  <ResourcePage
    resource="leads"
    title="Pricing requests"
    subtitle="Leads from the “Deep Customer Insights — pricing request” form. Reply with volume-based pricing."
    searchPlaceholder="Search name, organization, email, phone…"
    filters={[{ param: 'status', label: 'Status', options: LEAD_STATUSES }]}
    columns={[
      { label: 'Date', render: (l) => fmtDate(l.createdAt) },
      { label: 'Name', render: (l) => <><strong>{l.name}</strong><div className="adm-muted small">{l.organization}</div></> },
      { label: 'Contact', render: (l) => <>{l.email}<div className="adm-muted small">{l.phone}</div></> },
      { label: 'Volume', render: (l) => <>{l.monthlyVolume}<div className="adm-muted small">{l.callType}</div></> },
      { label: 'Status', render: (l) => <Badge value={l.status} /> },
    ]}
    Detail={LeadDetail}
  />
);

// ---------------------------------------------------------------- contacts
const CONTACT_STATUSES = ['new', 'read', 'replied', 'closed'];

/** Sends an email reply to the person who wrote in (via the SMTP settings) and marks the message as replied. */
function ReplyBox({ contact, onChanged }) {
  const toast = useToast();
  const [subject, setSubject] = useState(`Re: your enquiry (${contact.interest || 'CallMaster'})`);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      onChanged(await adminApi.replyContact(contact.id, subject, message));
      setMessage('');
      toast.success(`Reply sent to ${contact.email}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h4 className="adm-subhead">Reply by email</h4>
      <div className="adm-fields">
        <div className="adm-field full"><label className="adm-label">To</label><input className="adm-input" value={contact.email} readOnly /></div>
        <div className="adm-field full"><label className="adm-label">Subject</label><input className="adm-input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="adm-field full"><label className="adm-label">Message</label><textarea className="adm-input" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi ${contact.name},`} /></div>
      </div>
      {error && <div className="adm-error" style={{ marginTop: 10 }}>{error}</div>}
      <div className="adm-modal-actions" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="adm-btn primary" onClick={send} disabled={busy || !message.trim() || !subject.trim()}>{busy ? 'Sending…' : 'Send reply'}</button>
      </div>
    </>
  );
}

function ContactDetail({ item: c, onClose, onChanged, onDeleted }) {
  return (
    <Modal title={`Message from ${c.name}`} onClose={onClose}>
      <dl className="adm-kvs">
        <KV label="Received">{fmtDate(c.createdAt)}</KV>
        <KV label="Name">{c.name}</KV>
        <KV label="Organization">{c.organization}</KV>
        <KV label="Email"><a href={`mailto:${c.email}`}>{c.email}</a></KV>
        <KV label="Phone">{c.phone}</KV>
        <KV label="Interested in">{c.interest}</KV>
      </dl>
      <h4 className="adm-subhead">Message</h4>
      <p className="adm-message">{c.message || <span className="adm-muted">(no message)</span>}</p>
      <ReplyBox contact={c} onChanged={onChanged} />
      <h4 className="adm-subhead">Status & notes</h4>
      <TriageForm key={`${c.status}|${c.notes}`} resource="contacts" item={c} statuses={CONTACT_STATUSES} onChanged={onChanged} onDeleted={onDeleted} />
    </Modal>
  );
}

export const ContactsScreen = () => (
  <ResourcePage
    resource="contacts"
    title="Contact messages"
    subtitle="Submissions from the Contact page."
    searchPlaceholder="Search name, email, phone, message…"
    filters={[{ param: 'status', label: 'Status', options: CONTACT_STATUSES }]}
    columns={[
      { label: 'Date', render: (c) => fmtDate(c.createdAt) },
      { label: 'Name', render: (c) => <><strong>{c.name}</strong><div className="adm-muted small">{c.organization}</div></> },
      { label: 'Contact', render: (c) => <>{c.email}<div className="adm-muted small">{c.phone}</div></> },
      { label: 'Interest', render: (c) => c.interest },
      { label: 'Message', render: (c) => <span className="adm-clip">{c.message || '—'}</span> },
      { label: 'Status', render: (c) => <Badge value={c.status} /> },
    ]}
    Detail={ContactDetail}
  />
);

// ---------------------------------------------------------------- demos
const fmtBytes = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);
const fmtDuration = (sec) => (sec ? `${Math.floor(sec / 60)}m ${String(Math.round(sec % 60)).padStart(2, '0')}s` : '—');

/** Plays the stored recording in the panel (the file route needs the admin token, so it is fetched into a blob URL). */
function RecordingPlayer({ file }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let url = '';
    let alive = true;
    adminApi.fileObjectUrl('audio', file.storedName)
      .then((u) => { url = u; if (alive) setSrc(u); })
      .catch((err) => alive && setError(err.message));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [file.storedName]);
  if (error) return <p className="adm-muted small">Recording unavailable: {error}</p>;
  if (!src) return <p className="adm-muted small">Loading recording…</p>;
  return <audio controls src={src} style={{ width: '100%' }} preload="metadata" />;
}

function DemoDetail({ item, onClose, onDeleted }) {
  const toast = useToast();
  const [d, setD] = useState(item);
  // The list omits the (large) transcript — load the full record when the panel opens.
  useEffect(() => {
    let alive = true;
    adminApi.get('demos', item.id).then((full) => alive && setD(full)).catch(() => {});
    return () => { alive = false; };
  }, [item.id]);

  const downloadAudio = async () => {
    try { await adminApi.downloadFile('audio', d.file.storedName, d.file.originalName); } catch (err) { toast.error(err.message); }
  };
  const remove = async () => {
    const msg = d.type === 'voice'
      ? 'Delete this demo record? The phone number will be able to run the free demo again.'
      : 'Delete this demo record and its uploaded recording?';
    if (!window.confirm(msg)) return;
    try { await adminApi.remove('demos', d.id); toast.success('Deleted'); onDeleted(); } catch (err) { toast.error(err.message); }
  };
  const r = d.results;
  const technical = d.auditError ? d.auditError.split('\n---\n')[1] || d.auditError : '';
  return (
    <Modal title={`${d.type === 'voice' ? 'Voice Bot demo' : 'Insights audit'} — ${d.name}`} onClose={onClose} wide>
      <dl className="adm-kvs">
        <KV label="Run at">{fmtDate(d.createdAt)}</KV>
        <KV label="Name">{d.name}</KV>
        <KV label="Organization">{d.company}</KV>
        <KV label="Email"><a href={`mailto:${d.email}`}>{d.email}</a></KV>
        {d.type === 'voice' ? (
          <>
            <KV label="Phone">{d.phone}</KV>
            <KV label="Bot">{d.language}, {d.gender} voice, {d.callType}</KV>
            <KV label="Industry">{d.industry}</KV>
            <KV label="Call">{d.callStatus}</KV>
          </>
        ) : (
          <>
            <KV label="Line of business">{d.lob} · {d.framework}</KV>
            <KV label="Audit status"><Badge value={d.auditStatus === 'completed' ? 'paid' : d.auditStatus === 'failed' ? 'failed' : d.auditStatus === 'registered' ? 'new' : 'pending'} label={d.auditStatus === 'registered' ? 'signed up — no call yet' : d.auditStatus || 'n/a'} />{d.auditStage ? ` (${d.auditStage})` : ''}</KV>
            {technical && <KV label="Failure detail"><span className="adm-muted">{technical}</span></KV>}
            <KV label="Score">{r ? `${r.score}/100 · ${r.bandLabel}${r.mock ? ' (sandbox sample)' : ''}` : '—'}</KV>
            <KV label="Recording">
              {d.file?.storedName
                ? <button type="button" className="link-btn" onClick={downloadAudio}>{d.file.originalName}</button>
                : (d.file?.originalName ? `${d.file.originalName} (deleted after retention window)` : '—')}
            </KV>
          </>
        )}
      </dl>
      {d.type === 'audit' && (
        <>
          <h4 className="adm-subhead">Call details</h4>
          <dl className="adm-kvs">
            <KV label="Submitted by">{d.name} · {d.company} · {d.email}</KV>
            <KV label="Recording file">{d.file?.originalName ? `${d.file.originalName}${d.file.size ? ` · ${fmtBytes(d.file.size)}` : ''}` : '—'}</KV>
            <KV label="Line of business / framework">{d.lob ? `${d.lob} · ${d.framework}` : '—'}</KV>
            <KV label="Call length">{fmtDuration(r?.call?.durationSec ?? d.transcript?.durationSec)}</KV>
            <KV label="Language(s) heard">{(r?.call?.languages || d.transcript?.languages || []).join(', ') || '—'}</KV>
            <KV label="Speakers / turns / words">{r?.call ? `${r.call.speakers} speakers · ${r.call.turns} turns · ${r.call.words} words` : '—'}</KV>
            <KV label="Talk share">{r?.call ? `Agent ${r.call.agentTalkPct}% · Customer ${r.call.customerTalkPct}%` : '—'}</KV>
            <KV label="Transcribed by">{r ? (r.mock ? 'Sample data (no Deepgram key was configured)' : 'Deepgram') : '—'}</KV>
            <KV label="Audited by">{r ? (r.mock ? 'Sample data (no Anthropic key was configured)' : (r.model || 'Claude')) : '—'}</KV>
          </dl>
          {d.file?.storedName && (
            <>
              <h4 className="adm-subhead">Call recording</h4>
              <RecordingPlayer file={d.file} />
            </>
          )}
          {!d.file?.storedName && d.file?.originalName && <p className="adm-muted small">The recording was deleted after the retention window.</p>}
        </>
      )}
      {d.type === 'audit' && r && (
        <div className="ar-narrow"><AuditReport results={r} transcript={d.transcript} admin /></div>
      )}
      {d.type === 'audit' && (r || d.transcript) && (
        <>
          <h4 className="adm-subhead">Full audit data</h4>
          <details className="transcript">
            <summary>Show the raw stored data (audit result + transcript, JSON)</summary>
            <pre className="adm-json">{JSON.stringify({ results: r, transcript: d.transcript }, null, 2)}</pre>
          </details>
          <div className="adm-modal-actions" style={{ justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ id: d.id, submittedAt: d.createdAt, name: d.name, company: d.company, email: d.email, lob: d.lob, framework: d.framework, file: d.file, results: r, transcript: d.transcript }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `audit-${d.id}.json`;
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
              }}
            >Download audit as JSON</button>
          </div>
        </>
      )}
      <div className="adm-modal-actions">
        <button type="button" className="adm-btn danger" onClick={remove}>{d.type === 'voice' ? 'Delete / reset trial' : 'Delete'}</button>
      </div>
    </Modal>
  );
}

export const DemosScreen = () => (
  <ResourcePage
    resource="demos"
    title="Demo activity"
    subtitle="Insights demo uploads and Voice Bot demo calls. Recordings are removed automatically after the retention period."
    searchPlaceholder="Search name, company, email, phone…"
    filters={[{ param: 'type', label: 'Type', options: ['audit', 'voice'] }]}
    columns={[
      { label: 'Date', render: (d) => fmtDate(d.createdAt) },
      { label: 'Type', render: (d) => <Badge value={d.type} label={d.type === 'voice' ? 'Voice Bot' : 'Insights'} /> },
      { label: 'Person', render: (d) => <><strong>{d.name}</strong><div className="adm-muted small">{d.company}</div></> },
      { label: 'Contact', render: (d) => <>{d.email}<div className="adm-muted small">{d.phone || ''}</div></> },
      { label: 'Details', render: (d) => (d.type === 'voice' ? (d.callStatus === 'registered' ? `Signed up — call not placed yet (${d.language} · ${d.callType})` : `${d.language} · ${d.callType}`) : (d.auditStatus === 'registered' ? 'Signed up — no call uploaded yet' : `${d.lob} · ${d.auditStatus === 'processing' ? 'processing…' : d.auditStatus === 'failed' ? 'failed' : `score ${d.results?.score ?? '—'}`}`)) },
    ]}
    Detail={DemoDetail}
  />
);

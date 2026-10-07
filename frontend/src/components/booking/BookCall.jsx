import { useEffect, useMemo, useState } from 'react';
import { publicApi } from '../../api/public.js';
import { useSite } from '../../context/SiteContext.jsx';
import Field from '../ui/Field.jsx';
import { PHONE_RE, isOfficialEmail } from '../../utils/validators.js';

const EMPTY = { name: '', organization: '', email: '', phone: '' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
/** Monday-first day-of-week (0=Mon … 6=Sun) for a Y-M-D date, computed without relying on the browser's own timezone. */
const dowMon = (y, m, d) => (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;

function istToday() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: +o.year, m: +o.month, d: +o.day };
}

/**
 * "Book a call directly": a month calendar (available / closed / holiday days, server-authoritative), then pick a
 * time (taken ones greyed out), leave your details, and the booking is saved for the sales team (plus a
 * confirmation email with a calendar invite). `source` = 'home' | 'contact'.
 */
export default function BookCall({ source, heading, sub }) {
  const { site } = useSite();
  const holidays = site.bookingHolidays || {};
  const today = useMemo(istToday, []);
  const [slots, setSlots] = useState(null); // { days: [{ date, label, times: [{ time, available }] }] }
  const [loadError, setLoadError] = useState('');
  const [cal, setCal] = useState({ y: today.y, m: today.m });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const load = () => publicApi.appointmentSlots().then(setSlots).catch((err) => setLoadError(err.message));
  useEffect(() => { load(); }, []);

  const byDate = useMemo(() => Object.fromEntries((slots?.days || []).map((d) => [d.date, d])), [slots]);
  const lastBookable = slots?.days?.length ? slots.days[slots.days.length - 1].date : null;
  const minKey = today.y * 12 + today.m;
  const maxKey = lastBookable ? (() => { const [y, m] = lastBookable.split('-').map(Number); return y * 12 + m; })() : minKey;
  const visKey = cal.y * 12 + cal.m;

  const day = byDate[date];

  const shiftMonth = (delta) => {
    let m = cal.m + delta; let y = cal.y;
    if (m < 1) { m = 12; y -= 1; } if (m > 12) { m = 1; y += 1; }
    const key = y * 12 + m;
    if (key < minKey || key > maxKey) return;
    setCal({ y, m });
  };

  const pickDate = (key) => {
    if (!byDate[key]) return;
    setDate(key);
    setTime('');
  };

  const submit = async () => {
    const t = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()]));
    const next = {
      name: !t.name && 'Please enter your name.',
      organization: !t.organization && 'Please enter your organization name.',
      email: !isOfficialEmail(t.email) && 'Please use your official work email.',
      phone: !PHONE_RE.test(t.phone) && 'Please enter a valid 10-digit phone number.',
      slot: (!date || !time) && 'Please pick a day and a time above.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setApiError('');
    setBusy(true);
    try {
      setDone(await publicApi.bookAppointment({ ...t, date, time, source }));
    } catch (err) {
      setApiError(err.message);
      if (err.status === 409) { setTime(''); load(); } // that slot went while they were typing — refresh the grid
    } finally {
      setBusy(false);
    }
  };

  const renderGrid = () => {
    const first = dowMon(cal.y, cal.m, 1);
    const daysInMonth = new Date(Date.UTC(cal.y, cal.m, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < first; i += 1) cells.push(<div className="cal-day empty" key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const key = ymd(cal.y, cal.m, d);
      const isToday = key === ymd(today.y, today.m, today.d);
      const isSelected = key === date;
      const avail = Boolean(byDate[key]);
      const holiday = holidays[key];
      const cls = avail ? 'avail' : holiday ? 'holiday' : 'closed';
      cells.push(
        <button
          type="button" key={key}
          className={`cal-day ${cls}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
          disabled={!avail}
          title={holiday ? `Closed — ${holiday}` : avail ? undefined : 'Not available'}
          onClick={() => pickDate(key)}
        >
          {d}
        </button>
      );
    }
    return cells;
  };

  return (
    <div className="lead-form-box" style={{ maxWidth: source === 'home' ? 680 : 'none' }}>
      {heading}
      {sub}
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <div className="pm-success-icon" style={{ margin: '0 auto 14px' }}>✓</div>
          <h3>You're booked.</h3>
          <p className="sub" style={{ margin: '0 0 4px' }}>{done.label} — confirmation sent to {done.email}.</p>
          <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '14px 0 0' }}>
            You'll get a calendar invite at the address above, and our sales team has been notified. Need another time? Reply to the confirmation email.
          </p>
        </div>
      ) : (
        <div>
          {loadError && <div className="field-error-banner">{loadError}</div>}
          {!slots && !loadError && <div className="pm-processing"><div className="pm-spinner" />Loading available times…</div>}
          {slots && (
            <>
              <div className="field">
                <label>Choose a day</label>
                <div className="cal-head">
                  <div className="cal-month">{MONTHS[cal.m - 1]} {cal.y}</div>
                  <div className="cal-nav">
                    <button type="button" aria-label="Previous month" disabled={visKey <= minKey} onClick={() => shiftMonth(-1)}>‹</button>
                    <button type="button" aria-label="Next month" disabled={visKey >= maxKey} onClick={() => shiftMonth(1)}>›</button>
                  </div>
                </div>
                <div className="cal-grid">
                  {WEEKDAYS.map((w) => <div className="cal-dow" key={w}>{w}</div>)}
                  {renderGrid()}
                </div>
                <div className="cal-legend">
                  <span><i style={{ background: 'var(--surface-card)' }} />Available</span>
                  <span><i style={{ background: 'transparent', border: '1px solid var(--border)' }} />Closed (Sundays)</span>
                  <span><i style={{ background: 'var(--accent-live)', borderRadius: '50%' }} />Holiday or festival</span>
                </div>
              </div>
              <div className="field">
                <label>Choose a time (IST)</label>
                <div className="choice-grid">
                  {(day ? day.times : []).map((t) => (
                    <button
                      type="button"
                      key={t.time}
                      disabled={!t.available}
                      className={`choice${time === t.time ? ' selected' : ''}${!t.available ? ' disabled' : ''}`}
                      title={!t.available ? 'Already booked' : undefined}
                      onClick={() => setTime(t.time)}
                    >{t.time}</button>
                  ))}
                </div>
                {!day && <div className="hint">Pick a day on the calendar first to see the times.</div>}
              </div>
              <div className="field-row2">
                <Field label="Name *" error={errors.name}><input type="text" value={v.name} onChange={set('name')} /></Field>
                <Field label="Organization *" error={errors.organization}><input type="text" value={v.organization} onChange={set('organization')} /></Field>
              </div>
              <div className="field-row2">
                <Field label="Official email ID *" error={errors.email}><input type="email" value={v.email} onChange={set('email')} /></Field>
                <Field label="Phone *" error={errors.phone}><input type="tel" value={v.phone} onChange={set('phone')} /></Field>
              </div>
              <Field error={errors.slot} />
              {apiError && <div className="field-error-banner">{apiError}</div>}
              <button type="button" className="btn" style={{ width: '100%' }} onClick={submit} disabled={busy}>{busy ? 'Booking…' : 'Book Appointment'}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

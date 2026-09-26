import { useEffect, useState } from 'react';
import { publicApi } from '../../api/public.js';
import Field from '../ui/Field.jsx';
import { PHONE_RE, isOfficialEmail } from '../../utils/validators.js';

const EMPTY = { name: '', organization: '', email: '', phone: '' };

/**
 * "Book a call directly": pick one of the offered IST slots (taken ones are greyed out), leave your details, and the
 * booking is saved for the sales team (plus a confirmation email with a calendar invite). `source` = 'home' | 'contact'.
 */
export default function BookCall({ source, heading, sub }) {
  const [slots, setSlots] = useState(null); // { days: [{ date, label, times: [{ time, available }] }] }
  const [loadError, setLoadError] = useState('');
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

  const day = slots?.days.find((d) => d.date === date);

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
                <div className="choice-grid">
                  {slots.days.map((d) => (
                    <button type="button" key={d.date} className={`choice${date === d.date ? ' selected' : ''}`} onClick={() => { setDate(d.date); setTime(''); }}>{d.label}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Choose a time (IST)</label>
                <div className="choice-grid">
                  {(day ? day.times : slots.days[0]?.times || []).map((t) => (
                    <button
                      type="button"
                      key={t.time}
                      disabled={!day || !t.available}
                      className={`choice${time === t.time ? ' selected' : ''}${!day || !t.available ? ' disabled' : ''}`}
                      title={day && !t.available ? 'Already booked' : undefined}
                      onClick={() => setTime(t.time)}
                    >{t.time}</button>
                  ))}
                </div>
                {!day && <div className="hint">Pick a day first to see the times.</div>}
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

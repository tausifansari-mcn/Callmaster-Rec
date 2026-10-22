import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import { PHONE_RE, isOfficialEmail } from '../utils/validators.js';

/*
 * Contact (/contact) — the theme's template-contact.php + assets/js/booking.js, ported to React.
 * Left: details form. Right: meeting calendar (Mon–Sat, 11:30–17:30 IST, 30-minute slots, closed Sundays and
 * Indian holidays). Days/times come from the backend (/public/appointments/slots), which also re-checks every booking.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const INTERESTS = ['Quality Audits', 'Voice Bots', 'Cloud Telephony', 'SIP Channels', 'Social Listening', 'All products'];
// The theme's interest labels → the backend's contact-interest values.
const API_INTEREST = { 'Voice Bots': 'Voice Bot', 'All products': 'Enterprise' };
const SLOT_MIN = 30;

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const dowMon = (y, m, d) => (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0=Mon … 6=Sun
const fmtDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return `${WEEKDAYS[dowMon(y, m, d)].slice(0, 3)}, ${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};
/** "11:30 AM" → minutes after midnight, and back. */
const toMins = (label) => {
  const [, h, mm, ap] = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(label.trim()) || [];
  if (!h) return null;
  return ((+h % 12) + (/pm/i.test(ap) ? 12 : 0)) * 60 + +mm;
};
const fmtTime = (mins) => { const h = Math.floor(mins / 60); return `${((h + 11) % 12) + 1}:${pad(mins % 60)} ${h >= 12 ? 'PM' : 'AM'}`; };
const slotRange = (label) => { const t = toMins(label); return t === null ? label : `${fmtTime(t)} – ${fmtTime(t + SLOT_MIN)}`; };

function istToday() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const o = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: +o.year, m: +o.month, d: +o.day };
}

const EMPTY = { name: '', email: '', phone: '', interest: INTERESTS[0], message: '', website: '' };

export default function ContactPage() {
  const { site } = useSite();
  const holidays = site.bookingHolidays || {};
  const [params] = useSearchParams();
  const today = useMemo(istToday, []);
  const todayKey = ymd(today.y, today.m, today.d);

  const [slots, setSlots] = useState(null);
  const [cal, setCal] = useState({ y: today.y, m: today.m });
  const [selDate, setSelDate] = useState(null);
  const [selSlot, setSelSlot] = useState(null);
  const [notice, setNotice] = useState('');
  const [v, setV] = useState(() => {
    const interest = params.get('interest');
    return { ...EMPTY, interest: INTERESTS.includes(interest) ? interest : INTERESTS[0] };
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cbSent, setCbSent] = useState(false);
  const [booked, setBooked] = useState(null);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));
  const planInterest = params.get('interest');

  const load = () => publicApi.appointmentSlots().then(setSlots).catch(() => setSlots((s) => s || { days: [] }));
  useEffect(() => { load(); }, []);

  const byDate = useMemo(() => Object.fromEntries((slots?.days || []).map((d) => [d.date, d])), [slots]);
  const lastBookable = slots?.days?.length ? slots.days[slots.days.length - 1].date : todayKey;
  const [ly, lm] = lastBookable.split('-').map(Number);
  const minKey = today.y * 12 + today.m;
  const maxKey = Math.max(minKey, ly * 12 + lm);
  const visKey = cal.y * 12 + cal.m;

  // Same rules and wording as the theme's booking.js; availability itself is the server's.
  const dayStatus = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    if (key < todayKey) return { ok: false, cls: 'closed', why: 'Past date' };
    if (key > lastBookable) return { ok: false, cls: 'closed', why: 'Not open for booking yet' };
    if (dowMon(y, m, d) === 6) return { ok: false, cls: 'closed', why: 'Closed on Sundays' };
    if (holidays[key]) return { ok: false, cls: 'holiday', why: `Closed for ${holidays[key]}` };
    if (!byDate[key]?.times.some((t) => t.available)) return { ok: false, cls: 'closed', why: 'No slots left this day' };
    return { ok: true, cls: 'avail' };
  };

  const shift = (delta) => {
    let m = cal.m + delta; let y = cal.y;
    if (m < 1) { m = 12; y -= 1; } if (m > 12) { m = 1; y += 1; }
    if (y * 12 + m < minKey || y * 12 + m > maxKey) return;
    setCal({ y, m });
  };
  const pick = (key) => {
    const st = dayStatus(key);
    if (!st.ok) { setNotice(`${fmtDate(key)}: ${st.why}. Please choose another date.`); return; }
    setNotice(''); setSelDate(key); setSelSlot(null);
  };

  const summary = selDate && selSlot !== null ? `${fmtDate(selDate)} · ${slotRange(selSlot)} IST` : '';

  const fields = () => {
    const email = v.email.trim();
    return {
      name: v.name.trim(),
      // The backend's records need an organisation; the theme's form does not ask for one, so it comes from the work email.
      organization: email.split('@')[1] || '',
      email,
      phone: v.phone.replace(/[\s-]/g, '').replace(/^(\+?91)(?=\d{10}$)/, ''),
    };
  };
  const check = (f, nameMsg) => {
    if (!f.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return nameMsg;
    if (!isOfficialEmail(f.email)) return 'Enter your work email. Personal addresses (Gmail, Yahoo, etc.) are not accepted.';
    if (!PHONE_RE.test(f.phone)) return 'Enter a valid 10-digit phone number so we can reach you.';
    return '';
  };

  const bookMeeting = async () => {
    if (busy) return;
    const f = fields();
    const bad = check(f, 'Enter your name and a valid work email.');
    if (bad) { setErr(bad); return; }
    if (!selDate || selSlot === null) { setErr('Pick a date and a time on the calendar first.'); return; }
    if (v.website) return; // honeypot
    setErr(''); setBusy(true);
    try {
      await publicApi.bookAppointment({ ...f, date: selDate, time: selSlot, source: 'contact' });
      setBooked({ when: `${fmtDate(selDate)}, ${slotRange(selSlot)} IST`, who: f.email, topic: v.interest });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (ex) {
      setErr(ex.message || 'Something went wrong. Please try again.');
      setSelSlot(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  const requestCallback = async () => {
    const f = fields();
    const bad = check(f, 'Enter your name and a valid work email so we can call you back.');
    if (bad) { setErr(bad); return; }
    setErr('');
    if (v.website) { setCbSent(true); return; }
    try {
      await publicApi.contact({
        ...f,
        interest: API_INTEREST[v.interest] || v.interest,
        message: `${v.message.trim() ? `${v.message.trim()}\n` : ''}[Callback request, no meeting slot chosen]`,
      });
      setCbSent(true);
    } catch (ex) {
      setErr(ex.message || 'Something went wrong. Please try again.');
    }
  };

  const bookAgain = () => { setSelDate(null); setSelSlot(null); setBooked(null); load(); };

  const first = dowMon(cal.y, cal.m, 1);
  const daysInMonth = new Date(Date.UTC(cal.y, cal.m, 0)).getUTCDate();
  const day = selDate ? byDate[selDate] : null;

  return (
    <div className="tp-ct tp-pure">
      <section id="page-contact" aria-labelledby="contact-title">
        <div className="wrap section">
          <div className="section-head">
            <div className="kicker">Contact</div>
            <h1 id="contact-title">Talk to sales or book a meeting.</h1>
            <p>Pick a 30-minute slot that suits you, or leave your details and we'll call you back. You can also write to <a href="mailto:care@nimantran.ai" style={{ color: 'var(--amber-dark)', fontWeight: 600 }}>care@nimantran.ai</a>.</p>
          </div>

          <div className="contact-grid" id="contactGrid" style={{ display: booked ? 'none' : undefined }}>
            <form className="quote-box" id="contactForm" onSubmit={(e) => e.preventDefault()} noValidate>
              <h2 style={{ fontSize: 22, marginBottom: 18 }}>Your details</h2>
              <div className="field"><label htmlFor="contact_name">Full name</label><input type="text" id="contact_name" autoComplete="name" placeholder="Your name" value={v.name} onChange={set('name')} /></div>
              <div className="field"><label htmlFor="contact_email">Work email</label><input type="email" id="contact_email" autoComplete="email" placeholder="you@company.com" value={v.email} onChange={set('email')} /></div>
              <div className="field"><label htmlFor="contact_phone">Phone</label><input type="tel" id="contact_phone" autoComplete="tel" placeholder="98XXXXXXXX" value={v.phone} onChange={set('phone')} /></div>
              <div className="field"><label htmlFor="contact_interest">What are you interested in?</label>
                <select id="contact_interest" value={v.interest} onChange={set('interest')}>{INTERESTS.map((o) => <option key={o}>{o}</option>)}</select>
              </div>
              <div className="legal-note" id="contact_planNote" style={{ display: planInterest ? 'block' : 'none' }}>
                {planInterest && `Noted — you asked about ${planInterest}. Online payment isn't live yet, so our team will reach out to confirm the plan and set up billing directly.`}
              </div>
              <div className="field"><label htmlFor="contact_message">Anything we should know? <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><textarea id="contact_message" rows={3} placeholder="Call volumes, languages, goals" value={v.message} onChange={set('message')} /></div>
              <div style={{ position: 'absolute', left: -9999 }} aria-hidden="true"><label>Leave blank<input type="text" id="contact_website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></label></div>
              <p id="form_slot" style={{ fontSize: 14, margin: '0 0 14px', color: summary ? 'var(--teal-dark)' : 'var(--muted)', fontWeight: summary ? 700 : 500 }}>
                {summary || 'No time selected yet. Pick a date and time on the calendar.'}
              </p>
              <div className="error-text" id="book_err" role="alert" style={{ marginTop: 0, display: err ? 'block' : 'none' }}>{err}</div>
              <button className="btn btn-primary" style={{ width: '100%' }} type="button" id="bookBtn" disabled={busy} onClick={bookMeeting}>Confirm meeting</button>
              <p className="contact-alt">No time that works? <button type="button" className="link-btn" id="cbBtn" onClick={requestCallback}>Request a callback instead</button></p>
              <div className="quote-success" id="cbSuccess" role="status" style={cbSent ? { display: 'block' } : undefined}>Thanks. We'll call you back within one business day.</div>
            </form>

            <div className="cal-card" aria-label="Meeting calendar">
              <h2>Pick a date and time</h2>
              <p className="cal-sub">30-minute meeting · Monday to Saturday, 11:30 AM – 5:30 PM IST</p>
              <div className="cal-head">
                <div className="cal-month" id="cal_month" aria-live="polite">{MONTHS[cal.m - 1]} {cal.y}</div>
                <div className="cal-nav">
                  <button type="button" id="cal_prev" aria-label="Previous month" disabled={visKey <= minKey} onClick={() => shift(-1)}>&#8249;</button>
                  <button type="button" id="cal_next" aria-label="Next month" disabled={visKey >= maxKey} onClick={() => shift(1)}>&#8250;</button>
                </div>
              </div>
              <div className="cal-grid" id="cal_grid">
                {WEEKDAYS.map((w) => <div className="cal-dow" aria-hidden="true" key={w}>{w.slice(0, 3)}</div>)}
                {Array.from({ length: first }, (_, i) => <div className="cal-day empty" key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const key = ymd(cal.y, cal.m, d);
                  const st = slots ? dayStatus(key) : { ok: false, cls: 'closed', why: '' };
                  const cls = `cal-day ${st.cls}${key === todayKey ? ' today' : ''}${key === selDate ? ' selected' : ''}`;
                  return (
                    <button
                      type="button" key={key} className={cls} data-date={key}
                      aria-label={fmtDate(key) + (st.ok ? '' : `, unavailable. ${st.why}`)}
                      aria-pressed={key === selDate}
                      aria-disabled={st.ok ? undefined : 'true'}
                      title={st.ok ? '' : st.why}
                      onClick={() => slots && pick(key)}
                    >{d}</button>
                  );
                })}
              </div>
              <div className="cal-legend">
                <span><i style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)' }} />Available</span>
                <span><i style={{ background: '#fff', border: '1px solid var(--line-strong)' }} />Closed (Sundays)</span>
                <span><i style={{ background: 'var(--amber)', borderRadius: '50%', width: 6, height: 6, verticalAlign: 2 }} />Holiday or festival</span>
              </div>
              <div className="cal-notice" id="cal_notice" role="status" style={{ display: notice ? 'block' : 'none' }}>{notice}</div>
              <div className="cal-slots" id="cal_slots" style={{ display: selDate ? 'block' : 'none' }}>
                <h3 id="cal_slots_title">{selDate ? `Choose a time on ${fmtDate(selDate)}` : 'Choose a time'}</h3>
                <div className="slot-grid" id="slot_grid">
                  {(day?.times || []).map((t) => (
                    <button
                      type="button" key={t.time}
                      className={`slot${selSlot === t.time ? ' selected' : ''}`}
                      disabled={!t.available}
                      aria-pressed={selSlot === t.time}
                      onClick={() => setSelSlot(t.time)}
                    >{t.time}</button>
                  ))}
                </div>
              </div>
              <div className="cal-summary" id="cal_summary" role="status" style={{ display: summary ? 'block' : 'none' }}>{summary}</div>
              <p className="cal-meta">All times are India Standard Time (UTC+05:30). We're closed on Sundays, Government of India gazetted holidays and major festivals.</p>
            </div>
          </div>

          <div className="book-confirm" id="bookConfirm" style={{ display: booked ? 'block' : 'none' }} role="status">
            <div className="tick"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <h2>You're booked in.</h2>
            <div className="when" id="bookWhen">{booked?.when}</div>
            <p>Topic: <strong id="bookTopic">{booked?.topic}</strong>. We'll email the meeting link to <strong id="bookWho">{booked?.who}</strong> before the call. A calendar invite is attached to your confirmation email.</p>
            <div className="hero-cta" style={{ marginTop: 20 }}>
              <button className="btn btn-outline" type="button" id="bookAgain" onClick={bookAgain}>Book another time</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

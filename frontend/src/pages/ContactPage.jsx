import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import BookCall from '../components/booking/BookCall.jsx';
import Field from '../components/ui/Field.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import { ERR, PHONE_RE, isOfficialEmail } from '../utils/validators.js';

const INTERESTS = ['Deep Customer Insights', 'Voice Bot', 'Cloud Telephony', 'Enterprise'];
const EMPTY = { name: '', organization: '', email: '', phone: '', interest: INTERESTS[0], message: '' };

/** "Direct contact": the care address plus phone and office address, all editable under Admin → Site settings. */
function DirectContact({ site }) {
  const care = site.emails?.care || (site.emails?.hello || '');
  const [phone, ...address] = (site.phoneAddress || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
      {care ? <b style={{ color: 'var(--ink)' }}>{care}</b> : <span className="legal-placeholder">[contact email]</span>}
      {phone && <> · <b style={{ color: 'var(--ink)' }}>{phone}</b></>}
      <br />
      {address.length ? address.join(', ') : !phone && <span className="legal-placeholder">[placeholder — pending decision on public disclosure]</span>}
    </p>
  );
}

export default function ContactPage() {
  const { site } = useSite();
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {
      name: !v.name.trim() && 'Please enter your name.',
      organization: !v.organization.trim() && 'Please enter your organization name.',
      email: !isOfficialEmail(v.email.trim()) && ERR.officialEmail,
      phone: !PHONE_RE.test(v.phone.trim()) && 'Please enter a valid 10-digit phone number.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) { setSent(false); return; }
    setApiError('');
    setBusy(true);
    try {
      await publicApi.contact({ ...v, name: v.name.trim(), organization: v.organization.trim(), email: v.email.trim(), phone: v.phone.trim() });
      setSent(true);
      setV(EMPTY);
    } catch (err) {
      setApiError(err.message);
      setSent(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page active">
      <div className="container">
        <PageHero title="Let's Talk.">
          Questions about a pilot, custom pricing, or integration — reach out and we'll get back to you within one business day.
        </PageHero>
        <div className="contact-grid">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, margin: '0 0 6px' }}>Or book a call directly</h2>
            <p className="section-sub" style={{ color: 'var(--ink-soft)', fontSize: 14.5, margin: '0 0 22px' }}>
              Pick a day and time that works for you — we'll send a calendar invite to you and loop in our sales team automatically.
            </p>
            <BookCall source="contact" />
          </div>
          <form className="contact-form" onSubmit={submit} noValidate style={{ maxWidth: 'none' }}>
            <Field label="Name *" error={errors.name}><input type="text" value={v.name} onChange={set('name')} /></Field>
            <Field label="Organization *" error={errors.organization}><input type="text" value={v.organization} onChange={set('organization')} /></Field>
            <Field label="Official email ID *" error={errors.email}><input type="email" value={v.email} onChange={set('email')} /></Field>
            <Field label="Phone *" error={errors.phone}><input type="tel" value={v.phone} onChange={set('phone')} /></Field>
            <Field label="What are you interested in?">
              <select value={v.interest} onChange={set('interest')}>{INTERESTS.map((o) => <option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Message"><textarea rows={4} value={v.message} onChange={set('message')} /></Field>
            {apiError && <div className="field-error-banner">{apiError}</div>}
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send Message'}</button>
            {sent && (
              <p style={{ fontSize: 13, color: 'var(--accent-success)', marginTop: 10 }}>
                Thanks — we've received your message and will get back to you within one business day.
              </p>
            )}
          </form>
        </div>
        <Section>
          <h2>Direct contact</h2>
          <DirectContact site={site} />
        </Section>
      </div>
    </section>
  );
}

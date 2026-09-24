import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import Field from '../components/ui/Field.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import { emailFor } from '../utils/tokens.js';
import { ERR, isEmail } from '../utils/validators.js';

const INTERESTS = ['Deep Customer Insights', 'Voice Bot', 'Cloud Telephony', 'Enterprise'];
const EMPTY = { name: '', organization: '', email: '', phone: '', interest: INTERESTS[0], message: '' };

/** Renders "hello@[domain]" with the placeholder highlighted until a real domain/address is configured. */
function Mail({ site, which }) {
  const addr = emailFor(site, which);
  if (!addr.includes('[domain]')) return addr;
  return <>{which}@<span className="legal-placeholder">[domain]</span></>;
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
      name: !v.name.trim() && ERR.name,
      organization: !v.organization.trim() && ERR.org,
      email: !isEmail(v.email.trim()) && ERR.email,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
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
        <form className="contact-form" onSubmit={submit} noValidate>
          <Field label="Name" error={errors.name}><input type="text" value={v.name} onChange={set('name')} /></Field>
          <Field label="Organization" error={errors.organization}><input type="text" value={v.organization} onChange={set('organization')} /></Field>
          <Field label="Official email ID" error={errors.email}><input type="email" value={v.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input type="tel" value={v.phone} onChange={set('phone')} /></Field>
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
        <Section>
          <h2>Direct contact</h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
            <Mail site={site} which="hello" /> · <Mail site={site} which="sales" /> · <Mail site={site} which="support" /> · <Mail site={site} which="privacy" /><br />
            Phone and office address: {site.phoneAddress
              ? site.phoneAddress
              : <span className="legal-placeholder">[placeholder — pending decision on public disclosure]</span>}
          </p>
        </Section>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { GoLink } from '../hooks/useGoto.jsx';
import { PageHero, Section, BenefitGrid, FaqSection } from '../components/ui/Blocks.jsx';
import Field from '../components/ui/Field.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { ERR, PHONE_RE, isOfficialEmail } from '../utils/validators.js';

const EMPTY = { name: '', organization: '', email: '', phone: '', channels: '' };

export default function SipChannelsPage() {
  const { faqs } = useSite();
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
      channels: !(Number(v.channels) > 0) && 'Enter the number of channels you need.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) { setSent(false); return; }
    setApiError('');
    setBusy(true);
    try {
      await publicApi.contact({
        name: v.name.trim(), organization: v.organization.trim(), email: v.email.trim(), phone: v.phone.trim(),
        interest: 'SIP Channels', message: `Channels needed: ${v.channels.trim()}`,
      });
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
        <PageHero icon="sip-channels" eyebrow="SIP Channels" title="The dial tone behind everything else here.">
          Concurrent-call capacity for inbound and outbound lines, built to the uptime standard a 24/7 contact center actually needs — not a startup's best-effort SLA. Tell us your channel count and we'll quote it properly.
        </PageHero>

        <Section style={{ paddingTop: 0 }}>
          <BenefitGrid items={[
            { icon: 'sip-channels', title: 'Concurrent-call capacity', text: 'Inbound and outbound lines sized to your real call volume, not a shared pool.' },
            { icon: 'circle-check', title: 'Enterprise SLAs', text: 'Built for 24/7 contact center uptime, not a best-effort startup SLA.' },
            { icon: 'bars3', title: 'Quoted to your volume', text: 'Channel count and usage pattern set the price — no generic rate card.' },
          ]} />
        </Section>

        <Section id="sip-quote">
          <h2>Get SIP Channel pricing</h2>
          <p className="no-price-note">Tell us how many channels you need and we'll follow up with a quote. Need something else? <GoLink to="contact">Talk to sales</GoLink>.</p>
          <form className="contact-form" onSubmit={submit} noValidate style={{ maxWidth: 460 }}>
            <Field label="Number of channels needed *" error={errors.channels}>
              <input type="number" min="1" inputMode="numeric" placeholder="e.g. 25" value={v.channels} onChange={set('channels')} />
            </Field>
            <Field label="Name *" error={errors.name}><input type="text" value={v.name} onChange={set('name')} /></Field>
            <Field label="Organization *" error={errors.organization}><input type="text" value={v.organization} onChange={set('organization')} /></Field>
            <Field label="Official email ID *" error={errors.email}><input type="email" value={v.email} onChange={set('email')} /></Field>
            <Field label="Phone *" error={errors.phone}><input type="tel" value={v.phone} onChange={set('phone')} /></Field>
            {apiError && <div className="field-error-banner">{apiError}</div>}
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Get Pricing'}</button>
            {sent && (
              <p style={{ fontSize: 13, color: 'var(--accent-success)', marginTop: 10 }}>
                Thanks — we'll send tailored pricing for your channel count shortly.
              </p>
            )}
          </form>
        </Section>

        <FaqSection items={faqs.sip} />
      </div>
    </section>
  );
}

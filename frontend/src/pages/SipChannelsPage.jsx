import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import { PageHero, Section, BenefitGrid, FaqSection } from '../components/ui/Blocks.jsx';
import ProductOverview from '../components/ui/ProductOverview.jsx';
import Field from '../components/ui/Field.jsx';
import { useSite } from '../context/SiteContext.jsx';
import { ERR, PHONE_RE, isOfficialEmail } from '../utils/validators.js';

const EMPTY = { name: '', organization: '', email: '', phone: '', channels: '' };

const OV_STEPS = [
  { title: 'Tell us your volume', text: 'Share the number of channels you think you need.' },
  { title: 'Get a quote', text: 'We confirm the sizing and the price.' },
  { title: 'Go live', text: 'We help you connect and test before you switch over.' },
];

const HIGHLIGHTS = [
  { title: 'Capacity sized to you', text: 'Pay for the concurrent calls you actually need, not a generic bundle.' },
  { title: 'Inbound and outbound', text: 'Run both directions on one setup, with capacity you can adjust.' },
  { title: 'Built for 24/7', text: 'Designed for contact centers that cannot afford a quiet outage at peak hour.' },
  { title: 'Works with your stack', text: 'Connect to your existing dialer or PBX that speaks SIP.' },
  { title: 'Scale when campaigns scale', text: 'Add channels before a seasonal peak and release them after.' },
  { title: 'One partner for the stack', text: 'Pair with Cloud Telephony, Voice Bots and Quality Audits from the same team.' },
];

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
        <PageHero eyebrow="SIP Channels" title="The dial tone behind everything else on this page.">
          Concurrent-call capacity for inbound and outbound lines, built to the uptime standard a 24/7 contact center actually needs — not a startup's best-effort SLA. Tell us your channel count and we'll quote it properly.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Concurrent call capacity</span><span className="chip">Inbound + outbound</span><span className="chip">Enterprise SLAs</span>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <BenefitGrid items={[
            { icon: 'sip-channels', title: 'Concurrent-call capacity', text: 'Inbound and outbound lines sized to your real call volume, not a shared pool.' },
            { icon: 'circle-check', title: 'Enterprise SLAs', text: 'Built for 24/7 contact center uptime, not a best-effort startup SLA.' },
            { icon: 'bars3', title: 'Quoted to your volume', text: 'Channel count and usage pattern set the price — no generic rate card.' },
          ]} />
        </Section>

        <ProductOverview
          illo="sip"
          title="What SIP Channels are, in plain terms"
          lead="A SIP channel is one live call line. Ten channels means ten simultaneous conversations in or out. Nimantran SIP Channels give your contact center the capacity it needs, quoted to your real volume and built for round-the-clock uptime."
          steps={OV_STEPS}
          highlights={HIGHLIGHTS}
          tryTitle="Know your channel count?"
          tryText="Enter it in the quote box below and we will follow up with pricing."
          tryCta="Get a quote"
          tryHref="#sip-quote"
        />

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

        <div className="cta-band">
          <div>
            <h2>Get capacity that matches your peak, not your average.</h2>
            <p>Tell us your channel count for a quote, or book a meeting to size it together.</p>
          </div>
          <div className="cta-row">
            <GoButton to="contact" className="btn">Book a meeting</GoButton>
            <GoButton to="contact" className="btn secondary">Contact us</GoButton>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { publicApi } from '../api/public.js';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import Field from '../components/ui/Field.jsx';
import { ERR, PHONE_RE, isOfficialEmail } from '../utils/validators.js';

const EMPTY = { name: '', organization: '', email: '', phone: '', channels: '' };

export default function SipChannelsPage() {
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
    <section className="wrap section pc-page">
      <ThemeFragment name="sip-banner" />
      <div className="section-head">
        <div className="kicker">SIP Channels</div>
        <h1>The dial tone behind everything else on this page.</h1>
        <p>Concurrent-call capacity for inbound and outbound lines, built to the uptime standard a 24/7 contact center actually needs — not a startup's best-effort SLA. Tell us your channel count and we'll quote it properly.</p>
      </div>
      <div className="chip-row"><span className="chip">Concurrent call capacity</span><span className="chip">Inbound + outbound</span><span className="chip">Enterprise SLAs</span></div>
      <ThemeFragment name="ov-sip" />
      <ThemeFragment name="sip-strip" />

      {/* Theme quote box; the backend contact endpoint also needs name, organization and phone. */}
      <form className="quote-box" id="sipQuote" style={{ maxWidth: 640, margin: '36px auto 0' }} onSubmit={submit} noValidate>
        <h3 style={{ fontSize: 17, marginBottom: 6 }}>Get SIP channel pricing</h3>
        <p style={{ fontSize: 13, marginBottom: 18 }}>Tell us how many channels you need and we'll follow up with a quote.</p>
        <Field label="Number of channels needed" htmlFor="sip_channels" error={errors.channels}>
          <input type="number" min="1" id="sip_channels" inputMode="numeric" placeholder="e.g. 25" value={v.channels} onChange={set('channels')} />
        </Field>
        <div className="grid2">
          <Field label="Work email" htmlFor="sip_email" error={errors.email}>
            <input type="email" id="sip_email" placeholder="you@company.com" value={v.email} onChange={set('email')} />
          </Field>
          <Field label="Phone" htmlFor="sip_phone" error={errors.phone}>
            <input type="tel" id="sip_phone" placeholder="10-digit mobile number" value={v.phone} onChange={set('phone')} />
          </Field>
        </div>
        <div className="grid2">
          <Field label="Name" htmlFor="sip_name" error={errors.name}>
            <input type="text" id="sip_name" placeholder="Your name" value={v.name} onChange={set('name')} />
          </Field>
          <Field label="Organization" htmlFor="sip_org" error={errors.organization}>
            <input type="text" id="sip_org" placeholder="Company name" value={v.organization} onChange={set('organization')} />
          </Field>
        </div>
        {apiError && <div className="error-text" style={{ display: 'block' }}>{apiError}</div>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
          {busy ? 'Sending…' : 'Get pricing'}
        </button>
        {sent && (
          <div className="quote-success" style={{ display: 'block' }}>Thanks — we'll send tailored pricing for your channel count shortly.</div>
        )}
      </form>
      <ThemeFragment name="sip-media" />
      <ThemeFragment name="tail-sip" />
    </section>
  );
}

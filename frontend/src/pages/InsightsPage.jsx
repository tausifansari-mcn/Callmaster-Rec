import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import { BenefitGrid, FaqSection, HowSteps, PageHero, Section } from '../components/ui/Blocks.jsx';

const HIGHLIGHTS = [
  { icon: 'audit', title: 'Every call scored', text: 'Replace sampling with full coverage, so a bad call is found when it happens, not at the next quarterly review.' },
  { icon: 'pen', title: 'Your own scorecard', text: 'Use standard parameters or define your own: greeting, empathy, compliance lines, product knowledge, closing.' },
  { icon: 'search', title: 'Transcript you can search', text: 'Each recording becomes a readable transcript, so you can find what was promised and when.' },
  { icon: 'clap', title: 'Coaching flags', text: 'Calls that miss a parameter are flagged with the reason, so team leads coach on evidence instead of hunches.' },
  { icon: 'circle-check', title: 'Works across call types', text: 'Inbound service, outbound sales, collections and campaign calls, each with its own scoring logic.' },
  { icon: 'reso', title: 'Compliance evidence', text: 'Show that mandatory disclosures were read out, call by call, whenever an auditor or client asks.' },
];
import Field from '../components/ui/Field.jsx';
import InsightsWizard from '../components/wizards/InsightsWizard.jsx';
import { ERR, PHONE_RE, isOfficialEmail } from '../utils/validators.js';

const CALL_TYPES = ['Inbound Support', 'Outbound Sales', 'Collections', 'Retention', 'A mix of the above'];
const VOLUMES = ['Under 5,000 calls/month', '5,000–25,000 calls/month', '25,000–100,000 calls/month', '100,000+ calls/month'];
const SETUPS = ['Manual/sample-based QA today', 'Using another QA/analytics tool', 'No formal QA process today'];
const EMPTY = { name: '', organization: '', email: '', phone: '', callType: '', monthlyVolume: '', qaSetup: '' };

function PricingRequestForm() {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const t = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()]));
    const next = {
      name: !t.name && ERR.name,
      organization: !t.organization && ERR.org,
      email: !isOfficialEmail(t.email) && ERR.officialEmail,
      phone: !PHONE_RE.test(t.phone) && ERR.phone,
      callType: !t.callType && 'Select a call type',
      monthlyVolume: !t.monthlyVolume && 'Select a volume band',
      qaSetup: !t.qaSetup && 'Select an option',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setApiError('');
    setBusy(true);
    try {
      await publicApi.lead(t);
      setSent(true);
      setV(EMPTY);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lead-form-box">
      <h3>Quality Audits — pricing request</h3>
      <p className="sub">A few details so we can size this correctly for your volume.</p>
      <form onSubmit={submit} noValidate>
        <div className="field-row2">
          <Field label="Name" error={errors.name}><input type="text" value={v.name} onChange={set('name')} /></Field>
          <Field label="Organization" error={errors.organization}><input type="text" value={v.organization} onChange={set('organization')} /></Field>
        </div>
        <div className="field-row2">
          <Field label="Official email ID" error={errors.email}><input type="email" value={v.email} onChange={set('email')} /></Field>
          <Field label="Phone" error={errors.phone}><input type="tel" value={v.phone} onChange={set('phone')} /></Field>
        </div>
        <div className="field-row2">
          <Field label="Call type you want audited" error={errors.callType}>
            <select value={v.callType} onChange={set('callType')}>
              <option value="">Select</option>{CALL_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Monthly call volume" error={errors.monthlyVolume}>
            <select value={v.monthlyVolume} onChange={set('monthlyVolume')}>
              <option value="">Select</option>{VOLUMES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Current QA setup" error={errors.qaSetup}>
          <select value={v.qaSetup} onChange={set('qaSetup')}>
            <option value="">Select</option>{SETUPS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        {apiError && <div className="field-error-banner">{apiError}</div>}
        <div className="btn-row"><button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send me pricing'}</button></div>
        <div className={`form-success${sent ? ' show' : ''}`}>
          Thanks — pricing tailored to your volume will be sent to your official email ID within one business day.
        </div>
      </form>
    </div>
  );
}

export default function InsightsPage() {
  const { faqs } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="audit" illo="audit" eyebrow="Quality Audits" title="Stop sampling 2% of your calls and hoping the rest are fine.">
          Every recording gets the same rigor a senior QA analyst would give it — transcribed, scored against your own parameters, and flagged for coaching, in the time it takes to make coffee. For sales calls, it goes further: it finds your best-performing pitch from real calls and pushes it to your whole team. Upload one of your own calls below and see it for yourself.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Inbound</span><span className="chip">Outbound sales</span><span className="chip">Collections</span><span className="chip">Sales campaigns</span>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <h2>How it works</h2>
          <HowSteps steps={[
            { art: 'clock', title: 'Upload your call', text: 'MP3, MPEG and other common audio formats — no special export needed.' },
            { art: 'lines-a', title: 'Select the line of business', text: 'Inbound Support, Outbound Sales, Collections, or Retention.' },
            { art: 'check', title: 'Get scored, automatically', text: 'Transcript, scorecard and exact improvement areas — in seconds.' },
          ]} />
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <h2>Highlights</h2>
          <BenefitGrid items={HIGHLIGHTS} />
        </Section>

        <InsightsWizard />

        <Section id="audit-pricing">
          <h2>Get pricing</h2>
          <p className="no-price-note">We don't publish rates here — tell us your call volume and we'll send exact per-minute pricing to your official email ID.</p>
          <PricingRequestForm />
        </Section>

        <FaqSection items={faqs.audit} />
      </div>
    </section>
  );
}

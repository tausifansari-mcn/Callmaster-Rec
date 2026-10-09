import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import { GoLink } from '../hooks/useGoto.jsx';
import { Section } from '../components/ui/Blocks.jsx';
import { IconBadge, IndustryArt } from '../components/ui/Icons.jsx';
import Field from '../components/ui/Field.jsx';
import { ERR, PHONE_RE, isOfficialEmail } from '../utils/validators.js';
import { NotFoundPage } from './DynamicPage.jsx';
import { INDUSTRIES, INDUSTRY_LETTERS, getIndustryBySlug } from '../data/industries.js';

/** Maps a `uses[].product` value to the existing product page's route key, icon name and display label. */
const PRODUCT_META = {
  voice: { label: 'Voice Bots', icon: 'voice', routeKey: 'voice' },
  audit: { label: 'Quality Audits', icon: 'audit', routeKey: 'audit' },
  telephony: { label: 'Cloud Telephony', icon: 'telephony', routeKey: 'telephony' },
  sip: { label: 'SIP Channels', icon: 'sip-channels', routeKey: 'sip-channels' },
};

const EMPTY = { name: '', organization: '', email: '', phone: '' };

/** One generic industry detail page, rendered from data/industries.js for whichever :slug matches. */
export default function IndustryPage() {
  const { slug } = useParams();
  const industry = getIndustryBySlug(slug);

  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  if (!industry) return <NotFoundPage />;

  const others = INDUSTRIES.filter((i) => i.slug !== industry.slug);

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
      await publicApi.contact({
        name: v.name.trim(),
        organization: v.organization.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        interest: 'Enterprise',
        message: `Industry: ${industry.name}`,
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
        <nav aria-label="Breadcrumb" style={{ paddingTop: 34, fontSize: 13.5, color: 'var(--ink-faint)' }}>
          <Link to="/industries" style={{ color: 'var(--accent-live)', fontWeight: 600, textDecoration: 'none' }}>
            Industries
          </Link>
          <span style={{ margin: '0 6px' }}>/</span>
          <span>{industry.name}</span>
        </nav>

        <div className="hero" style={{ paddingTop: 14 }}>
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">{industry.kicker}</div>
              <h1>{industry.title}</h1>
              <p className="sub">{industry.lead}</p>
              <div className="cta-row">
                <a href="#industry-lead-form" className="btn">Get in touch</a>
                <GoLink to="audit" className="btn secondary">Explore the products</GoLink>
              </div>
            </div>
            <div className="hero-illo" aria-hidden="true">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <IndustryArt slug={industry.slug} letters={INDUSTRY_LETTERS[industry.slug]} size={200} />
              </div>
            </div>
          </div>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <h2>How {industry.name} teams can use Nimantran</h2>
          <div className="benefit-grid">
            {industry.uses.map((u) => {
              const meta = PRODUCT_META[u.product];
              return (
                <div className="benefit-card" key={u.title}>
                  <IconBadge name={meta.icon} />
                  <GoLink
                    to={meta.routeKey}
                    style={{
                      display: 'inline-block', fontSize: 12, fontWeight: 700, color: 'var(--accent-live)',
                      textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, textDecoration: 'none',
                    }}
                  >
                    {meta.label}
                  </GoLink>
                  <h4>{u.title}</h4>
                  <p>{u.text}</p>
                </div>
              );
            })}
          </div>
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <h2>Advantages for {industry.name}</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
            {industry.advantages.map((a) => (
              <li key={a.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent-success)', fontWeight: 800, fontSize: 16, lineHeight: '24px', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.55 }}>
                  <b style={{ color: 'var(--ink)' }}>{a.title}</b> — {a.text}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="industry-lead-form">
          <div
            style={{
              background: 'var(--navy, #1B3A26)',
              color: '#fff',
              borderRadius: 20,
              padding: '40px 32px',
              '--ink': '#fff',
              '--surface': 'rgba(255,255,255,0.08)',
              '--border': 'rgba(255,255,255,0.28)',
            }}
          >
            <h2 style={{ margin: '0 0 8px', color: '#fff' }}>
              Want to see how this fits your {industry.name.toLowerCase()} business?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15.5, maxWidth: '58ch', margin: '0 0 24px' }}>
              Leave your details and a Nimantran specialist will get in touch with ideas for {industry.name.toLowerCase()}, a price indication and a demo if you would like one.
            </p>
            <form className="contact-form" onSubmit={submit} noValidate style={{ maxWidth: 460 }}>
              <Field label="Name *" error={errors.name}>
                <input type="text" value={v.name} onChange={set('name')} />
              </Field>
              <Field label="Organization *" error={errors.organization}>
                <input type="text" value={v.organization} onChange={set('organization')} />
              </Field>
              <Field label="Official email ID *" error={errors.email}>
                <input type="email" value={v.email} onChange={set('email')} />
              </Field>
              <Field label="Phone *" error={errors.phone}>
                <input type="tel" value={v.phone} onChange={set('phone')} />
              </Field>
              {apiError && <div className="field-error-banner">{apiError}</div>}
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Sending…' : 'Tell me more'}</button>
              {sent && (
                <p style={{ fontSize: 13, color: 'var(--accent-success)', marginTop: 10 }}>
                  Thanks — we have your details and will be in touch within one business day.
                </p>
              )}
            </form>
          </div>
        </Section>

        <Section>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, margin: '0 0 12px' }}>
            Other industries
          </h3>
          <div className="chip-row">
            {others.map((o) => (
              <Link key={o.slug} to={`/industries/${o.slug}`} className="chip">{o.name}</Link>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}

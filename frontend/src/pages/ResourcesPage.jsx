import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import Field from '../components/ui/Field.jsx';
import { ERR, isOfficialEmail } from '../utils/validators.js';

const DocIcon = () => (
  <div className="icon-badge" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  </div>
);

/** One white paper: name + work email unlock the PDF (the visit is saved as a lead on the server). */
function WhitepaperCard({ paper }) {
  const [v, setV] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { available, url }

  const submit = async (e) => {
    e.preventDefault();
    const name = v.name.trim();
    const email = v.email.trim();
    const next = { name: !name && 'Enter your name', email: !isOfficialEmail(email) && ERR.officialEmail };
    setErrors(next);
    if (next.name || next.email) return;

    // Open the tab now (inside the click) so the browser doesn't treat it as a pop-up, then point it at the PDF.
    const tab = window.open('', '_blank');
    setApiError('');
    setBusy(true);
    try {
      const r = await publicApi.unlockWhitepaper(paper.slug, { name, email });
      if (r.available && tab) tab.location.href = r.url;
      else tab?.close();
      setDone(r);
    } catch (err) {
      tab?.close();
      setApiError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="prod-card">
      <DocIcon />
      <h3>{paper.title}</h3>
      <p>{paper.description}</p>
      <form className="wp-gate-form" onSubmit={submit} noValidate>
        <Field error={errors.name} style={{ marginBottom: 8 }}>
          <input type="text" placeholder="Full name" value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} />
        </Field>
        <Field error={errors.email} style={{ marginBottom: 8 }}>
          <input type="email" placeholder="Work email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} />
        </Field>
        {apiError && <div className="field-error-banner">{apiError}</div>}
        <button type="submit" className="btn secondary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Unlocking…' : 'Unlock & open PDF →'}</button>
        {done?.available && (
          <p className="wp-success">
            The PDF just opened in a new tab — save it from there. Didn't open? <a href={done.url} target="_blank" rel="noreferrer">Open it here</a>.
          </p>
        )}
        {done && !done.available && (
          <p className="wp-pending">Thanks — this paper is being finalised. We've saved your details and will send it to you as soon as it's ready.</p>
        )}
      </form>
    </div>
  );
}

export default function ResourcesPage() {
  const { insights, whitepapers } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow={insights.eyebrow} title={insights.title}>{insights.sub}</PageHero>

        {insights.articles.length > 0 && (
          <Section style={{ paddingTop: 0 }}>
            <h2>{insights.articlesHeading}</h2>
            <div className="fw-grid">
              {insights.articles.map((a, i) => (
                <div className="fw-card" key={i}>
                  <div className="fw-for">{a.tag}</div>
                  <div className="fw-name" style={{ fontSize: 18 }}>{a.title}</div>
                  <details className="transcript" style={{ marginTop: 10 }}>
                    <summary>Read the piece</summary>
                    <div className="transcript-body" style={{ maxHeight: 'none' }}>{a.body}</div>
                  </details>
                </div>
              ))}
            </div>
          </Section>
        )}

        {whitepapers.length > 0 && (
          <Section id="whitepapers">
            <h2>{insights.whitepapersHeading}</h2>
            <p className="section-sub">{insights.whitepapersSub}</p>
            <div className="card-grid" style={{ marginBottom: 8 }}>
              {whitepapers.map((p) => <WhitepaperCard key={p.slug} paper={p} />)}
            </div>
            <p className="no-price-note">{insights.gateNote}</p>
          </Section>
        )}
      </div>
    </section>
  );
}

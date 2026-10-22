import { useState } from 'react';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import { ERR, isOfficialEmail } from '../utils/validators.js';

/** One white paper: name + work email unlock the PDF (the visit is saved as a lead on the server). */
function WhitepaperCard({ paper }) {
  const [v, setV] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // { available, url }

  const submit = async (e) => {
    e.preventDefault();
    const name = v.name.trim();
    const email = v.email.trim();
    if (!name) { setError('Enter your name'); return; }
    if (!isOfficialEmail(email)) { setError(ERR.officialEmail); return; }

    // Open the tab now (inside the click) so the browser doesn't treat it as a pop-up, then point it at the PDF.
    const tab = window.open('', '_blank');
    setError('');
    setBusy(true);
    try {
      const r = await publicApi.unlockWhitepaper(paper.slug, { name, email });
      if (r.available && tab) tab.location.href = r.url;
      else tab?.close();
      setDone(r);
    } catch (err) {
      tab?.close();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ind-use">
      <h3>{paper.title}</h3>
      <p>{paper.description}</p>
      <form className="res-gate" onSubmit={submit} noValidate>
        <div className="field"><input type="text" placeholder="Full name" aria-label="Full name" value={v.name} onChange={(e) => setV((s) => ({ ...s, name: e.target.value }))} /></div>
        <div className="field"><input type="email" placeholder="Work email" aria-label="Work email" value={v.email} onChange={(e) => setV((s) => ({ ...s, email: e.target.value }))} /></div>
        <div className="error-text" role="alert" style={{ display: error ? 'block' : 'none' }}>{error}</div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Unlocking…' : 'Unlock & open PDF →'}</button>
        {done?.available && (
          <div className="quote-success" role="status" style={{ display: 'block', marginTop: 14 }}>
            The PDF just opened in a new tab — save it from there. Didn&apos;t open? <a href={done.url} target="_blank" rel="noreferrer">Open it here</a>.
          </div>
        )}
        {done && !done.available && (
          <div className="quote-success" role="status" style={{ display: 'block', marginTop: 14 }}>
            Thanks — this paper is being finalised. We&apos;ve saved your details and will send it to you as soon as it&apos;s ready.
          </div>
        )}
      </form>
    </div>
  );
}

/** Resources (React-only page) — the admin-managed articles and gated white papers, in the theme's components. */
export default function ResourcesPage() {
  const { insights, whitepapers } = useSite();
  return (
    <div className="tp-ct tp-resources">
      <div className="wrap section">
        <div className="section-head">
          {insights.eyebrow && <div className="kicker">{insights.eyebrow}</div>}
          <h1>{insights.title}</h1>
          {insights.sub && <p>{insights.sub}</p>}
        </div>

        {insights.articles.length > 0 && (
          <>
            <h2 className="block-title">{insights.articlesHeading}</h2>
            <div className="faq">
              {insights.articles.map((a, i) => (
                <details key={i}>
                  <summary><span><span className="ind-tag">{a.tag}</span> {a.title}</span></summary>
                  <p>{a.body}</p>
                </details>
              ))}
            </div>
          </>
        )}

        {whitepapers.length > 0 && (
          <div id="whitepapers">
            <h2 className="block-title">{insights.whitepapersHeading}</h2>
            {insights.whitepapersSub && <p className="res-sub">{insights.whitepapersSub}</p>}
            <div className="ind-uses">
              {whitepapers.map((p) => <WhitepaperCard key={p.slug} paper={p} />)}
            </div>
            {insights.gateNote && <p className="res-note">{insights.gateNote}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

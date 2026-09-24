import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/ui/RichText.jsx';
import { applySiteTokens } from '../utils/tokens.js';
import { GoButton } from '../hooks/useGoto.jsx';

export function NotFoundPage() {
  return (
    <section className="page active">
      <div className="container not-found">
        <div className="eyebrow">404</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, margin: '0 0 12px' }}>We couldn't find that page.</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 22 }}>The link may be old or the page may have moved.</p>
        <GoButton to="home" className="btn">Back to home</GoButton>
      </div>
    </section>
  );
}

/** Legal pages and any page the admin creates — served at /<slug> from the database. */
export default function DynamicPage() {
  const { slug } = useParams();
  const { site } = useSite();
  const [state, setState] = useState({ status: 'loading', page: null });

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', page: null });
    publicApi.page(slug)
      .then((page) => alive && setState({ status: 'ready', page }))
      .catch((err) => alive && setState({ status: err.status === 404 ? 'missing' : 'error', page: null }));
    return () => { alive = false; };
  }, [slug]);

  if (state.status === 'missing' || state.status === 'error') return <NotFoundPage />;
  if (state.status === 'loading') return <section className="page active"><div className="container" style={{ minHeight: '60vh' }} /></section>;

  const { page } = state;
  return (
    <section className="page active">
      <div className="container legal-body">
        <div className="hero" style={{ paddingTop: 34 }}><h1>{page.title}</h1></div>
        {page.sections.map((s, i) => (
          <div key={i}>
            {s.heading && <h3>{s.heading}</h3>}
            <RichText text={applySiteTokens(s.body, site)} />
          </div>
        ))}
      </div>
    </section>
  );
}

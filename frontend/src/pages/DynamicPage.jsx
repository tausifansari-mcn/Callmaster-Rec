import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/ui/RichText.jsx';
import { applySiteTokens } from '../utils/tokens.js';

/*
 * Legal pages and any page the admin creates — served at /<slug> from the database, laid out like the theme's
 * template-legal.php ("Legal" kicker, title, last-updated line, pill nav, .legal-body).
 *
 * The four pages the theme has (terms, privacy, cookies, retention) ship fuller, newer copy in the theme's
 * legal-content/*.html. While a page in the database is still the untouched seed copy (fingerprint below), that theme
 * copy is shown; as soon as an admin edits the page, the database copy wins.
 */

const THEME_COPY = import.meta.glob('../legal/*.html', { query: '?raw', import: 'default', eager: true });

/** The theme's pill nav (nimantran_legal_nav). */
const LEGAL_NAV = [
  { slug: 'terms', label: 'Terms and conditions' },
  { slug: 'privacy', label: 'Privacy policy' },
  { slug: 'cookie-policy', label: 'Cookie policy' },
  { slug: 'data-retention', label: 'Data retention policy' },
];

/** slug → theme copy file, the seed fingerprint it replaces, and the theme's page title / last-updated line. */
const THEME_PAGES = {
  terms: { file: 'terms', seed: 'gu9oao', title: 'Terms and Conditions', updated: '16 October 2026' },
  privacy: { file: 'privacy', seed: '1h26ti8', title: 'Privacy Policy' },
  'cookie-policy': { file: 'cookies', seed: '1y9etjn', title: 'Cookie Policy' },
  'data-retention': { file: 'retention', seed: 'o6mzo', title: 'Data Retention Policy', updated: '16 October 2026' },
};

// The theme's WordPress permalinks inside the legal copy → this app's routes.
const THEME_LINKS = { '/data-retention-policy/': '/data-retention', '/contact/': '/contact', '/privacy-policy/': '/privacy', '/terms-and-conditions/': '/terms', '/cookie-policy/': '/cookie-policy' };

const hash = (s) => { let x = 5381; for (let i = 0; i < s.length; i += 1) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(36); };
const fingerprint = (p) => hash(JSON.stringify([p.title, p.sections.map((s) => [s.heading || '', s.body || ''])]));

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; }
}

export function NotFoundPage() {
  return (
    <div className="tp-ct tp-pure">
      <div className="wrap section">
        <div className="section-head">
          <div className="kicker">404</div>
          <h1>We couldn't find that page.</h1>
          <p>The link may be old or the page may have moved.</p>
        </div>
        <div className="hero-cta">
          <Link className="btn btn-primary" to="/">Back to home</Link>
          <Link className="btn btn-outline" to="/contact">Contact us</Link>
        </div>
      </div>
    </div>
  );
}

/** Theme legal HTML, with internal links routed through the SPA. */
function ThemeLegalBody({ html }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const resolved = useMemo(() => html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/href="(\/[^"]*)"/g, (m, href) => `href="${THEME_LINKS[href] || href}"`), [html]);
  useEffect(() => {
    const el = ref.current;
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="/"]');
      if (!a) return;
      e.preventDefault();
      navigate(a.getAttribute('href'));
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [navigate]);
  return <div className="legal-body" ref={ref} dangerouslySetInnerHTML={{ __html: resolved }} />;
}

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
  if (state.status === 'loading') return <div className="tp-ct tp-pure"><div className="wrap section" style={{ minHeight: '60vh' }} /></div>;

  const { page } = state;
  const theme = THEME_PAGES[slug];
  const useTheme = theme && fingerprint(page) === theme.seed && THEME_COPY[`../legal/${theme.file}.html`];
  const isLegal = Boolean(theme) || slug === 'refund-policy';
  const nav = slug === 'refund-policy' ? [...LEGAL_NAV, { slug: 'refund-policy', label: 'Refund & cancellation policy' }] : LEGAL_NAV;

  return (
    <div className="tp-ct tp-pure">
      <section className="wrap section">
        <div className="legal-wrap">
          <div className="section-head">
            {isLegal && <div className="kicker">Legal</div>}
            <h1>{useTheme ? theme.title : page.title}</h1>
          </div>
          <div className="legal-updated">Last updated: {(useTheme && theme.updated) || fmtDate(page.updatedAt)}</div>

          {isLegal && (
            <div className="legal-nav">
              {nav.map((n) => <Link key={n.slug} to={`/${n.slug}`} className={n.slug === slug ? 'active' : undefined}>{n.label}</Link>)}
            </div>
          )}

          {useTheme ? (
            <ThemeLegalBody html={THEME_COPY[`../legal/${theme.file}.html`]} />
          ) : (
            <div className="legal-body">
              {page.sections.map((s, i) => (
                <div key={i}>
                  {s.heading && <h3>{s.heading}</h3>}
                  <RichText text={applySiteTokens(s.body, site)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

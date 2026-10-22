import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { pathFor } from '../../utils/routes.js';

/**
 * Renders a design-source HTML fragment verbatim so the marketing pages stay pixel-identical to the
 * theme they were designed in. Fragments carry {{img:file}} and {{url:key}} placeholders; the theme
 * resolved those in PHP, we resolve them here. Internal links are intercepted so they route through
 * the SPA instead of reloading the page.
 */
const FRAGMENTS = import.meta.glob('../../fragments/*.html', { query: '?raw', import: 'default', eager: true });

/** The theme's page keys → this app's route keys. */
const URL_KEYS = {
  home: 'home',
  audits: 'audit',
  voicebots: 'voice',
  telephony: 'telephony',
  sip: 'sip-channels',
  social: 'social-listening',
  why: 'why',
  insights: 'insights',
  industries: 'industries',
  pricing: 'pricing',
  contact: 'contact',
  terms: 'terms',
  privacy: 'privacy',
  cookies: 'cookie-policy',
  retention: 'data-retention',
};

function resolve(html) {
  return html
    .replace(/\{\{img:([a-z0-9\-.]+)\}\}/gi, (_, file) => `/assets/images/${file}`)
    .replace(/\{\{url:([a-z0-9-]+)\}\}/gi, (_, key) => pathFor(URL_KEYS[key] || key))
    // The theme ships a <script> for video autoplay robustness; innerHTML never runs it, and the
    // markup already autoplays natively, so drop it rather than ship dead code.
    .replace(/<script[\s\S]*?<\/script>/gi, '');
}

/**
 * `name` renders one fragment. `parts` renders several joined into a single parse — some fragments
 * are split pairs that open a wrapper in one file and close it in another, with content spliced
 * between; parsing those separately would let the browser auto-close the wrapper and break nesting.
 * Entries starting with "<" are treated as literal markup rather than a fragment name.
 */
export default function ThemeFragment({ name, parts, className }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const html = useMemo(() => {
    const list = parts || [name];
    const joined = list
      .map((p) => (p.trimStart().startsWith('<') ? p : FRAGMENTS[`../../fragments/${p}.html`] || ''))
      .join('');
    return joined ? resolve(joined) : '';
  }, [name, parts]);

  // Internal anchors inside the fragment should navigate client-side.
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="/"]');
      if (!a || a.target === '_blank') return;
      e.preventDefault();
      navigate(a.getAttribute('href'));
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [navigate, html]);

  if (!html) return null;
  // `display:contents` keeps this wrapper out of layout, so the fragment's own elements act as
  // direct children of the parent — the theme's selectors (e.g. `.hero-grid > .hv-bg`) depend on it.
  return (
    <div
      className={className}
      ref={ref}
      style={className ? undefined : { display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

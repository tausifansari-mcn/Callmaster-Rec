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

  /**
   * Keep autoplaying video playing. The design source drives this with an inline <script>, which
   * innerHTML never executes — and the bare `autoplay` attribute is unreliable on a node inserted
   * this way, so the video would start on first load but stay frozen after a client-side route
   * change remounted it. Drive playback explicitly instead, and pause while off-screen or hidden.
   */
  useEffect(() => {
    const videos = ref.current?.querySelectorAll('video[autoplay]');
    if (!videos?.length) return undefined;

    const cleanups = [];
    videos.forEach((v) => {
      // Autoplay is only permitted while genuinely muted, and the property must be set, not just
      // the attribute — a remounted node can otherwise be treated as unmuted and blocked.
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;

      let onScreen = true;
      const play = () => { if (v.paused && onScreen) v.play().catch(() => {}); };

      ['loadeddata', 'canplay', 'canplaythrough'].forEach((e) => v.addEventListener(e, play));
      const onStalled = () => v.load();
      v.addEventListener('stalled', onStalled);

      const onVisible = () => { if (!document.hidden) play(); };
      document.addEventListener('visibilitychange', onVisible);

      let io;
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            onScreen = entry.isIntersecting;
            if (onScreen) play(); else v.pause();
          });
        }, { threshold: 0.02 });
        io.observe(v);
      }

      // The element may already be ready on remount, in which case no media event fires.
      if (v.readyState >= 2) play(); else v.load();
      const retry = setTimeout(play, 300);

      cleanups.push(() => {
        ['loadeddata', 'canplay', 'canplaythrough'].forEach((e) => v.removeEventListener(e, play));
        v.removeEventListener('stalled', onStalled);
        document.removeEventListener('visibilitychange', onVisible);
        io?.disconnect();
        clearTimeout(retry);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

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

import { useEffect, useRef } from 'react';
import { GoLink } from '../hooks/useGoto.jsx';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';

/** Waveform bars exactly as the theme renders them: [height, delay]. */
const WAVE = [[26, 1.42], [31, 0.98], [10, 1.23], [12, 0.55], [9, 1.36], [19, 0.06], [33, 0.63], [21, 0.14], [33, 0.09], [42, 0.19], [20, 0.95], [43, 1.42], [42, 0.88]];

const ico = (d) => (
  <span className="mi">
    <svg viewBox="0 0 24 24" stroke="#2F5D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">{d}</svg>
  </span>
);

const SOLUTIONS = [
  ['audit', 'Quality Audits', <path d="M5 10v4M9 7v10M13 9v6M17 6v12" />],
  ['voice', 'Voice Bots', <><rect x="7" y="2.5" width="10" height="19" rx="3" /><path d="M10.5 10l4 2.5-4 2.5z" /></>],
  ['telephony', 'Cloud Telephony', <path d="M6 3h3l1.6 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.6v3a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z" />],
  ['sip-channels', 'SIP Channels', <><circle cx="5" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="12" r="2" /><path d="M7 6.5l10 4.5M7 17.5l10-4.5" /></>],
  ['social-listening', 'Social Listening', <><path d="M4 5h16v10H10l-4 4v-4H4z" /><path d="M8 10h2l1-2 2 4 1-2h2" /></>],
];

const STATS = [['23+', 'Years in contact center operations'], ['250+', 'Businesses served'], ['97%', 'Client retention'], ['ISO 27001', '2022 certified']];

/**
 * The theme's stat count-up (nav.js): numeric values start at 0 and ease up to their final value
 * once 60% of the tile is on screen. Non-numeric values (ISO 27001) are left as they are.
 */
function CountUp({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const m = /^(\d+)(.*)$/.exec(value);
    if (!el || !m) return undefined;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches || !('IntersectionObserver' in window)) return undefined;
    const to = +m[1];
    const suf = m[2];
    let raf = 0;
    el.textContent = '0' + suf;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const f = (t) => {
          const p = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) raf = requestAnimationFrame(f);
          else el.textContent = value;
        };
        raf = requestAnimationFrame(f);
      });
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = value; };
  }, [value]);
  return <div className="num" ref={ref}>{value}</div>;
}

export default function WhyPage() {
  return (
    <div className="pc-page pc-why">
      <div className="why-hero">
        <div className="wrap">
          <div>
            <div className="why-kick">Why Nimantran</div>
            <h1>We understood the conversation. Then we built the intelligence.</h1>
            <p className="lead">AI call intelligence, built by a company that has run contact centers for 23 years.</p>
            <div className="hero-cta">
              <GoLink to="contact" className="btn btn-primary">Talk to sales</GoLink>
              <GoLink to="contact" className="btn btn-outline">Book a meeting</GoLink>
            </div>
            <div className="why-quotes"><p>Technology grounded in the real world, not just the next big idea.</p><p>People first. Always.</p></div>
          </div>
          <div className="why-visual">
            <div className="why-orb">
              <div className="wave" aria-hidden="true">
                {WAVE.map(([h, d], i) => <i key={i} style={{ '--h': h, '--d': d }} />)}
              </div>
            </div>
            <div className="float-chip fc1"><span className="dot" />Customer sentiment: Positive</div>
            <div className="float-chip fc2">23+ years of conversations</div>
          </div>
        </div>
      </div>
      <div className="wrap why-story">
        <h2>Built by people who've been on your side of the call.</h2>
        <div className="copy">
          <p>Behind every conversation is a person.</p>
          <p>And behind every contact center is a team trying to make those conversations better.</p>
          <p>Nimantran brings quality auditing, voice bots, telephony and call capacity together, built to plug into how your team already works.</p>
          <div className="why-solutions">
            {SOLUTIONS.map(([to, label, d]) => <GoLink key={to} to={to}>{ico(d)}{label}</GoLink>)}
          </div>
        </div>
      </div>
      <div className="wrap" style={{ padding: '0 28px 8px' }}>
        <div className="stat-row">
          {STATS.map(([n, l]) => <div className="stat-tile" key={n}><CountUp value={n} /><div className="lbl">{l}</div></div>)}
        </div>
        <ThemeFragment name="why-extra" />
        <div className="why-experience">
          <div>
            <h2>Experience the difference.</h2>
            <p>Bring your own call, your own script, your own challenge.</p>
            <p>See what changes when intelligence meets experience.</p>
          </div>
          <GoLink to="contact" className="btn btn-primary" style={{ justifySelf: 'start' }}>Meet our team</GoLink>
        </div>
        <div className="cta-band" style={{ margin: '84px 0 72px' }}>
          <div>
            <h2>Your next great conversation starts here.</h2>
            <p>See what Nimantran can do with your own calls.</p>
          </div>
          <div className="hero-cta">
            <GoLink to="contact" className="btn btn-light">Let's talk possibilities</GoLink>
          </div>
        </div>
      </div>
    </div>
  );
}

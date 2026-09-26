/**
 * Decorative illustrations from the redesign. Every fill/stroke is a CSS class (see "illustrations" in site.css),
 * so they follow the light / dark theme instead of carrying hard-coded colours.
 */
const A = { xmlns: 'http://www.w3.org/2000/svg', fill: 'none', 'aria-hidden': true };

const PHONE = 'M129 122c0-2 1.6-3.7 3.7-3.7h3.2c1.8 0 3.4 1.3 3.6 3.1.3 2.1 1 4.1 1.8 6 .4.9.2 1.9-.5 2.5l-2.1 1.9c1.7 3.4 4.3 6.1 7.7 7.7l1.9-2.1c.6-.7 1.6-.9 2.5-.5 1.9.8 3.9 1.5 6 1.8 1.8.3 3.1 1.8 3.1 3.6v3.2c0 2.1-1.6 3.7-3.7 3.7C140.5 148.9 130.1 138.5 129 125z';

const HERO = {
  audit: (
    <>
      <circle className="il-bg" cx="210" cy="180" r="172" />
      <rect className="il-card" x="110" y="90" width="200" height="150" rx="12" />
      <rect className="il-line" x="128" y="112" width="120" height="8" rx="4" />
      <rect className="il-line" x="128" y="132" width="164" height="8" rx="4" />
      <rect className="il-line" x="128" y="152" width="90" height="8" rx="4" />
      <rect className="il-soft" x="128" y="184" width="164" height="34" rx="6" />
      <path className="il-accent-stroke" d="M138 201l6 6 12-12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text className="il-text-accent" x="162" y="196" fontSize="8.5" fontWeight="600">Best-performing</text>
      <text className="il-text-accent" x="162" y="207" fontSize="8.5" fontWeight="600">script found</text>
      <circle className="il-card" cx="300" cy="260" r="46" />
      <text className="il-text-success" x="300" y="255" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="22" fontWeight="700">92</text>
      <text className="il-faint" x="300" y="272" textAnchor="middle" fontSize="9">SCORE</text>
    </>
  ),
  voice: (
    <>
      <circle className="il-bg" cx="210" cy="180" r="172" />
      <rect className="il-card" x="160" y="90" width="100" height="170" rx="16" />
      <rect className="il-bg" x="178" y="108" width="64" height="118" rx="4" />
      <circle className="il-line" cx="210" cy="240" r="7" />
      <path className="il-accent-stroke" d="M188 150v40M200 140v60M212 130v80M224 140v60M236 150v40" strokeWidth="4" strokeLinecap="round" />
      <circle className="il-card" cx="300" cy="130" r="28" />
      <path className="il-accent" d="M290 120a10 12 0 0 1 20 0v10a10 12 0 0 1-20 0z" />
      <path className="il-accent-stroke" d="M284 128c0 9 7 16 16 16s16-7 16-16" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="il-card" cx="120" cy="250" r="26" />
      <path className="il-success-stroke" d="M110 240c4-6 20-6 24 3s-1 15-1 15" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  dialers: (
    <>
      <circle className="il-bg" cx="210" cy="180" r="172" />
      <circle className="il-card" cx="140" cy="130" r="30" /><path className="il-line" d={PHONE} />
      <circle className="il-card" cx="280" cy="130" r="30" style={{ stroke: 'var(--accent-live)' }} />
      <path className="il-accent" d="M269 122c0-2 1.6-3.7 3.7-3.7h3.2c1.8 0 3.4 1.3 3.6 3.1.3 2.1 1 4.1 1.8 6 .4.9.2 1.9-.5 2.5l-2.1 1.9c1.7 3.4 4.3 6.1 7.7 7.7l1.9-2.1c.6-.7 1.6-.9 2.5-.5 1.9.8 3.9 1.5 6 1.8 1.8.3 3.1 1.8 3.1 3.6v3.2c0 2.1-1.6 3.7-3.7 3.7C280.5 148.9 270.1 138.5 269 125z" />
      <path className="il-accent-stroke" d="M310 122l8 8-8 8M318 130h-30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <circle className="il-card" cx="140" cy="230" r="30" />
      <path className="il-line" transform="translate(0 100)" d={PHONE} />
      <rect className="il-card" x="185" y="205" width="60" height="50" rx="8" style={{ stroke: 'var(--accent-success)' }} />
      <path className="il-success-stroke" d="M198 226l7 7 14-14" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <text className="il-text-success" x="215" y="248" textAnchor="middle" fontSize="8" fontWeight="600">CONNECTED</text>
    </>
  ),
  'email-automation': (
    <>
      <circle className="il-bg" cx="210" cy="180" r="172" />
      <rect className="il-card" x="120" y="110" width="180" height="130" rx="12" />
      <path className="il-accent-stroke" d="M120 122l90 65 90-65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle className="il-success" cx="300" cy="110" r="24" />
      <path d="M290 110l7 7 13-13" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect className="il-card" x="140" y="255" width="60" height="18" rx="9" />
      <rect className="il-card" x="210" y="255" width="70" height="18" rx="9" />
    </>
  ),
  'whatsapp-api': (
    <>
      <circle className="il-bg" cx="210" cy="180" r="172" />
      <rect className="il-card" x="145" y="90" width="130" height="190" rx="18" />
      <rect className="il-bg" x="160" y="115" width="70" height="16" rx="8" />
      <rect className="il-success" x="160" y="140" width="100" height="16" rx="8" opacity="0.18" />
      <rect className="il-bg" x="160" y="165" width="85" height="16" rx="8" />
      <circle className="il-line" cx="210" cy="258" r="7" />
      <circle className="il-success" cx="300" cy="120" r="26" />
      <path d="M289 120l7 7 14-14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  telephony: (
    <>
      <circle className="il-bg" cx="210" cy="180" r="172" />
      <rect className="il-card" x="150" y="80" width="120" height="200" rx="18" />
      <rect className="il-bg" x="166" y="100" width="88" height="130" rx="6" />
      <circle className="il-line" cx="210" cy="260" r="8" />
      <text className="il-text-accent" x="210" y="150" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700">98765</text>
      <text className="il-text-accent" x="210" y="172" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700">43210</text>
      <rect className="il-bg" x="168" y="187" width="84" height="20" rx="10" style={{ stroke: 'var(--accent-success)', strokeWidth: 1.5 }} />
      <text className="il-text-success" x="210" y="201" textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="0.02em">LOOKS MOBILE</text>
      <circle className="il-halo" cx="320" cy="120" r="26" />
      <path className="il-success" d="M308 120c0-8 6-14 12-14s12 6 12 14-6 20-12 26c-6-6-12-18-12-26z" />
    </>
  ),
};

/** The large picture beside a product page's headline (hidden on small screens). */
export function HeroIllo({ kind }) {
  if (!HERO[kind]) return null;
  return (
    <div className="hero-illo" aria-hidden="true">
      <svg viewBox="0 0 420 360" {...A}>{HERO[kind]}</svg>
    </div>
  );
}

const STEP = {
  phone: <path className="il-accent" d="M48 55c0-5 4-9 9-9h6c5 0 9 4 9 9v6c0 3-2 5-5 6l-2 6-2-5h-6c-5 0-9-4-9-9v-4z" />,
  target: (
    <>
      <path className="il-accent-stroke" d="M60 38v14M60 68v14M38 60h14M68 60h14" strokeWidth="4" strokeLinecap="round" />
      <circle className="il-accent" cx="60" cy="60" r="9" />
    </>
  ),
  check: <path className="il-success-stroke" d="M45 62l10 10 20-22" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />,
  clock: (
    <>
      <path className="il-accent-stroke" d="M60 44v20l12 8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="il-accent-stroke" d="M60 44a16 16 0 1 1-11 4.7" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  'lines-a': (
    <>
      <rect className="il-accent" x="44" y="46" width="32" height="8" rx="4" />
      <rect className="il-line" x="44" y="60" width="32" height="8" rx="4" />
      <rect className="il-line" x="44" y="74" width="20" height="8" rx="4" />
    </>
  ),
  'lines-b': (
    <>
      <rect className="il-accent" x="44" y="46" width="32" height="8" rx="4" />
      <rect className="il-line" x="44" y="60" width="20" height="8" rx="4" />
      <rect className="il-line" x="44" y="74" width="26" height="8" rx="4" />
    </>
  ),
  mic: (
    <>
      <path className="il-accent" d="M50 46a10 12 0 0 1 20 0v8a10 12 0 0 1-20 0z" />
      <path className="il-accent-stroke" d="M44 54c0 9 7 16 16 16s16-7 16-16" strokeWidth="3" strokeLinecap="round" />
      <path className="il-accent-stroke" d="M60 70v8" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};

/** One numbered "How it works" step: illustration, number, title, text. */
export function HowStep({ art, n, title, children }) {
  return (
    <div className="how-step">
      <svg viewBox="0 0 120 120" {...A}>
        <circle className="il-bg" cx="60" cy="60" r="54" />
        <circle className="il-card" cx="60" cy="60" r="30" />
        {STEP[art]}
      </svg>
      <div className="how-num">{n}</div>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

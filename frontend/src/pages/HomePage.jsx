import { useEffect, useRef } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import BookCall from '../components/booking/BookCall.jsx';
import { IconBadge } from '../components/ui/Icons.jsx';
import { BenefitGrid, HowSteps, Section } from '../components/ui/Blocks.jsx';
import { heroVideoUrl } from '../utils/branding.js';
import { rate } from '../utils/format.js';

const FRAMEWORKS = [
  {
    icon: 'clap', name: 'CLAP', forWhom: '"What is this customer really telling us?"',
    letters: [['C', 'the customer & their sentiment'], ['L', 'logistics & operations'], ['A', 'the agent'], ['P', 'the product']],
    why: <><b>What you get:</b> a true read of the customer — who they are, how they actually feel, and why — cross-checked against operations, the agent and the product on the same call. Not a QA scorecard that just blames the agent: real, actionable feedback the brand can act on to lift CX and turn more customers into repeat business.</>,
  },
  {
    icon: 'magic', name: 'MAGIC Script', forWhom: '"What\'s our best-performing pitch, right now?"',
    letters: [['→', 'Finds exactly where deals fall apart on the call'], ['→', "Spots the opening and pitch that's winning today"]],
    why: <><b>What you get:</b> your best script isn't in the training deck — it's the one closing deals this week. MAGIC Script finds it automatically and pushes it to every agent. Typical result: <b>close rates up by up to 20%.</b><sup style={{ fontSize: 10 }}>*</sup></>,
  },
  {
    icon: 'reso', name: 'RESO', forWhom: '"Which promises to pay will actually be kept?"',
    letters: [['→', 'Every promise-to-pay, scored for how likely it is to hold'], ['→', 'Flags any service issue hiding inside the same call']],
    why: <><b>What you get:</b> deeper read on every promise-to-pay, so you call back the right people at the right time. Typical result: <b>collections up by up to 32%.</b><sup style={{ fontSize: 10 }}>*</sup></>,
  },
];

const WHY = [
  { icon: 'search', title: 'See results before you talk to anyone', text: 'Upload a real call, get a real scorecard — right here, right now.' },
  { icon: 'pen', title: 'No jargon, no feature grid', text: 'Just what changes for your team, in plain language.' },
  { icon: 'clock', title: 'Set up in minutes, not weeks', text: 'Self-serve pricing — no sales cycle required to get started.' },
  { icon: 'email-automation', title: 'A trackable lead, not a cold quote', text: 'Tell us your volume and setup — pricing lands in your inbox, not on a public page.' },
];

const STEPS = [
  { art: 'phone', title: 'Connect a call or channel', text: 'Upload one recording, or link your voice/WhatsApp/email — no integration project needed to start.' },
  { art: 'target', title: 'AI scores every conversation', text: "CLAP, MAGIC Script or RESO reads the call and tells you what worked, what didn't, and why — in seconds." },
  { art: 'check', title: 'Your team acts on it', text: 'The best-performing script and the exact moments to fix go straight to every agent, automatically.' },
];

const FOOTNOTE = '*Illustrative — based on typical results teams see from AI-optimized scripts and collections scoring, not a guaranteed outcome for every account.';

function ProductCards({ pricing }) {
  const perMin = rate(pricing.voiceBot.perMinuteRate);
  const cards = [
    { icon: 'audit', tags: 'Service · Sales · Collections', title: 'Deep Customer Insights', lead: 'Up to 20% more sales, up to 32% more collections recovered.', star: true, text: 'Every call scored the right way, with the exact moment it went wrong.', to: 'audit', cta: 'Try it live →' },
    { icon: 'voice', title: 'Voice Bot', lead: 'Never miss a call, day or night.', text: `AI voice agents in English, Hindi or your regional language, from ₹${perMin}/minute — hear it call you before you buy.`, to: 'voice', cta: 'Try it live →' },
    { icon: 'telephony', title: 'Cloud Telephony', lead: 'Numbers that get picked up, not screened.', text: 'Built on infrastructure running a live 250+ client contact center — configured and bought online.', to: 'telephony', cta: 'Configure & buy →' },
    { icon: 'dialers', title: 'Dialers', lead: 'More live conversations per hour, fewer dead dials.', text: 'Predictive and power dialing built for the outbound floor, not a demo environment.', to: 'dialers', cta: 'See plans →' },
    { icon: 'email-automation', title: 'Email Automation', lead: 'Inbox delivery that holds up at scale.', text: 'Drip sequences and lifecycle campaigns run with the same operational discipline as our voice and chat channels.', to: 'email-automation', cta: 'See plans →' },
    { icon: 'whatsapp-api', title: 'WhatsApp Business API', lead: 'Official rates, one inbox, zero markup.', text: 'Green-tick verified API with shared team inbox, catalog and broadcast automation.', to: 'whatsapp-api', cta: 'See plans →' },
  ];
  return (
    <div className="card-grid" style={{ marginBottom: 8 }}>
      {cards.map((c) => (
        <div className="prod-card" key={c.title}>
          <IconBadge name={c.icon} />
          {c.tags && <div className="fw-tags">{c.tags}</div>}
          <h3>{c.title}</h3>
          <p><b>{c.lead}{c.star && <sup style={{ fontSize: 9 }}>*</sup>}</b> {c.text}</p>
          <GoLink to={c.to}>{c.cta}</GoLink>
        </div>
      ))}
    </div>
  );
}

/** Background video: browsers differ on when muted autoplay is allowed, so keep nudging playback for a few seconds. */
function HeroVideo({ src }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return undefined;
    v.muted = true;
    const play = () => { try { v.play()?.catch(() => {}); } catch { /* not allowed yet */ } };
    play();
    let tries = 0;
    const timer = setInterval(() => { tries += 1; if (!v.paused || tries > 20) clearInterval(timer); else play(); }, 500);
    const events = ['click', 'touchstart', 'keydown'];
    const onGesture = () => { play(); if (!v.paused) events.forEach((e) => document.removeEventListener(e, onGesture)); };
    events.forEach((e) => document.addEventListener(e, onGesture, { passive: true }));
    v.addEventListener('canplay', play);
    const onVisible = () => { if (!document.hidden) play(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      events.forEach((e) => document.removeEventListener(e, onGesture));
      document.removeEventListener('visibilitychange', onVisible);
      v.removeEventListener('canplay', play);
    };
  }, [src]);
  return (
    <video ref={ref} className="hero-bg-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
      <source src={src} />
    </video>
  );
}

export default function HomePage() {
  const { site, home, pricing } = useSite();
  const video = heroVideoUrl(home);
  return (
    <section className="page active">
      <div className="container">
        {site.sandboxBanner.show && (
          <div className="badge-row"><span className="badge">{site.sandboxBanner.text}</span></div>
        )}
        <div className="hero hero-video-hero">
          <div className="hero-video-wrap">
            {video && <HeroVideo src={video} />}
            <div className="hero-video-overlay" />
            <div className="hero-video-copy">
              <div className="eyebrow">{home.eyebrow}</div>
              <h1>{home.title}</h1>
              <p className="sub">{home.sub}</p>
              <div className="cta-row">
                <GoButton to="audit" className="btn">{home.primaryCta}</GoButton>
                <GoButton to="contact" className="btn secondary hero-video-btn-secondary">{home.secondaryCta}</GoButton>
              </div>
            </div>
          </div>
        </div>
        <div className="trust-line">{home.trustQuote}
          <div className="stat-row">
            {home.stats.map((s, i) => <span key={i}><b>{s.value}</b> {s.label}</span>)}
          </div>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <h2>What's in it for you</h2>
          <p className="section-sub">Three AI coaches, built into every call — each one answers a different question your team asks every day.</p>
          <div className="fw-grid">
            {FRAMEWORKS.map((f) => (
              <div className="fw-card" key={f.name}>
                <IconBadge name={f.icon} />
                <div className="fw-name">{f.name}</div>
                <div className="fw-for">{f.forWhom}</div>
                <div className="fw-letters">
                  {f.letters.map(([l, d], i) => (
                    <div className="fw-letter" key={i}><span className="l">{l}</span><span className="d">{d}</span></div>
                  ))}
                </div>
                <div className="fw-why">{f.why}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 14 }}>{FOOTNOTE}</p>
        </Section>

        <Section>
          <h2>Why teams switch to us</h2>
          <BenefitGrid items={WHY} />
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <h2>How it works</h2>
          <p className="section-sub">From your first call to a full rollout — three steps, no sales call required to see it happen.</p>
          <HowSteps steps={STEPS} />
        </Section>

        <Section style={{ paddingTop: 0, paddingBottom: 0 }}>
          <h2>Six products. One platform. Buy any of them online, right now.</h2>
          <p className="section-sub">Every product below has a real price, a self-serve checkout and Razorpay payment — no waiting on a sales call.</p>
        </Section>
        <ProductCards pricing={pricing} />
        <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '0 0 40px' }}>{FOOTNOTE}</p>

        <div className="cta-band">
          <h2>{home.ctaBandTitle}</h2>
          <div className="cta-row"><GoButton to="audit" className="btn">{home.ctaBandButton}</GoButton></div>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <h2>Or skip the form — book a call directly</h2>
          <p className="section-sub">Pick a day and time that works for you — we'll send a calendar invite to you and loop in our sales team automatically.</p>
          <BookCall source="home" />
        </Section>
      </div>
    </section>
  );
}

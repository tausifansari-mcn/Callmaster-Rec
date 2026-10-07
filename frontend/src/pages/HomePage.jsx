import { useSite } from '../context/SiteContext.jsx';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import BookCall from '../components/booking/BookCall.jsx';
import { IconBadge } from '../components/ui/Icons.jsx';
import { BenefitGrid, HowSteps, Section } from '../components/ui/Blocks.jsx';
import RichText from '../components/ui/RichText.jsx';

const HOME_FAQS = [
  { q: 'Is the trial really free?', a: 'Yes. Each phone number gets one free trial of Quality Audits and one of Voice Bots, with no payment details needed.' },
  { q: 'Which languages and accents do the voice bots support?', a: 'English, Hindi and Hinglish, with Indian, British or American accents. You choose the voice and upload your own script.' },
  { q: 'How do I subscribe to a plan?', a: 'Cloud Telephony and Voice Bots are self-serve — choose a plan and pay online. Quality Audits, SIP Channels and Social Listening are quoted to your volume, so send a request and our team sets up billing directly.' },
  { q: 'What happens to the recordings I upload?', a: 'They are used only to produce your result and for our team to follow up, per our Data Retention Policy.' },
  { q: 'What is the mobile look-alike number?', a: 'Cloud Telephony lines are issued as mobile-style numbers, so your customers see a number that looks like any other mobile when you call.' },
  { q: 'Can I cancel Cloud Telephony?', a: 'Yes. Cancel within 3 days of purchase for a full refund, paid within 7 working days. Email care@nimantran.ai with your company name. This applies to Cloud Telephony only.' },
  { q: 'When can I book a meeting?', a: "Monday to Saturday, 11:30 AM to 5:30 PM India time, in 30-minute slots. We're closed on Sundays, Government of India holidays and major festivals." },
];

const SERVICES = [
  { icon: 'audit', tag: 'Quality Audits', title: 'Every call scored, not just a sample', to: 'audit', cta: 'Explore Quality Audits',
    text: "Nimantran audits every call your team makes or takes — inbound, outbound sales, collections, and sales campaigns — instead of the 2% sample most quality teams manage manually. Each recording is transcribed and scored against a set of parameters, either Nimantran's built-in rubric or your own, so coaching decisions rest on full coverage instead of guesswork." },
  { icon: 'voice', tag: 'Voice Bots', title: 'Bots that actually call you', to: 'voice', cta: 'Explore Voice Bots',
    text: 'Nimantran\'s voice bots handle collections, customer service, and abandoned-cart recovery in English, Hindi, or Hinglish, with a choice of Indian, British, or American accents so the voice fits your customers, not just your product roadmap. Upload your own script and the bot is ready to place calls immediately.' },
  { icon: 'sip-channels', tag: 'SIP Channels', title: 'Concurrent-call capacity, quoted right', to: 'sip-channels', cta: 'Explore SIP Channels',
    text: "Nimantran's SIP channels give you inbound and outbound concurrent-call capacity built to the uptime standard a 24/7 contact center actually needs, not a best-effort startup SLA. Channel count and usage pattern set the price, so it's quoted to your actual volume instead of sold off a generic rate card." },
  { icon: 'social-listening', tag: 'Social Listening', title: 'The signal beyond the call', to: 'social-listening', cta: 'Explore Social Listening',
    text: "Nimantran tracks what's said about your brand across the channels people actually use to vent, not just the calls that reach your center. It's built to sit alongside the audit and voice bot modules, so a five-star call doesn't quietly mask a one-star thread elsewhere. Scope and data sources are being finalized ahead of general availability." },
];

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
  { icon: 'sip-channels', title: 'A trackable lead, not a cold quote', text: 'Tell us your volume and setup — pricing lands in your inbox, not on a public page.' },
];

const STEPS = [
  { art: 'phone', title: 'Connect a call or channel', text: 'Upload one recording, or link your voice/WhatsApp/email — no integration project needed to start.' },
  { art: 'target', title: 'AI scores every conversation', text: "CLAP, MAGIC Script or RESO reads the call and tells you what worked, what didn't, and why — in seconds." },
  { art: 'check', title: 'Your team acts on it', text: 'The best-performing script and the exact moments to fix go straight to every agent, automatically.' },
];

const FOOTNOTE = '*Illustrative — based on typical results teams see from AI-optimized scripts and collections scoring, not a guaranteed outcome for every account.';

function ServicesGrid() {
  return (
    <div className="services-grid">
      {SERVICES.map((s) => (
        <div className="service-block" key={s.tag}>
          <IconBadge name={s.icon} />
          <div className="tag">{s.tag}</div>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
          <GoLink to={s.to}>{s.cta}</GoLink>
        </div>
      ))}
      <div className="service-block wide">
        <IconBadge name="telephony" />
        <div className="tag">Cloud Telephony</div>
        <h3>Call from a number that looks like a mobile</h3>
        <p>Cloud calling lines for your team, issued as mobile-style numbers so your calls look personal from the first ring. Pay per user at ₹1,500 a month, add channels and numbers as you grow, and get 2% of your calls audited free in your first month.</p>
        <GoLink to="telephony">Explore Cloud Telephony</GoLink>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { site, home } = useSite();
  return (
    <section className="page active">
      <div className="container">
        {site.sandboxBanner.show && (
          <div className="badge-row"><span className="badge">{site.sandboxBanner.text}</span></div>
        )}

        <div className="hero-band">
          <div className="hero hero-grid">
            <div>
              <div className="eyebrow-plain">{home.eyebrow}</div>
              <h1>{home.title}</h1>
              <p className="sub">{home.sub}</p>
              <div className="cta-row">
                <GoButton to="audit" className="btn">{home.primaryCta}</GoButton>
                <GoButton to="contact" className="btn secondary">{home.secondaryCta}</GoButton>
              </div>
            </div>
            <div className="hero-mock">
              <div className="mock-head">
                <span className="mock-title">Quality Audits — sample output</span>
                <span className="mock-live"><span className="mock-dot" />Live on this site</span>
              </div>
              <div className="mock-transcript">
                Agent: Thank you for calling, this is Priya, how may I help you today?<br />
                Customer: Hi, I wanted to check on my order status...<br />
                Agent: Of course, let me pull that up. Could I get your order number?
              </div>
              <div className="mock-scores">
                <div className="mock-score"><div className="n">92</div><div className="l">Greeting</div></div>
                <div className="mock-score"><div className="n">88</div><div className="l">Resolution</div></div>
                <div className="mock-score"><div className="n">95</div><div className="l">Tone</div></div>
                <div className="mock-score"><div className="n">81</div><div className="l">Compliance</div></div>
              </div>
            </div>
          </div>
          <p className="intro-para">Nimantran brings call quality auditing, human-sounding voice bots, cloud telephony, scalable SIP channels, and social listening into one platform, built to plug into how your team already works rather than force a new one. There's no lengthy integration project or separate onboarding cycle — configure it with your own calls, scripts, and channels, and it's ready to run from day one.</p>
          <div className="stats-grid">
            {home.stats.map((s, i) => <div className="stat-card" key={i}><div className="num">{s.value}</div><div className="lbl">{s.label}</div></div>)}
          </div>
        </div>

        <Section>
          <div className="kicker">What's included</div>
          <h2>Five products, one place to run your call operations.</h2>
          <ServicesGrid />
        </Section>

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

        <Section style={{ paddingTop: 0 }}>
          <div className="kicker">Questions</div>
          <h2>What people ask before they start.</h2>
          {HOME_FAQS.map((f, i) => (
            <details className="faq-item" key={i}>
              <summary>{f.q}</summary>
              <RichText text={f.a} />
            </details>
          ))}
        </Section>

        <div className="cta-band">
          <div>
            <h2>Hear it on your own calls.</h2>
            <p>Try the live demo now, or book a 30-minute walkthrough with our team.</p>
          </div>
          <div className="cta-row">
            <GoButton to="audit" className="btn">Try the live demo</GoButton>
            <GoButton to="contact" className="btn secondary">Book a meeting</GoButton>
          </div>
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

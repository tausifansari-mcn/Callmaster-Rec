import { useSite } from '../context/SiteContext.jsx';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import { IconBadge } from '../components/ui/Icons.jsx';
import { Section } from '../components/ui/Blocks.jsx';
import { rate } from '../utils/format.js';

const FRAMEWORKS = [
  {
    icon: 'clap', name: 'CLAP', forWhom: 'For customer service',
    letters: [['C', 'the customer'], ['L', 'logistics & operations'], ['A', 'the agent'], ['P', 'the product']],
    why: "conventional QA blames the agent, because they're the only employee on the recording. CLAP separates a bad agent call from a broken product from a warehouse failure — and it usually turns out most of the problem was never the agent. We also track sentiment, predicted escalations, and social-media risk alongside it.",
  },
  {
    icon: 'magic', name: 'MAGIC Script', forWhom: 'For sales — with CRT & CST',
    letters: [
      ['CRT', 'Call Rejection Trajectory — of 100 dials, exactly where do they die?'],
      ['CST', 'Call Success Trajectory — how calls move stage to stage, to the close'],
    ],
    why: "every sales call has a skeleton — opening → context → offer → objection → rebuttal → outcome. MAGIC Script isn't a one-time playbook — CRT/CST continuously track which opening, offer and rebuttal are actually closing deals across your live portfolio right now, and feed the best-converting script back to every agent automatically. The script in front of your team is never stale, because it's rebuilt from what's actually converting today, not from what worked in the training deck six months ago.",
  },
  {
    icon: 'reso', name: 'RESO', forWhom: 'For collections & credit',
    letters: [
      ['→', 'every promise-to-pay, captured and scored for confidence'],
      ['→', 'plus any service or sales issue surfacing inside the call'],
    ],
    why: "a collections team's entire forecast is built on promises. Knowing which promises are actually likely to convert changes the forecast — and changes who gets called tomorrow.",
  },
];

function ProductCards({ pricing }) {
  const perMin = rate(pricing.voiceBot.perMinuteRate);
  return (
    <div className="card-grid">
      <div className="prod-card">
        <IconBadge name="audit" />
        <div className="fw-tags">CLAP · MAGIC/CRT/CST · RESO</div>
        <h3>Deep Customer Insights</h3>
        <p>Every call scored by the framework that actually fits it — service, sales, or collections. Full transcript, scorecard, and the exact stage where it broke.</p>
        <GoLink to="audit">Try it live →</GoLink>
      </div>
      <div className="prod-card">
        <IconBadge name="voice" />
        <h3>Voice Bot</h3>
        <p>AI voice agents in English, Hindi and your regional language, from ₹{perMin}/minute. Hear it call your own number before you commit to anything.</p>
        <GoLink to="voice">Try it live →</GoLink>
      </div>
      <div className="prod-card">
        <IconBadge name="telephony" />
        <h3>Cloud Telephony</h3>
        <p>Mobile look-alike numbers on infrastructure built for a live 250+ client contact center — not a lab. Licenses, channels and DIDs, configured and bought online.</p>
        <GoLink to="telephony">Configure &amp; buy →</GoLink>
      </div>
      <div className="prod-card">
        <IconBadge name="dialers" />
        <h3>Dialers</h3>
        <p>Predictive and power dialing that keeps agents talking to live prospects instead of dialing dead numbers. Built for the outbound floor, not a demo environment.</p>
        <GoLink to="dialers">See plans →</GoLink>
      </div>
      <div className="prod-card">
        <IconBadge name="email-automation" />
        <h3>Email Automation</h3>
        <p>Drip sequences, deliverability monitoring and lifecycle campaigns run at BPO scale, with the same operational discipline behind our voice and chat channels.</p>
        <GoLink to="email-automation">See plans →</GoLink>
      </div>
      <div className="prod-card">
        <IconBadge name="whatsapp-api" />
        <h3>WhatsApp Business API</h3>
        <p>Official green-tick verified API, shared team inbox, catalog and broadcast automation — priced transparently at Meta's own conversation rates.</p>
        <GoLink to="whatsapp-api">See plans →</GoLink>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { site, home, pricing } = useSite();
  return (
    <section className="page active">
      <div className="container">
        {site.sandboxBanner.show && (
          <div className="badge-row"><span className="badge">{site.sandboxBanner.text}</span></div>
        )}
        <div className="hero">
          <div className="eyebrow">{home.eyebrow}</div>
          <h1>{home.title}</h1>
          <p className="sub">{home.sub}</p>
          <div className="cta-row">
            <GoButton to="audit" className="btn">{home.primaryCta}</GoButton>
            <GoButton to="contact" className="btn secondary">{home.secondaryCta}</GoButton>
          </div>
        </div>
        <div className="trust-line">{home.trustQuote}
          <div className="stat-row">
            {home.stats.map((s, i) => <span key={i}><b>{s.value}</b> {s.label}</span>)}
          </div>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <h2>The frameworks — this is the part nobody else has</h2>
          <p className="section-sub">A software company cannot invent these; they have to be earned on the floor. This is our moat, and every product on this site is built around it — not the other way round.</p>
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
                <div className="fw-why"><b>Why it matters:</b> {f.why}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <h2>What you get from us in the next 30 seconds</h2>
          <ul className="bullet-list">
            <li><b>Understand what you get, fast</b> — no feature grid, no jargon-off against companies with fifty times our engineering budget. Just what changes for you.</li>
            <li><b>Try it on your own data</b> — upload a real call and get a real scorecard, right here, before you talk to anyone.</li>
            <li><b>The frameworks, in our language</b> — CLAP, MAGIC Script and RESO, not "AI-powered sentiment analytics."</li>
            <li><b>A trackable lead, not a cold quote</b> — tell us your volume and setup, and pricing lands in your inbox, not on a public page.</li>
          </ul>
        </Section>

        <Section style={{ paddingTop: 0, paddingBottom: 0 }}>
          <h2>Six products. One platform. Buy any of them online, right now.</h2>
          <p className="section-sub">Every product below has a real price, a self-serve checkout and Razorpay payment — no waiting on a sales call.</p>
        </Section>
        <ProductCards pricing={pricing} />

        <div className="cta-band">
          <h2>{home.ctaBandTitle}</h2>
          <div className="cta-row"><GoButton to="audit" className="btn">{home.ctaBandButton}</GoButton></div>
        </div>
      </div>
    </section>
  );
}

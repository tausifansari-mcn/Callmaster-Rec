import { useSite } from '../context/SiteContext.jsx';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
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
  {
    to: 'audit', tag: 'Quality Audits', title: 'Every call scored, not just a sample', cta: 'Explore Quality Audits',
    img: 'nimantran-home-audits.webp',
    alt: 'Smiling agent on a call beside call recordings, transcript, sentiment scores and a quality score of 92',
    text: 'Score every inbound and outbound call, not a 2% sample. Get a transcript, sentiment and quality score for each recording, with your own parameters.',
  },
  {
    to: 'voice', tag: 'Voice Bots', title: 'Bots that actually call you', cta: 'Explore Voice Bots',
    img: 'nimantran-home-voicebot.webp',
    alt: 'Friendly AI voice bot at a laptop handling collections, customer service and cart recovery calls in English, Hindi and Hinglish',
    text: 'Voice bots for collections, service and cart recovery in English, Hindi or Hinglish. Choose the voice, upload a script and get a live call on your phone.',
  },
  {
    to: 'sip-channels', tag: 'SIP Channels', title: 'Concurrent-call capacity, quoted right', cta: 'Explore SIP Channels',
    img: 'nimantran-home-sip.webp',
    alt: 'Row of desk phones connected through the cloud to a dashboard showing concurrent calls and call capacity',
    text: 'SIP channels sized to your calling volume. Tell us how many concurrent calls you run and get a quote.',
  },
  {
    to: 'social-listening', tag: 'Social Listening', title: 'The signal beyond the call', cta: 'Explore Social Listening',
    img: 'nimantran-home-social.webp',
    alt: 'Social media posts and call recordings flowing into one dashboard of brand sentiment and mentions',
    text: 'Track what people say about your brand on social channels and read it next to what customers say on calls.',
  },
  {
    to: 'telephony', tag: 'Cloud Telephony', title: 'Call from a number that looks like a mobile', cta: 'Explore Cloud Telephony',
    img: 'nimantran-home-telephony.webp', wide: true,
    alt: 'Agent on a call with a list of mobile-style numbers routed through the cloud to a customer phone showing an incoming call',
    text: 'Cloud calling lines issued as mobile-style numbers, so customers see a number they are more likely to answer.',
  },
];

const STEPS = [
  { n: '01', img: 'nimantran-step-1.webp', title: 'Connect your conversations', text: 'Upload a recording or connect your calling channels. Start with the conversations you already have.', alt: 'Dashboard where recordings are uploaded, calling channels are connected and CRM data is imported to start listening' },
  { n: '02', img: 'nimantran-step-2.webp', title: 'Let intelligence do the listening', text: "AI identifies what worked, what didn't, and what your customers are really telling you.", alt: 'AI reads each call into a summary, transcript, sentiment, key topics and insights on one dashboard' },
  { n: '03', img: 'nimantran-step-3.webp', title: 'Make every next call better', text: 'Turn insights into coaching, stronger scripts, and more meaningful customer connections.', alt: 'Agent on a call with insights, a recommended script and coaching tips that lead to better calls' },
];

/** Sits inside the split home-sample fragment pair, which opens a wrapper in -a and closes it in -b. */
const AUDIT_SAMPLE_PIC = `<figure class="hs-pic"><img src="/assets/images/nimantran-audit-sample.webp" alt="Quality Audits sample output: call waveform, transcript, overall sentiment 92% positive, key topics, compliance checks and greeting, resolution, tone and compliance scores" loading="lazy" decoding="async"></figure>`;

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="rgba(143,217,230,.18)" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="#E2B89C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HomePage() {
  const { site, home } = useSite();
  return (
    <section className="page active">
      {site.sandboxBanner.show && (
        <div className="badge-row"><span className="badge">{site.sandboxBanner.text}</span></div>
      )}

      <div className="hero-band hero-dark">
        <div className="wrap hero">
          <div className="hero-grid">
            <ThemeFragment name="home-video" />
            <div>
              <h1><span className="h1l">AI Contact Centre Solutions.</span> <span className="h1l">Experience Them Before You Buy.</span></h1>
              <ThemeFragment name="home-pitch" />
              <div className="hero-cta">
                <GoButton to="audit" className="btn btn-primary">Try the live demo</GoButton>
                <GoButton to="contact" className="btn btn-outline">Talk to sales</GoButton>
              </div>
              <div className="hero-badges">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="#E9E0CD" />
                    <path d="M7.5 12.5l3 3 6-6.5" stroke="#2F6B42" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  ISO 27001:2022 certified
                </span>
              </div>
            </div>
          </div>

          <ThemeFragment name="home-intro" />

          <div className="stat-row">
            {home.stats.map((s, i) => (
              <div className="stat-tile" key={i}><div className="num">{s.value}</div><div className="lbl">{s.label}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap prod-wrap" style={{ padding: '72px 28px 64px' }}>
        <div className="section-head" style={{ marginBottom: 0 }}>
          <div className="kicker">What&apos;s included</div>
          <h2>Five products, one place to run your call operations.</h2>
        </div>

        <div className="services-grid sb-grid">
          {SERVICES.map((s) => (
            <div className={`service-block sb${s.wide ? ' wide' : ''}`} key={s.tag}>
              <img className="sb-bg" src={`/assets/images/${s.img}`} alt={s.alt} loading="lazy" decoding="async" />
              <div className="sb-shade" aria-hidden="true" />
              <div className="sb-copy">
                <div className="tag">{s.tag}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <GoLink to={s.to} className="sb-link">{s.cta}</GoLink>
              </div>
            </div>
          ))}
        </div>

        <ThemeFragment parts={['home-sample-a', AUDIT_SAMPLE_PIC, 'home-sample-b']} />

        <section className="how" aria-labelledby="how-h">
          <div className="section-head center">
            <div className="kicker">How it works</div>
            <h2 id="how-h">From conversation to transformation.</h2>
            <p>No lengthy integration project. No starting over.<br />Just smarter ways to do what you already do.</p>
          </div>
          <ol className="steps">
            {STEPS.map((s) => (
              <li className="st" key={s.n}>
                <img className="sb-bg" src={`/assets/images/${s.img}`} alt={s.alt} loading="lazy" decoding="async" />
                <div className="sb-shade" aria-hidden="true" />
                <div className="st-copy">
                  <span className="step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="heart" aria-labelledby="heart-h">
          <div className="heart-grid">
            <div>
              <div className="kicker">Technology with a human heart</div>
              <div className="big"><b>23+</b><span>Years of real human connection</span></div>
              <h2 id="heart-h">We know the people. Not just the patterns.</h2>
              <p>Great customer experiences don&apos;t start with an algorithm. They start with understanding.</p>
              <p>We bring 23 years of contact center experience to every insight, every call, and every connection.</p>
              <GoButton to="why" className="btn btn-light" style={{ marginTop: 10 }}>The experience behind the AI</GoButton>
            </div>
            <ul className="pillars">
              <li><Tick />Built by contact center experts</li>
              <li><Tick />Designed around your customers</li>
              <li><Tick />Intelligence your team can act on</li>
            </ul>
          </div>
        </section>

        <div className="section-head" style={{ margin: '84px 0 0' }}>
          <div className="kicker">Questions</div>
          <h2>What people ask before they start.</h2>
        </div>
        <div className="faq">
          {HOME_FAQS.map((f, i) => (
            <details key={i}>
              <summary>{f.q}</summary>
              <RichText text={f.a} />
            </details>
          ))}
        </div>

        <div className="cta-band" style={{ marginTop: 72 }}>
          <div>
            <h2>Hear it on your own calls.</h2>
            <p>Try the live demo now, or book a 30-minute walkthrough with our team.</p>
          </div>
          <div className="hero-cta">
            <GoButton to="audit" className="btn btn-light">Try the live demo</GoButton>
            <GoButton to="contact" className="btn btn-ghost-light">Book a meeting</GoButton>
          </div>
        </div>

      </div>
    </section>
  );
}

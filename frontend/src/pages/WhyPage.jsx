import { useSite } from '../context/SiteContext.jsx';
import { GoButton } from '../hooks/useGoto.jsx';

const WAVE_BARS = [24, 10, 32, 27, 37, 10, 42, 26, 28, 43, 10, 23, 10];

export default function WhyPage() {
  const { home } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <div className="why-hero">
          <div>
            <div className="kicker" style={{ color: 'var(--accent-clay-dark)' }}>Why Nimantran</div>
            <h1>We understood the conversation. Then we built the intelligence.</h1>
            <p className="sub">AI call intelligence, built by a company that has run contact centers for 23 years.</p>
            <div className="cta-row">
              <GoButton to="contact" className="btn">Talk to sales</GoButton>
              <GoButton to="contact" className="btn secondary">Book a meeting</GoButton>
            </div>
            <div className="why-quotes">
              <p>Technology grounded in the real world, not just the next big idea.</p>
              <p>People first. Always.</p>
            </div>
          </div>
          <div className="why-visual">
            <div className="why-orb">
              <div className="wave" aria-hidden="true">
                {WAVE_BARS.map((h, i) => <i key={i} style={{ '--h': h, '--d': ((i * 41) % 150) / 100 }} />)}
              </div>
            </div>
            <div className="float-chip fc1"><span className="dot" />Customer sentiment: Positive</div>
            <div className="float-chip fc2">23+ years of conversations</div>
          </div>
        </div>

        <div className="why-story">
          <h2>Built by people who've been on your side of the call.</h2>
          <div className="why-copy">
            <p className="lead-line">Behind every conversation is a person.</p>
            <p>And behind every contact center is a team trying to make those conversations better.</p>
            <p>Nimantran brings quality auditing, voice bots, telephony and call capacity together, built to plug into how your team already works.</p>
            <div className="why-solutions">
              <GoButton to="audit">Quality Audits</GoButton>
              <GoButton to="voice">Voice Bots</GoButton>
              <GoButton to="telephony">Cloud Telephony</GoButton>
              <GoButton to="sip-channels">SIP Channels</GoButton>
              <GoButton to="social-listening">Social Listening</GoButton>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: 0 }}>
          {home.stats.map((s, i) => <div className="stat-card" key={i}><div className="num">{s.value}</div><div className="lbl">{s.label}</div></div>)}
        </div>

        <div className="why-experience">
          <div>
            <h2>Experience the difference.</h2>
            <p>Bring your own call, your own script, your own challenge.</p>
            <p>See what changes when intelligence meets experience.</p>
          </div>
          <GoButton to="contact" className="btn">Meet our team</GoButton>
        </div>

        <div className="cta-band" style={{ margin: '40px 0 40px' }}>
          <div>
            <h2>Your next great conversation starts here.</h2>
            <p>See what Nimantran can do with your own calls.</p>
          </div>
          <div className="cta-row">
            <GoButton to="contact" className="btn secondary">Let's talk possibilities</GoButton>
          </div>
        </div>
      </div>
    </section>
  );
}

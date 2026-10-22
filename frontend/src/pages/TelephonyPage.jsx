import { PageHero, Section } from '../components/ui/Blocks.jsx';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import TelephonyCalculator from '../components/calculators/TelephonyCalculator.jsx';

export default function TelephonyPage() {
  
  return (
    <section className="page active">
      <div className="container">
        <ThemeFragment name="ct-banner" />

        <PageHero eyebrow="Cloud Telephony" title="Call from a number that looks like a mobile.">
          Nimantran Cloud Telephony gives every agent a cloud calling line with a mobile-style number. Your customers see a number that looks like any other mobile, not an unfamiliar landline or service series.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Mobile look-alike number</span><span className="chip">Pay per user</span><span className="chip">Add channels and numbers as you grow</span>
        </div>

        <ThemeFragment name="ov-telephony" />
        <ThemeFragment name="ct-media" />
        <ThemeFragment name="ct-strip" />

        <Section style={{ paddingTop: 0 }}>
          <div className="usp-band">
            <div>
              <h2>The number that looks like a mobile.</h2>
              <p>Most business calls come from numbers people ignore. Cloud Telephony lines are issued as mobile-style numbers, so your calls look personal from the first ring.</p>
            </div>
            <ul>
              <li>One licence per agent, billed monthly</li>
              <li>Add concurrent channels when call volume grows</li>
              <li>Add extra numbers (DIDs) for teams or campaigns</li>
            </ul>
          </div>
        </Section>

        <Section id="telephony-pricing">
          <h2>Configure &amp; buy online</h2>
          <div className="offer-card">
            <div className="offer-badge">Welcome offer</div>
            <h3>2% of your calls audited free in your first month.</h3>
            <p>New Cloud Telephony customers get Nimantran Quality Audits (CLAP / MAGIC Script / RESO) on 2% of their calls for the first month. We share the results with you, at no extra charge.</p>
          </div>
          <p className="no-price-note">Set your licenses, channels and numbers below — the price updates as you go. Pay online and you're provisioning immediately.</p>
          <TelephonyCalculator />
        </Section>

        <ThemeFragment name="tail-telephony" />
      </div>
    </section>
  );
}

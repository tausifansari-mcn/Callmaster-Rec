import { useSite } from '../context/SiteContext.jsx';
import { BenefitGrid, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import TelephonyCalculator from '../components/calculators/TelephonyCalculator.jsx';

export default function TelephonyPage() {
  const { faqs } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="telephony" illo="telephony" eyebrow="The number that gets answered" title="A Phone Number Your Customers Actually Pick Up.">
          CallMaster Cloud Telephony runs your inbound and outbound calling on the same high-uptime infrastructure powering a live 250+ client contact center operation — configured, priced and paid for online, in minutes, not a sales cycle.
        </PageHero>

        <Section style={{ paddingTop: 0 }}>
          <div className="ct-usp-band">
            <div className="ct-usp-badge">THE CALLMASTER USP</div>
            <h2 style={{ margin: '6px 0 8px' }}>The Mobile Look-Alike Number</h2>
            <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', margin: 0, maxWidth: '64ch' }}>
              A 1800 number gets ignored. A landline pattern gets screened. Our numbers are formatted to look like an everyday 10-digit mobile number — so it gets answered like one. Same infrastructure, same call quality, dramatically better pick-up rates.
            </p>
          </div>
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <h2>What you get</h2>
          <BenefitGrid items={[
            { icon: 'cloud', title: 'The mobile look-alike number', text: "The single biggest lever for answer rates we've found in 23 years of running the floor." },
            { icon: 'audit', title: 'Built for scale, not a lab', text: 'Inbound and outbound calling infrastructure for real production volume.' },
            { icon: 'clock', title: 'Recording & monitoring', text: 'On every line, integration-ready for your CRM and dialer stack.' },
            { icon: 'clap', title: '2% of volume, auto-audited', text: 'Deep Customer Insights scoring (CLAP / MAGIC Script / RESO) included at no extra charge.' },
          ]} />
        </Section>

        <Section id="telephony-pricing">
          <h2>Configure &amp; buy online</h2>
          <div className="welcome-offer-box">
            <div className="wob-badge">🎁 Welcome offer — new Cloud Telephony customers</div>
            <h3>Your first month, audited for free</h3>
            <p>We'll automatically audit 2% of your calls through Deep Customer Insights (CLAP / MAGIC Script / RESO) for your first billing month and share the full results with you — no extra charge, no setup needed.</p>
          </div>
          <p className="no-price-note">Set your licenses, channels and numbers below — the price updates as you go. Pay online and you're provisioning immediately.</p>
          <TelephonyCalculator />
        </Section>

        <FaqSection items={faqs.telephony} />
      </div>
    </section>
  );
}

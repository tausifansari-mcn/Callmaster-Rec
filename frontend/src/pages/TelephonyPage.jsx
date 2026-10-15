import { useSite } from '../context/SiteContext.jsx';
import { BenefitGrid, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import TelephonyCalculator from '../components/calculators/TelephonyCalculator.jsx';

const HIGHLIGHTS = [
  { icon: 'telephony', title: 'Mobile look-alike numbers', text: 'Calls show up like a normal mobile number, not an unfamiliar landline or service series.' },
  { icon: 'user', title: 'One licence per agent', text: '₹1,500 per user per month. Add or remove agents as the team changes.' },
  { icon: 'bars3', title: 'Add channels as you grow', text: 'Increase concurrent call capacity when volume rises, without replacing the setup.' },
  { icon: 'users', title: 'Extra numbers for teams', text: 'Give each team or campaign its own number so you can see what works.' },
  { icon: 'cloud', title: 'Works from anywhere', text: 'Agents call from a laptop or phone, at the office or from home.' },
  { icon: 'circle-check', title: 'Audits included in month one', text: 'New customers get 2% of calls audited free in the first month, with results shared.' },
];

export default function TelephonyPage() {
  const { faqs } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="telephony" illo="telephony" eyebrow="The number that gets answered" title="A Phone Number Your Customers Actually Pick Up.">
          Nimantran Cloud Telephony runs your inbound and outbound calling on the same high-uptime infrastructure powering a live 250+ client contact center operation — configured, priced and paid for online, in minutes, not a sales cycle.
        </PageHero>

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

        <Section style={{ paddingTop: 0 }}>
          <h2>What you get</h2>
          <BenefitGrid items={[
            { icon: 'cloud', title: 'The mobile look-alike number', text: "The single biggest lever for answer rates we've found in 23 years of running the floor." },
            { icon: 'audit', title: 'Built for scale, not a lab', text: 'Inbound and outbound calling infrastructure for real production volume.' },
            { icon: 'clock', title: 'Recording & monitoring', text: 'On every line, integration-ready for your CRM and dialer stack.' },
            { icon: 'clap', title: '2% of volume, auto-audited', text: 'Quality Audits scoring (CLAP / MAGIC Script / RESO) included at no extra charge.' },
          ]} />
        </Section>

        <Section style={{ paddingTop: 0 }}>
          <h2>Highlights</h2>
          <BenefitGrid items={HIGHLIGHTS} />
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

        <FaqSection items={faqs.telephony} />
      </div>
    </section>
  );
}

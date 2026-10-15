import { useSite } from '../context/SiteContext.jsx';
import { GoButton } from '../hooks/useGoto.jsx';
import { BenefitGrid, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import ProductOverview from '../components/ui/ProductOverview.jsx';
import TelephonyCalculator from '../components/calculators/TelephonyCalculator.jsx';

const OV_STEPS = [
  { title: 'Choose your setup', text: 'Pick licences, channels and numbers below.' },
  { title: 'See the price', text: 'The estimate updates as you change the numbers.' },
  { title: 'Request the plan', text: 'Our team confirms and sets you up. Billing is direct.' },
];

const HIGHLIGHTS = [
  { title: 'Mobile look-alike numbers', text: 'Calls show up like a normal mobile number, not an unfamiliar landline or service series.' },
  { title: 'One licence per agent', text: '₹1,500 per user per month. Add or remove agents as the team changes.' },
  { title: 'Add channels as you grow', text: 'Increase concurrent call capacity when volume rises, without replacing the setup.' },
  { title: 'Extra numbers for teams', text: 'Give each team or campaign its own number so you can see what works.' },
  { title: 'Works from anywhere', text: 'Agents call from a laptop or phone, at the office or from home.' },
  { title: 'Audits included in month one', text: 'New customers get 2% of calls audited free in the first month, with results shared.' },
];

export default function TelephonyPage() {
  const { faqs } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Cloud Telephony" title="Call from a number that looks like a mobile.">
          Nimantran Cloud Telephony gives every agent a cloud calling line with a mobile-style number. Your customers see a number that looks like any other mobile, not an unfamiliar landline or service series.
        </PageHero>
        <div className="chip-row">
          <span className="chip">Mobile look-alike number</span><span className="chip">Pay per user</span><span className="chip">Add channels and numbers as you grow</span>
        </div>

        <ProductOverview
          illo="telephony"
          title="What Cloud Telephony gives you"
          lead="Cloud Telephony gives every agent a calling line in the cloud, with no hardware and no desk phones. Lines are issued as mobile-style numbers, so customers see a number that looks personal and is more likely to be picked up."
          steps={OV_STEPS}
          highlights={HIGHLIGHTS}
          tryTitle="Ready to size your setup?"
          tryText="Choose licences, channels and numbers below and see the price update."
          tryCta="Configure your plan"
          tryHref="#telephony-pricing"
        />

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

        <div className="cta-band">
          <div>
            <h2>Give every agent a number customers pick up.</h2>
            <p>Configure your setup and see the price, or book a meeting and we will size it to your team.</p>
          </div>
          <div className="cta-row">
            <GoButton to="contact" className="btn">Book a meeting</GoButton>
            <GoButton to="contact" className="btn secondary">Contact us</GoButton>
          </div>
        </div>
      </div>
    </section>
  );
}

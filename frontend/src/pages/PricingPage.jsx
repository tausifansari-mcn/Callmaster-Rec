import { useSite } from '../context/SiteContext.jsx';
import { GoButton } from '../hooks/useGoto.jsx';
import { IconBadge } from '../components/ui/Icons.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';
import { money, rate } from '../utils/format.js';

export default function PricingPage() {
  const { pricing } = useSite();
  const { telephony, dialers, voiceBot, emailAutomation, whatsapp } = pricing;
  const lastTier = dialers.tiers[dialers.tiers.length - 1];
  const cheapest = (plans) => Math.min(...plans.filter((p) => !p.contactOnly).map((p) => p.price));

  const cards = [
    { icon: 'audit', title: 'Deep Customer Insights', text: 'Priced per minute audited, by call type and volume.', to: 'audit', anchor: 'audit-pricing', cta: 'Get Insights pricing' },
    { icon: 'voice', title: 'Voice Bot', text: `Setup from ${money(voiceBot.setupFee)} one-time, then ₹${rate(voiceBot.perMinuteRate)}/minute — buy online in minutes, or request a callback instead.`, to: 'voice', anchor: 'voice-pricing', cta: 'Get Voice Bot pricing' },
    { icon: 'dialers', title: 'Dialers', text: `Predictive & power dialers from ${money(lastTier.rate)}/agent/month at ${lastTier.min}–${lastTier.max} seats, self-serve checkout.`, to: 'dialers', anchor: 'dialers-pricing', cta: 'Get Dialer pricing' },
    { icon: 'email-automation', title: 'Email Automation', text: `Sequences & deliverability monitoring from ${money(cheapest(emailAutomation.plans))}/month, self-serve checkout.`, to: 'email-automation', anchor: 'email-pricing', cta: 'Get Email Automation pricing' },
    { icon: 'whatsapp-api', title: 'WhatsApp Business API', text: `Official API access from ${money(cheapest(whatsapp.plans))}/month, self-serve checkout.`, to: 'whatsapp-api', anchor: 'whatsapp-pricing', cta: 'Get WhatsApp API pricing' },
    { icon: 'telephony', title: 'Cloud Telephony', text: `From ${money(telephony.licenseRate)}/license/month, with the mobile look-alike number as standard — configure and pay online.`, to: 'telephony', anchor: 'telephony-pricing', cta: 'Configure & buy' },
  ];

  return (
    <section className="page active">
      <div className="container">
        <PageHero title="We Don't Publish Rates Here.">
          Per-minute pricing depends on your volume and setup — tell us a bit about your requirement and we'll send exact numbers to your official email ID.
        </PageHero>
        <div className="price-cta-grid">
          {cards.map((c) => (
            <div className="price-cta-card" key={c.title}>
              <IconBadge name={c.icon} />
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <GoButton to={c.to} anchor={c.anchor} className="btn secondary">{c.cta}</GoButton>
            </div>
          ))}
        </div>
        <Section>
          <h2>Enterprise tier</h2>
          <p className="table-scroll-hint">&larr; swipe to see all columns &rarr;</p>
          <div className="table-scroll">
            <table className="pricing-table">
              <thead><tr><th></th><th>Standard</th><th>Enterprise</th></tr></thead>
              <tbody>
                <tr><td>Pricing</td><td>Pay-as-you-go, quoted to your volume</td><td>Custom, volume-based contract</td></tr>
                <tr><td>Onboarding</td><td>Self-serve</td><td>Dedicated onboarding &amp; integration support</td></tr>
                <tr><td>Support</td><td>Email/chat support</td><td>Dedicated account manager, SLA-backed</td></tr>
                <tr><td>Customization</td><td>Standard options</td><td>Custom scripts, voice cloning, scoring parameters</td></tr>
                <tr><td>Ideal for</td><td>Small teams, pilots</td><td>BPOs, enterprises, high-volume operations</td></tr>
              </tbody>
            </table>
          </div>
          <GoButton to="contact" className="btn">Talk to Enterprise Sales</GoButton>
        </Section>
      </div>
    </section>
  );
}

import { useSite } from '../context/SiteContext.jsx';
import { BulletList, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import DialersCalculator from '../components/calculators/DialersCalculator.jsx';
import { money } from '../utils/format.js';

export default function DialersPage() {
  const { pricing, faqs } = useSite();
  const { tiers } = pricing.dialers;
  const lastMax = Math.max(...tiers.map((t) => t.max));
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="dialers" title="Predictive & Power Dialers That Keep Agents Talking, Not Dialing.">
          Predictive, power and preview dialing modes with built-in DNC scrubbing and call pacing — every connected call flows straight into Deep Customer Insights scoring.
        </PageHero>
        <Section style={{ paddingTop: 0 }}>
          <h2>What you get</h2>
          <BulletList items={[
            'Predictive, power and preview dialing modes',
            'Automatic DNC (Do-Not-Call) list scrubbing and call pacing',
            'Local presence / caller ID management',
            'Real-time agent dashboard with live-call barge/whisper',
            'Every connected call feeds straight into Deep Customer Insights scoring',
          ]} />
        </Section>
        <Section id="dialers-pricing">
          <h2>Configure &amp; buy online</h2>
          <p className="no-price-note">The more seats you run, the lower your per-agent rate — set your agent count below and the price updates automatically. Pay online and you're provisioning immediately.</p>
          <div className="table-scroll" style={{ marginBottom: 20 }}>
            <table className="pricing-table">
              <thead><tr><th>Agent seats</th><th>Rate</th></tr></thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.min}><td>{t.min}–{t.max} agents</td><td>{money(t.rate)} /agent/month</td></tr>
                ))}
                <tr><td>More than {lastMax} agents</td><td>Custom — talk to sales</td></tr>
              </tbody>
            </table>
          </div>
          <DialersCalculator />
        </Section>
        <FaqSection items={faqs.dialers} />
      </div>
    </section>
  );
}

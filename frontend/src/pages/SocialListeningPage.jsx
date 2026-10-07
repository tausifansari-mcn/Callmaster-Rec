import { GoButton } from '../hooks/useGoto.jsx';
import { PageHero, Section } from '../components/ui/Blocks.jsx';

const EXAMPLES = [
  { stat: '+18%', label: 'Example: mention volume, week over week' },
  { stat: '72%', label: 'Example: positive sentiment share' },
  { stat: '4 min', label: 'Example: average time to flag a negative spike' },
];

export default function SocialListeningPage() {
  return (
    <section className="page active">
      <div className="container">
        <PageHero icon="social-listening" eyebrow="Social Listening" title="Your call center isn't the only place customers complain.">
          Nimantran tracks what's said about you across the channels people actually vent on, so a five-star call doesn't mask a one-star thread somewhere else. Scope and data sources are being finalized ahead of general availability.
        </PageHero>

        <Section style={{ paddingTop: 0 }}>
          <div className="insight-grid">
            {EXAMPLES.map((x) => (
              <div className="insight-card" key={x.label}>
                <div className="stat">{x.stat}</div>
                <div className="lbl">{x.label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 10 }}>Illustrative numbers — Social Listening hasn't launched yet, so nothing above reflects real data.</p>
          <div className="cta-row" style={{ marginTop: 24 }}>
            <GoButton to="contact" className="btn">Talk to Sales</GoButton>
          </div>
        </Section>
      </div>
    </section>
  );
}

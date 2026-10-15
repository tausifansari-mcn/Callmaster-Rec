import { useSite } from '../context/SiteContext.jsx';
import { GoButton } from '../hooks/useGoto.jsx';
import { BenefitGrid, FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';

const EXAMPLES = [
  { stat: '+18%', label: 'Example: mention volume, week over week' },
  { stat: '72%', label: 'Example: positive sentiment share' },
  { stat: '4 min', label: 'Example: average time to flag a negative spike' },
];

const HIGHLIGHTS = [
  { icon: 'social-listening', title: 'Mentions in one view', text: 'See what is being said about your brand across the places people post.' },
  { icon: 'magic', title: 'Sentiment, not just volume', text: 'Know whether a rise in mentions is praise or a problem.' },
  { icon: 'clap', title: 'Spike alerts', text: 'Be told when negative mentions climb, so you can respond early.' },
  { icon: 'audit', title: 'Tie it back to calls', text: 'Compare public sentiment with call quality to see where they diverge.' },
  { icon: 'users', title: 'Brand and competitor view', text: 'Watch your brand and the names you compete with.' },
  { icon: 'circle-check', title: 'Early-access pricing', text: 'Join early to shape the product and lock in better terms.' },
];

export default function SocialListeningPage() {
  const { faqs } = useSite();
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

        <Section style={{ paddingTop: 0 }}>
          <h2>Highlights</h2>
          <BenefitGrid items={HIGHLIGHTS} />
        </Section>

        <FaqSection items={faqs.social} />
      </div>
    </section>
  );
}

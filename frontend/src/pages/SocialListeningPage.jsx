import { useSite } from '../context/SiteContext.jsx';
import { GoButton } from '../hooks/useGoto.jsx';
import { FaqSection, PageHero, Section } from '../components/ui/Blocks.jsx';
import ProductOverview from '../components/ui/ProductOverview.jsx';

const EXAMPLES = [
  { stat: '+18%', label: 'Example: mention volume, week over week' },
  { stat: '72%', label: 'Example: positive sentiment share' },
  { stat: '4 min', label: 'Example: average time to flag a negative spike' },
];

const OV_STEPS = [
  { title: 'Share what to track', text: 'Brand names, products and competitors.' },
  { title: 'We set up the feed', text: 'Scope and sources are agreed with you.' },
  { title: 'Review and respond', text: 'See mentions and sentiment, and act on spikes.' },
];

const HIGHLIGHTS = [
  { title: 'Mentions in one view', text: 'See what is being said about your brand across the places people post.' },
  { title: 'Sentiment, not just volume', text: 'Know whether a rise in mentions is praise or a problem.' },
  { title: 'Spike alerts', text: 'Be told when negative mentions climb, so you can respond early.' },
  { title: 'Tie it back to calls', text: 'Compare public sentiment with call quality to see where they diverge.' },
  { title: 'Brand and competitor view', text: 'Watch your brand and the names you compete with.' },
  { title: 'Early-access pricing', text: 'Join early to shape the product and lock in better terms.' },
];

export default function SocialListeningPage() {
  const { faqs } = useSite();
  return (
    <section className="page active">
      <div className="container">
        <PageHero eyebrow="Social Listening" title="Your call center isn't the only place customers complain.">
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

        <ProductOverview
          illo="social"
          title="What Social Listening shows you"
          lead="The call is only one place a customer talks about you. Social Listening tracks public mentions of your brand, so a five-star call does not hide a one-star thread elsewhere. It is being prepared for general availability, and early-access conversations are open."
          steps={OV_STEPS}
          highlights={HIGHLIGHTS}
          tryTitle="Interested in early access?"
          tryText="Tell us what to track and we will set up a walkthrough."
          tryCta="Join early access"
          tryTo="contact"
        />

        <FaqSection items={faqs.social} />

        <div className="cta-band">
          <div>
            <h2>Hear what customers say when they are not on the phone.</h2>
            <p>Join early access, or book a meeting to see how it fits with your calls.</p>
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

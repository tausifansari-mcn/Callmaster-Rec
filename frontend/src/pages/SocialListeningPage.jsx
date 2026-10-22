import { PageHero } from '../components/ui/Blocks.jsx';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';

export default function SocialListeningPage() {
  return (
    <section className="page active">
      <div className="container">
        <ThemeFragment name="soc-banner" />

        <PageHero eyebrow="Social Listening" title="Your call center isn't the only place customers complain.">
          Nimantran tracks what's said about you across the channels people actually vent on, so a five-star call doesn't mask a one-star thread somewhere else. Scope and data sources are being finalized ahead of general availability.
        </PageHero>

        <ThemeFragment name="ov-social" />

        <ThemeFragment name="soc-media" />
        <ThemeFragment name="tail-social" />
      </div>
    </section>
  );
}

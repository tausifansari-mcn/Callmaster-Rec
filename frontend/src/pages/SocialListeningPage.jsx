import ThemeFragment from '../components/ui/ThemeFragment.jsx';

export default function SocialListeningPage() {
  return (
    <section className="wrap section pc-page">
      <ThemeFragment name="soc-banner" />
      <div className="section-head">
        <div className="kicker">Social Listening</div>
        <h1>Your call center isn't the only place customers complain.</h1>
        <p>Nimantran tracks what's said about you across the channels people actually vent on, so a five-star call doesn't mask a one-star thread somewhere else. Scope and data sources are being finalized ahead of general availability.</p>
      </div>
      <ThemeFragment name="ov-social" />
      <div className="grid4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="insight-card"><div className="stat">+18%</div><div className="lbl">Example: mention volume, week over week</div></div>
        <div className="insight-card"><div className="stat">72%</div><div className="lbl">Example: positive sentiment share</div></div>
        <div className="insight-card"><div className="stat">4 min</div><div className="lbl">Example: average time to flag a negative spike</div></div>
      </div>
      <ThemeFragment name="soc-media" />
      <ThemeFragment name="tail-social" />
    </section>
  );
}

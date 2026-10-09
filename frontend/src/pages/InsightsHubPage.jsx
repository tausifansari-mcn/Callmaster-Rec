import { Link } from 'react-router-dom';
import { Section } from '../components/ui/Blocks.jsx';
import { INSIGHTS } from '../data/insights.js';

export default function InsightsHubPage() {
  return (
    <section className="page active">
      <div className="container">
        <div className="hero" style={{ paddingTop: 34 }}>
          <div className="kicker">Insights</div>
          <h1>Practical ideas for better conversations</h1>
          <p className="sub">
            Plain-language guides on call quality, voice bots, telephony and compliance, written for people who run contact centres and sales teams.
          </p>
        </div>

        <Section style={{ paddingTop: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {INSIGHTS.map((article) => (
              <Link
                to={`/insights/${article.slug}`}
                key={article.slug}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 22,
                  background: 'var(--card-bg)',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    alignSelf: 'flex-start',
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-live)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 999,
                    padding: '4px 11px',
                  }}
                >
                  {article.category}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 20,
                    lineHeight: 1.25,
                    margin: 0,
                  }}
                >
                  {article.title}
                </h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 15, margin: 0, flexGrow: 1 }}>
                  {article.teaser}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13.5,
                    color: 'var(--ink-faint)',
                    marginTop: 4,
                  }}
                >
                  <span>{article.readTime}</span>
                  <span style={{ color: 'var(--accent-live)', fontWeight: 600 }}>Read the article →</span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}

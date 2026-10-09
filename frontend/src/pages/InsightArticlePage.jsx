import { useParams } from 'react-router-dom';
import { GoButton, GoLink } from '../hooks/useGoto.jsx';
import { Section } from '../components/ui/Blocks.jsx';
import { NotFoundPage } from './DynamicPage.jsx';
import { getInsightBySlug } from '../data/insights.js';

function ListBlock({ type, items }) {
  const Tag = type === 'ol' ? 'ol' : 'ul';
  return (
    <Tag style={{ margin: '0 0 18px', paddingLeft: 22, color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.65 }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: 8 }}>
          {it.bold && <b style={{ color: 'var(--ink)' }}>{it.bold}</b>}
          {it.text}
        </li>
      ))}
    </Tag>
  );
}

function BodyBlock({ block }) {
  if (block.type === 'p') {
    return <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.65, margin: '0 0 18px' }}>{block.text}</p>;
  }
  return <ListBlock type={block.type} items={block.items} />;
}

export default function InsightArticlePage() {
  const { slug } = useParams();
  const article = getInsightBySlug(slug);

  if (!article) return <NotFoundPage />;

  return (
    <section className="page active">
      <div className="container">
        <div style={{ paddingTop: 34 }}>
          <GoLink to="insights" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-live)', textDecoration: 'none' }}>
            ← Back to Insights
          </GoLink>

          <div className="hero" style={{ padding: '18px 0 0' }}>
            <div className="kicker">{article.category}</div>
            <h1>{article.title}</h1>
            <p className="sub" style={{ marginBottom: 6 }}>
              By the Nimantran team · {article.readTime}
            </p>
          </div>
        </div>

        <Section style={{ paddingTop: 10 }}>
          <div style={{ maxWidth: '68ch' }}>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.65, margin: '0 0 18px' }}>
              {article.intro}
            </p>

            {article.sections.map((sec, i) => (
              <div key={i}>
                {sec.heading && (
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, margin: '28px 0 12px' }}>
                    {sec.heading}
                  </h2>
                )}
                {sec.body.map((block, j) => <BodyBlock block={block} key={j} />)}
              </div>
            ))}

            <div
              style={{
                background: 'var(--surface-card)',
                borderLeft: '4px solid var(--accent-live)',
                borderRadius: 10,
                padding: '16px 20px',
                margin: '24px 0 8px',
              }}
            >
              <strong style={{ color: 'var(--ink)' }}>Takeaway: </strong>
              <span style={{ color: 'var(--ink-soft)' }}>{article.takeaway}</span>
            </div>
          </div>
        </Section>

        <Section>
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '28px 26px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, margin: '0 0 8px' }}>
              See it on your own calls.
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, margin: '0 0 18px' }}>
              Bring a recording or a script and we will show you the result.
            </p>
            <div className="cta-row" style={{ justifyContent: 'center' }}>
              <GoButton to="contact" className="btn">Book a meeting</GoButton>
            </div>
          </div>
        </Section>
      </div>
    </section>
  );
}

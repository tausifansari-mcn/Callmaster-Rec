import { Link } from 'react-router-dom';
import POSTS from '../data/insightPosts.json';

/** Insights hub (/insights) — the theme's template-insights.php, one card per article. */
export default function InsightsHubPage() {
  return (
    <div className="tp-ct tp-pure">
      <div className="wrap section">
        <div className="section-head"><div className="kicker">Insights</div><h1>Practical ideas for better conversations</h1><p>Plain-language guides on call quality, voice bots, telephony and compliance, written for people who run contact centres and sales teams.</p></div>
        <div className="insight-grid">
          {POSTS.map((p) => (
            <Link className="insight-card" to={`/insights/${p.slug}`} key={p.slug}>
              <div className="insight-art">{p.art}</div>
              <div className="insight-body">
                <span className="insight-meta">{p.read}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <span className="insight-more">Read the article</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

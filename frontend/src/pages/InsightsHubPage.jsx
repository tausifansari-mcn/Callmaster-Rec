import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../api/public.js';

/** Insights hub (/insights) — one card per published post, written in the admin panel. */
export default function InsightsHubPage() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    publicApi.posts()
      .then((p) => { if (alive) setPosts(p); })
      .catch((err) => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="tp-ct tp-pure">
      <div className="wrap section">
        <div className="section-head">
          <div className="kicker">Insights</div>
          <h1>Practical ideas for better conversations</h1>
          <p>Plain-language guides on call quality, voice bots, telephony and compliance, written for people who run contact centres and sales teams.</p>
        </div>

        {error && <p>We couldn&apos;t load the articles just now. Please refresh the page.</p>}
        {posts && posts.length === 0 && <p>No articles have been published yet.</p>}

        <div className="insight-grid">
          {(posts || []).map((p) => (
            <Link className="insight-card" to={`/insights/${p.slug}`} key={p.slug}>
              {p.coverImage
                ? <img className="insight-pic" src={p.coverImage} alt="" loading="lazy" decoding="async" />
                : <div className="insight-art">{p.category || 'Insight'}</div>}
              <div className="insight-body">
                <span className="insight-meta">{p.readTime || '5 min read'}</span>
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

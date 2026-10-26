import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../api/public.js';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import { industryFragment, resolveIndustryUrls } from '../data/industryFragments.js';
import { NotFoundPage } from './DynamicPage.jsx';

/** One Insights article (/insights/:slug). The body is HTML written in the admin panel. */
export default function InsightArticlePage() {
  const { slug } = useParams();
  const [post, setPost] = useState(undefined); // undefined = loading, null = not found
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setPost(undefined);
    setFailed(false);
    publicApi.post(slug)
      .then((p) => { if (alive) setPost(p); })
      .catch((err) => {
        if (!alive) return;
        if (err.status === 404) setPost(null); else setFailed(true);
      });
    return () => { alive = false; };
  }, [slug]);

  // Keep the page title and meta description in step with the article, for search results and sharing.
  useEffect(() => {
    if (!post) return undefined;
    const previousTitle = document.title;
    document.title = post.seoTitle || `${post.title} — Nimantran`;
    const tag = document.querySelector('meta[name="description"]');
    const previousDesc = tag?.getAttribute('content');
    const desc = post.seoDescription || post.excerpt;
    if (tag && desc) tag.setAttribute('content', desc);
    return () => {
      document.title = previousTitle;
      if (tag && previousDesc != null) tag.setAttribute('content', previousDesc);
    };
  }, [post]);

  if (post === null) return <NotFoundPage />;
  if (failed) {
    return (
      <div className="tp-ct tp-pure">
        <article className="post">
          <Link className="back" to="/insights">Back to Insights</Link>
          <p>We couldn&apos;t load this article just now. Please refresh the page.</p>
        </article>
      </div>
    );
  }
  if (post === undefined) {
    return <div className="tp-ct tp-pure"><article className="post"><p>Loading…</p></article></div>;
  }

  return (
    <div className="tp-ct tp-pure">
      <article className="post">
        <Link className="back" to="/insights">Back to Insights</Link>
        {post.category && <div className="kicker">{post.category}</div>}
        <h1>{post.title}</h1>
        <span className="insight-meta">
          {post.readTime || '5 min read'} &middot; By {post.author || 'the Nimantran team'}
        </span>
        {post.coverImage && <img className="post-cover" src={post.coverImage} alt="" loading="lazy" decoding="async" />}
        <ThemeFragment key={slug} parts={[resolveIndustryUrls(post.body), industryFragment('post-related')]} />
      </article>
      <div className="post-cta">
        <div className="cta-band" style={{ margin: 0 }}>
          <div>
            <h2>See it on your own calls.</h2>
            <p>Bring a recording or a script and we will show you the result.</p>
          </div>
          <div className="hero-cta"><Link className="btn btn-light" to="/contact">Book a meeting</Link></div>
        </div>
      </div>
    </div>
  );
}

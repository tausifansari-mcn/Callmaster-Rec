import { Link, useParams } from 'react-router-dom';
import ThemeFragment from '../components/ui/ThemeFragment.jsx';
import POSTS from '../data/insightPosts.json';
import { industryFragment, resolveIndustryUrls } from '../data/industryFragments.js';
import { NotFoundPage } from './DynamicPage.jsx';

/** One Insights article (/insights/:slug) — the theme's single.php. Bodies are the theme's seeded post HTML. */
export default function InsightArticlePage() {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return <NotFoundPage />;

  return (
    <div className="tp-ct tp-pure">
      <article className="post">
        <Link className="back" to="/insights">Back to Insights</Link>
        <div className="kicker">{post.art}</div>
        <h1>{post.title}</h1>
        <span className="insight-meta">{post.read} &middot; By the Nimantran team</span>
        <ThemeFragment key={slug} parts={[resolveIndustryUrls(post.body), industryFragment('post-related')]} />
      </article>
      <div className="post-cta"><div className="cta-band" style={{ margin: 0 }}><div><h2>See it on your own calls.</h2><p>Bring a recording or a script and we will show you the result.</p></div><div className="hero-cta"><Link className="btn btn-light" to="/contact">Book a meeting</Link></div></div></div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { logoUrl } from '../../utils/branding.js';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';

export default function Footer() {
  const { site, footerPages } = useSite();
  const extra = (column) => footerPages.filter((p) => p.column === column);

  return (
    <footer>
      <div className="container">
        {logoUrl(site) && (
          <div className="footer-brand"><img src={logoUrl(site)} alt={site.brandName} /><span>CONNECT · SUPPORT · GROW</span></div>
        )}
        <div className="footer-grid">
          <div>
            <h4>PRODUCT</h4>
            {PRODUCT_PAGES.map((p) => <Link key={p.id} to={pathFor(p.id)}>{p.label}</Link>)}
            <Link to="/pricing">Pricing</Link>
            {extra('product').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>COMPANY</h4>
            <Link to="/about">About / Trust</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/account">Customer login</Link>
            {extra('company').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>LEGAL</h4>
            {extra('legal').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>DEMO</h4>
            <Link to={pathFor('audit')}>Try Insights</Link>
            <Link to={pathFor('voice')}>Try Voice Bot</Link>
          </div>
        </div>
        {site.footerNote && <div className="footer-bottom">{site.footerNote}</div>}
      </div>
    </footer>
  );
}

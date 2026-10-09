import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { logoUrl } from '../../utils/branding.js';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';
import { INDUSTRIES_NAV } from './Navbar.jsx';

export default function Footer() {
  const { site, footerPages } = useSite();
  const extra = (column) => footerPages.filter((p) => p.column === column);

  return (
    <footer>
      <div className="container">
        <div className="footer-brand">
          {logoUrl(site) && <img src={logoUrl(site)} alt="" />}
          {site.brandName}
        </div>
        <p className="footer-tagline">Enable people. Empower businesses.</p>
        <div className="footer-grid">
          <div>
            <h4>PRODUCT</h4>
            {PRODUCT_PAGES.map((p) => <Link key={p.id} to={pathFor(p.id)}>{p.label}</Link>)}
            <Link to="/pricing">Pricing</Link>
            {extra('product').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>INDUSTRIES</h4>
            <ul className="foot-2col">
              {INDUSTRIES_NAV.map((ind) => <li key={ind.slug}><Link to={`/industries/${ind.slug}`}>{ind.name}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4>COMPANY</h4>
            <Link to="/why">Why Nimantran</Link>
            <Link to="/insights">Insights</Link>
            <Link to="/resources">Resources</Link>
            <Link to="/about">About / Trust</Link>
            <Link to="/contact">Contact us</Link>
            <Link to="/account">Customer login</Link>
            {extra('company').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>LEGAL</h4>
            {extra('legal').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
        </div>
        {site.footerNote && <div className="footer-bottom">{site.footerNote}</div>}
      </div>
    </footer>
  );
}

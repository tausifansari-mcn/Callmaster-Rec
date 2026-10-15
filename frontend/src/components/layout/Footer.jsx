import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';
import { INDUSTRIES_NAV } from './Navbar.jsx';

export default function Footer() {
  const { site, footerPages } = useSite();
  const extra = (column) => footerPages.filter((p) => p.column === column);

  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link className="foot-logo-card" to="/" aria-label={`${site.brandName} home`}>
              <img src="/logo-full.png" alt="Nimantran: Cloud Telephony, AI Voice, Connecting People" width="150" height="141" />
            </Link>
            <p className="footer-tagline">Enable people. Empower businesses.</p>
          </div>
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
            <a href="mailto:care@nimantran.ai">care@nimantran.ai</a>
            <a href="https://wa.me/919667195550?text=Hi%20Nimantran%2C%20I%20would%20like%20to%20know%20more%20about" target="_blank" rel="noopener noreferrer">WhatsApp: +91 96671 95550</a>
            {extra('company').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
          <div>
            <h4>LEGAL</h4>
            {extra('legal').map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.title}</Link>)}
          </div>
        </div>
        {site.footerNote && <div className="footer-bottom">{site.footerNote}</div>}
        <p className="footer-copy">&copy; {new Date().getFullYear()} Nimantran. All rights reserved.</p>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';
import { INDUSTRIES_NAV } from './Navbar.jsx';


/** The theme's four legal pages, in footer order. Admin-added legal pages are appended after them. */
const LEGAL = [
  { to: '/terms', label: 'Terms and conditions' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/cookie-policy', label: 'Cookie policy' },
  { to: '/data-retention', label: 'Data retention policy' },
];

/** Site footer — the theme's footer.php markup. Pages added in the admin panel go under their chosen column. */
export default function Footer() {
  const { site, footerPages } = useSite();
  const extra = (column) => footerPages.filter((p) => p.column === column && !LEGAL.some((l) => l.to === `/${p.slug}`));
  const extraLinks = (column) => extra(column).map((p) => <li key={p.slug}><Link to={`/${p.slug}`}>{p.title}</Link></li>);

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-top">
          <div>
            <Link className="foot-logo-card" to="/" aria-label={`${site.brandName} home`}>
              <img src="/assets/images/logo-full.png" alt="Nimantran: Cloud Telephony, AI Voice, Connecting People" width="190" height="42" loading="lazy" />
            </Link>
            <p className="foot-tag">Enable people. Empower businesses.</p>
            <ul className="social-row">
              <li><a href="https://www.facebook.com/people/Nimantran/61595359353006/" target="_blank" rel="noopener noreferrer me" aria-label="Nimantran on Facebook" title="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.8c-.3 0-1.3-.2-2.4-.2-2.5 0-4.1 1.5-4.1 4.2v2.7H7.6v3.3h2.8V22h3.1z" /></svg></a></li>
              <li><a href="https://www.instagram.com/nimantran07/" target="_blank" rel="noopener noreferrer me" aria-label="Nimantran on Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM21.9 8c-.1-1.5-.4-2.8-1.5-3.9S17.9 2.6 16.4 2.5c-1.6-.1-6.4-.1-8 0C6.9 2.6 5.6 2.9 4.5 4S2.9 6.5 2.8 8c-.1 1.6-.1 6.4 0 8 .1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.6.1 6.4.1 8 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.6.1-6.4 0-8zm-2 10.7a3.2 3.2 0 0 1-1.8 1.8c-1.3.5-4.2.4-6.1.4s-4.8.1-6.1-.4a3.2 3.2 0 0 1-1.8-1.8c-.5-1.3-.4-4.2-.4-6.1s-.1-4.8.4-6.1a3.2 3.2 0 0 1 1.8-1.8c1.3-.5 4.2-.4 6.1-.4s4.8-.1 6.1.4a3.2 3.2 0 0 1 1.8 1.8c.5 1.3.4 4.2.4 6.1s.1 4.8-.4 6.1z" /></svg></a></li>
            </ul>
          </div>
          <nav aria-label="Products">
            <h4>Products</h4>
            <ul>
              {PRODUCT_PAGES.map((p) => <li key={p.id}><Link to={pathFor(p.id)}>{p.label}</Link></li>)}
              {extraLinks('product')}
            </ul>
          </nav>
          <nav aria-label="Industries">
            <h4>Industries</h4>
            <ul className="foot-2col">
              {INDUSTRIES_NAV.map((ind) => <li key={ind.slug}><Link to={`/industries/${ind.slug}`}>{ind.name}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label="Company">
            <h4>Company</h4>
            <ul>
              <li><Link to="/why">Why Nimantran</Link></li>
              <li><Link to="/insights">Insights</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/resources">Resources</Link></li>
              <li><Link to="/about">About / Trust</Link></li>
              <li><Link to="/account">Customer login</Link></li>
              {extraLinks('company')}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h4>Legal</h4>
            <ul>
              {LEGAL.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
              {extraLinks('legal')}
            </ul>
          </nav>
        </div>
        <div className="foot-bottom">
          <p className="foot-copy">&copy; {new Date().getFullYear()} Nimantran. All rights reserved.</p>
          <nav className="foot-links" aria-label="Footer">
            <Link to="/">Sitemap</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

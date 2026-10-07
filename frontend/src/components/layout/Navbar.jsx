import { Link, NavLink } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { GoButton } from '../../hooks/useGoto.jsx';
import { logoUrl } from '../../utils/branding.js';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';

export function Navbar({ onToggleMenu }) {
  const site = useSite().site;
  return (
    <nav className="site-nav">
      <Link to="/" className="brand">
        {logoUrl(site) ? <img className="brand-logo" src={logoUrl(site)} alt="" /> : <span className="dot" />}
        {site.brandName}
      </Link>
      <div className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        {PRODUCT_PAGES.map((p) => <NavLink key={p.id} to={pathFor(p.id)}>{p.label}</NavLink>)}
        <NavLink to="/pricing">Pricing</NavLink>
      </div>
      <div className="nav-right">
        <GoButton to="contact" className="nav-cta">{site.navCtaLabel}</GoButton>
        <button type="button" className="hamburger" aria-label="Menu" onClick={onToggleMenu}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

export function MobileMenu({ open }) {
  const site = useSite().site;
  return (
    <div className={`mobile-menu${open ? ' open' : ''}`}>
      <NavLink to="/" end>Home</NavLink>
      {PRODUCT_PAGES.map((p) => <NavLink key={p.id} to={pathFor(p.id)}>{p.label}</NavLink>)}
      <NavLink to="/pricing">Pricing</NavLink>
      <NavLink to="/insights">Insights</NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/contact">Contact</NavLink>
      <GoButton to="contact" className="btn nav-cta">{site.navCtaLabel}</GoButton>
    </div>
  );
}

export function MobileStickyCta() {
  const site = useSite().site;
  return (
    <div className="mobile-sticky-cta">
      <GoButton to="contact" className="btn">{site.navCtaLabel}</GoButton>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { GoButton } from '../../hooks/useGoto.jsx';
import { logoUrl } from '../../utils/branding.js';
import { IconBadge } from '../ui/Icons.jsx';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';

export const INDUSTRIES_NAV = [
  { slug: 'insurance', name: 'Insurance' },
  { slug: 'banking', name: 'Banking' },
  { slug: 'health', name: 'Health' },
  { slug: 'retail-ecommerce', name: 'Retail & Ecommerce' },
  { slug: 'fmcg', name: 'FMCG' },
  { slug: 'automobiles', name: 'Automobiles' },
  { slug: 'ev', name: 'EV' },
  { slug: 'telecom', name: 'Telecom' },
  { slug: 'logistics', name: 'Logistics' },
  { slug: 'aviation', name: 'Aviation' },
];

function useOutsideClose(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);
  return ref;
}

function SolutionsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, setOpen);
  return (
    <div className={`nav-dd${open ? ' open' : ''}`} ref={ref}>
      <button type="button" className="nav-dd-btn" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        Solutions <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="nav-menu">
        {PRODUCT_PAGES.map((p) => (
          <NavLink key={p.id} to={pathFor(p.id)} onClick={() => setOpen(false)}>
            <span className="mi"><IconBadge name={p.icon} small /></span>
            <span><b>{p.label}</b><small>{p.desc}</small></span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function IndustriesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, setOpen);
  return (
    <div className={`nav-dd${open ? ' open' : ''}`} ref={ref}>
      <button type="button" className="nav-dd-btn" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        Industries <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="nav-menu nav-menu-grid">
        {INDUSTRIES_NAV.map((ind) => (
          <NavLink key={ind.slug} to={`/industries/${ind.slug}`} onClick={() => setOpen(false)}>
            <span className="mi" aria-hidden="true">{ind.name.slice(0, 1)}</span>
            <span><b>{ind.name}</b></span>
          </NavLink>
        ))}
        <Link to="/industries" className="ind-all" onClick={() => setOpen(false)}>View all industries</Link>
      </div>
    </div>
  );
}

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
        <SolutionsDropdown />
        <IndustriesDropdown />
        <NavLink to="/why">Why Nimantran</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/insights">Insights</NavLink>
        <NavLink to="/contact">Contact us</NavLink>
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
  const [solOpen, setSolOpen] = useState(false);
  const [indOpen, setIndOpen] = useState(false);
  const site = useSite().site;
  return (
    <div className={`mobile-menu${open ? ' open' : ''}`}>
      <NavLink to="/" end>Home</NavLink>
      <button type="button" className={`mobile-products-toggle${solOpen ? ' open' : ''}`} onClick={() => setSolOpen((o) => !o)}>
        <span>Solutions</span><span className="caret">▾</span>
      </button>
      <div className={`mobile-products-list${solOpen ? ' open' : ''}`}>
        {PRODUCT_PAGES.map((p) => <NavLink key={p.id} to={pathFor(p.id)}>{p.label}</NavLink>)}
      </div>
      <button type="button" className={`mobile-products-toggle${indOpen ? ' open' : ''}`} onClick={() => setIndOpen((o) => !o)}>
        <span>Industries</span><span className="caret">▾</span>
      </button>
      <div className={`mobile-products-list${indOpen ? ' open' : ''}`}>
        {INDUSTRIES_NAV.map((ind) => <NavLink key={ind.slug} to={`/industries/${ind.slug}`}>{ind.name}</NavLink>)}
        <NavLink to="/industries">View all industries</NavLink>
      </div>
      <NavLink to="/why">Why Nimantran</NavLink>
      <NavLink to="/pricing">Pricing</NavLink>
      <NavLink to="/insights">Insights</NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/contact">Contact us</NavLink>
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

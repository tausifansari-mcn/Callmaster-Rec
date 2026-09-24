import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
import { GoButton } from '../../hooks/useGoto.jsx';
import { PRODUCT_PAGES, pathFor } from '../../utils/routes.js';

function ProductsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div className={`nav-dropdown${open ? ' open' : ''}`} ref={ref}>
      <button type="button" className="nav-dropdown-trigger" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        Products <span className="caret">▾</span>
      </button>
      <div className="nav-dropdown-panel" onClick={() => setOpen(false)}>
        {PRODUCT_PAGES.map((p) => (
          <NavLink key={p.id} to={pathFor(p.id)} className="nav-dropdown-item">
            <div className="ndi-title">{p.label}</div>
            <div className="ndi-desc">{p.desc}</div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function Navbar({ onToggleMenu }) {
  const site = useSite().site;
  return (
    <nav className="site-nav">
      <Link to="/" className="brand"><span className="dot" />{site.brandName}</Link>
      <div className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <ProductsDropdown />
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>
      <div className="nav-right">
        <GoButton to="audit" className="nav-cta">{site.navCtaLabel}</GoButton>
        <button type="button" className="hamburger" aria-label="Menu" onClick={onToggleMenu}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}

export function MobileMenu({ open }) {
  const [productsOpen, setProductsOpen] = useState(false);
  const site = useSite().site;
  return (
    <div className={`mobile-menu${open ? ' open' : ''}`}>
      <NavLink to="/" end>Home</NavLink>
      <button type="button" className={`mobile-products-toggle${productsOpen ? ' open' : ''}`} onClick={() => setProductsOpen((o) => !o)}>
        <span>Products</span><span className="caret">▾</span>
      </button>
      <div className={`mobile-products-list${productsOpen ? ' open' : ''}`}>
        {PRODUCT_PAGES.map((p) => (
          <NavLink key={p.id} to={pathFor(p.id)}>
            {p.label}<span className="mpl-desc">{p.desc}</span>
          </NavLink>
        ))}
      </div>
      <NavLink to="/pricing">Pricing</NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/contact">Contact</NavLink>
      <GoButton to="audit" className="btn nav-cta">{site.navCtaLabel}</GoButton>
    </div>
  );
}

export function MobileStickyCta() {
  const site = useSite().site;
  return (
    <div className="mobile-sticky-cta">
      <GoButton to="audit" className="btn">{site.navCtaLabel}</GoButton>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSite } from '../../context/SiteContext.jsx';
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

/** Solutions-menu icons, copied from the theme (inc/template-helpers.php → nimantran_nav_icons). */
const svgProps = { viewBox: '0 0 24 24', stroke: '#2F5D3A', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
const NAV_ICONS = {
  audit: <svg {...svgProps}><path d="M5 10v4M9 7v10M13 9v6M17 6v12" /></svg>,
  voice: <svg {...svgProps}><rect x="7" y="2.5" width="10" height="19" rx="3" /><path d="M10.5 10l4 2.5-4 2.5z" /></svg>,
  telephony: <svg {...svgProps}><path d="M6 3h3l1.6 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.6v3a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z" /></svg>,
  'sip-channels': <svg {...svgProps}><circle cx="5" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="12" r="2" /><path d="M7 6.5l10 4.5M7 17.5l10-4.5" /></svg>,
  'social-listening': <svg {...svgProps}><path d="M4 5h16v10H10l-4 4v-4H4z" /><path d="M8 10h2l1-2 2 4 1-2h2" /></svg>,
};

const Caret = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * One header dropdown, with the theme's behaviour (assets/js/nav.js): opens on hover on wide pointer
 * screens with a 200 ms grace period on leave, toggles on click, closes on outside click or Escape.
 * `openId`/`setOpenId` keep only one dropdown open at a time.
 */
function NavDropdown({ id, domId, btnId, menuId, label, active, openId, setOpenId, children }) {
  const open = openId === id;
  const ref = useRef(null);
  const timer = useRef(null);
  const byHover = useRef(false);
  const set = (o) => setOpenId(o ? id : (cur) => (cur === id ? null : cur));

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) set(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      id={domId}
      className={`nav-dd${open ? ' open' : ''}`}
      ref={ref}
      onMouseEnter={() => {
        if (!window.matchMedia('(min-width:961px) and (hover:hover)').matches) return;
        clearTimeout(timer.current);
        if (!open) { byHover.current = true; set(true); }
      }}
      onMouseLeave={() => {
        clearTimeout(timer.current);
        if (window.matchMedia('(hover:hover)').matches) timer.current = setTimeout(() => { byHover.current = false; set(false); }, 200);
      }}
    >
      <button
        type="button"
        id={btnId}
        aria-controls={menuId}
        className={`nav-dd-btn${active ? ' has-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          if (open && byHover.current) { byHover.current = false; return; } // opened by hover: a click keeps it open
          byHover.current = false;
          set(!open);
        }}
      >
        {label} <Caret />
      </button>
      <div className="nav-menu" id={menuId}>{children}</div>
    </div>
  );
}

/** Site header — the theme's header.php + nimantran_primary_nav() markup. */
export function Navbar() {
  const site = useSite().site;
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => { setNavOpen(false); setOpenId(null); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpenId(null); setNavOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const inSolutions = PRODUCT_PAGES.some((p) => pathname === pathFor(p.id));
  const inIndustries = pathname === '/industries' || pathname.startsWith('/industries/');
  const ddProps = { openId, setOpenId };

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className={`site-header${navOpen ? ' nav-open' : ''}`}>
        <div className="navbar">
          <Link className="logo" to="/">
            <img className="site-logo-full" src="/assets/images/logo-header.png" alt={site.brandName} width="181" height="40" />
          </Link>
          <nav className="navlinks-wrap" aria-label="Primary">
            <div id="navlinks" className="navlinks">
              <NavLink to="/" end>Home</NavLink>
              <NavDropdown id="sol" domId="navDd" btnId="solBtn" menuId="solMenu" label="Solutions" active={inSolutions} {...ddProps}>
                {PRODUCT_PAGES.map((p) => (
                  <NavLink key={p.id} to={pathFor(p.id)}>
                    <span className="mi">{NAV_ICONS[p.id]}</span>
                    <span><b>{p.label}</b><small>{p.desc}</small></span>
                  </NavLink>
                ))}
              </NavDropdown>
              <NavDropdown id="ind" domId="indDd" btnId="indBtn" menuId="indMenu" label="Industries" active={inIndustries} {...ddProps}>
                {INDUSTRIES_NAV.map((ind) => (
                  <NavLink key={ind.slug} to={`/industries/${ind.slug}`}>
                    <span className="mi" aria-hidden="true">{ind.name.slice(0, 1)}</span>
                    <span><b>{ind.name}</b></span>
                  </NavLink>
                ))}
                <Link className="ind-all" to="/industries">View all industries</Link>
              </NavDropdown>
              <NavLink to="/why">Why Nimantran</NavLink>
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/insights">Insights</NavLink>
              <NavLink className="nav-contact" to="/contact">Contact us</NavLink>
              <Link className="nav-cta-m" to="/contact">{site.navCtaLabel}</Link>
            </div>
          </nav>
          <button
            type="button"
            id="navToggle"
            className="nav-toggle"
            aria-label="Menu"
            aria-expanded={navOpen}
            aria-controls="navlinks"
            onClick={() => setNavOpen((o) => !o)}
          >
            <span />
          </button>
          <Link className="btn btn-primary cta-btn" to="/contact">{site.navCtaLabel}</Link>
        </div>
      </header>
    </>
  );
}

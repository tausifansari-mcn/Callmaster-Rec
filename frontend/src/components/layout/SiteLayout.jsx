import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteProvider, useSite, useSiteState } from '../../context/SiteContext.jsx';
import { logoUrl } from '../../utils/branding.js';
import { PurchaseProvider } from '../purchase/PurchaseContext.jsx';
import ChatWidget from '../chat/ChatWidget.jsx';
import Footer from './Footer.jsx';
import { MobileMenu, MobileStickyCta, Navbar } from './Navbar.jsx';
import ScrollManager from './ScrollManager.jsx';

function Shell() {
  const site = useSite().site;
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => { document.title = site.siteTitle; }, [site.siteTitle]);

  // A logo makes the header taller (CSS var --nav-h), and doubles as the browser-tab icon.
  const logo = logoUrl(site);
  useEffect(() => {
    document.documentElement.classList.toggle('has-brand-logo', Boolean(logo));
    if (logo) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.removeAttribute('type');
      link.href = logo;
    }
    return () => document.documentElement.classList.remove('has-brand-logo');
  }, [logo]);

  return (
    <PurchaseProvider>
      <ScrollManager />
      <Navbar onToggleMenu={() => setMenuOpen((o) => !o)} />
      <MobileMenu open={menuOpen} />
      <MobileStickyCta />
      <main><Outlet /></main>
      <ChatWidget />
      <Footer />
    </PurchaseProvider>
  );
}

function Gate() {
  const { status, error, reload } = useSiteState();
  if (status === 'loading') {
    return <div className="app-loading"><div className="pm-spinner" />Loading…</div>;
  }
  if (status === 'error') {
    return (
      <div className="app-loading">
        <div>We couldn't load the site right now.<br /><span style={{ color: 'var(--ink-faint)' }}>{error}</span></div>
        <button type="button" className="btn" onClick={reload}>Try again</button>
      </div>
    );
  }
  return <Shell />;
}

export default function SiteLayout() {
  return (
    <SiteProvider>
      <Gate />
    </SiteProvider>
  );
}

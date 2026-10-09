import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import DynamicPage, { NotFoundPage } from './pages/DynamicPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import HomePage from './pages/HomePage.jsx';
import IndustriesPage from './pages/IndustriesPage.jsx';
import IndustryPage from './pages/IndustryPage.jsx';
import InsightArticlePage from './pages/InsightArticlePage.jsx';
import InsightsHubPage from './pages/InsightsHubPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import SipChannelsPage from './pages/SipChannelsPage.jsx';
import SocialListeningPage from './pages/SocialListeningPage.jsx';
import TelephonyPage from './pages/TelephonyPage.jsx';
import VoiceBotPage from './pages/VoiceBotPage.jsx';
import WhyPage from './pages/WhyPage.jsx';

// The admin panel is code-split so visitors to the public site never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <Routes>
      <Route path="admin/*" element={<Suspense fallback={<div className="app-loading"><div className="pm-spinner" />Loading…</div>}><AdminApp /></Suspense>} />
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="deep-customer-insights" element={<InsightsPage />} />
        <Route path="voice-bot" element={<VoiceBotPage />} />
        <Route path="cloud-telephony" element={<TelephonyPage />} />
        <Route path="sip-channels" element={<SipChannelsPage />} />
        <Route path="social-listening" element={<SocialListeningPage />} />
        <Route path="why" element={<WhyPage />} />
        <Route path="industries" element={<IndustriesPage />} />
        <Route path="industries/:slug" element={<IndustryPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="insights" element={<InsightsHubPage />} />
        <Route path="insights/:slug" element={<InsightArticlePage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        {/* Legal pages and admin-created pages live in the database */}
        <Route path=":slug" element={<DynamicPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import DialersPage from './pages/DialersPage.jsx';
import DynamicPage, { NotFoundPage } from './pages/DynamicPage.jsx';
import EmailAutomationPage from './pages/EmailAutomationPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import HomePage from './pages/HomePage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import ResourcesPage from './pages/ResourcesPage.jsx';
import TelephonyPage from './pages/TelephonyPage.jsx';
import VoiceBotPage from './pages/VoiceBotPage.jsx';
import WhatsAppPage from './pages/WhatsAppPage.jsx';

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
        <Route path="dialers" element={<DialersPage />} />
        <Route path="email-automation" element={<EmailAutomationPage />} />
        <Route path="whatsapp-api" element={<WhatsAppPage />} />
        <Route path="cloud-telephony" element={<TelephonyPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="insights" element={<ResourcesPage />} />
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

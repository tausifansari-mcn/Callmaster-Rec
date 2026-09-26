import { Route, Routes } from 'react-router-dom';
import '../styles/admin.css';
import { AdminProviders } from './AdminContext.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AccountScreen from './pages/AccountScreen.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { PageEditor, PagesList } from './pages/PagesScreens.jsx';
import PromosScreen from './pages/PromosScreen.jsx';
import { ContactsScreen, DemosScreen, LeadsScreen, OrdersScreen } from './pages/ResourceScreens.jsx';
import { ChatbotScreen, EmailScreen, FaqScreen, HomeScreen, PricingScreen, SiteScreen } from './pages/SettingsScreens.jsx';
import UsersScreen from './pages/UsersScreen.jsx';
import {
  AppointmentsScreen, CancellationsScreen, CustomersScreen, InsightsContentScreen, WhitepaperLeadsScreen, WhitepapersScreen,
} from './pages/CommerceScreens.jsx';
import IntegrationsScreen from './pages/IntegrationsScreen.jsx';

export default function AdminApp() {
  return (
    <AdminProviders>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersScreen />} />
          <Route path="leads" element={<LeadsScreen />} />
          <Route path="contacts" element={<ContactsScreen />} />
          <Route path="email" element={<EmailScreen />} />
          <Route path="integrations" element={<IntegrationsScreen />} />
          <Route path="demos" element={<DemosScreen />} />
          <Route path="appointments" element={<AppointmentsScreen />} />
          <Route path="cancellations" element={<CancellationsScreen />} />
          <Route path="whitepaper-leads" element={<WhitepaperLeadsScreen />} />
          <Route path="customers" element={<CustomersScreen />} />
          <Route path="insights" element={<InsightsContentScreen />} />
          <Route path="whitepapers" element={<WhitepapersScreen />} />
          <Route path="pricing" element={<PricingScreen />} />
          <Route path="home" element={<HomeScreen />} />
          <Route path="faqs" element={<FaqScreen />} />
          <Route path="pages" element={<PagesList />} />
          <Route path="pages/:id" element={<PageEditor />} />
          <Route path="chatbot" element={<ChatbotScreen />} />
          <Route path="promos" element={<PromosScreen />} />
          <Route path="site" element={<SiteScreen />} />
          <Route path="users" element={<UsersScreen />} />
          <Route path="account" element={<AccountScreen />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </AdminProviders>
  );
}

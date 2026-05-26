import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ConfigDirtyProvider } from './contexts/ConfigDirtyCtx.jsx';
import { BotStatusProvider } from './contexts/BotStatusCtx.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import Layout from './components/Layout.jsx';
import { getToken, setToken, clearToken } from './utils/auth.js';

const LandingPage          = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage            = lazy(() => import('./pages/LoginPage.jsx'));
const DashboardPage        = lazy(() => import('./pages/DashboardPage.jsx'));
const ConfigPage           = lazy(() => import('./pages/ConfigPage.jsx'));
const MemoryPage           = lazy(() => import('./pages/MemoryPage.jsx'));
const SubscriptionPage     = lazy(() => import('./pages/SubscriptionPage.jsx'));
const AnalisiPage          = lazy(() => import('./pages/AnalisiPage.jsx'));
const SharedAnalisiPage    = lazy(() => import('./pages/SharedAnalisiPage.jsx'));
const ProvaGratisPage      = lazy(() => import('./pages/ProvaGratisPage.jsx'));
const DashboardAnalisiPage = lazy(() => import('./pages/DashboardAnalisiPage.jsx'));
const GuidePage            = lazy(() => import('./pages/GuidePage.jsx'));
const ChangelogPage        = lazy(() => import('./pages/ChangelogPage.jsx'));
const FaqPage              = lazy(() => import('./pages/FaqPage.jsx'));
const PrivacyPage          = lazy(() => import('./pages/PrivacyPage.jsx'));
const TerminiPage          = lazy(() => import('./pages/TerminiPage.jsx'));
const CookiePage           = lazy(() => import('./pages/CookiePage.jsx'));
const ContattiPage         = lazy(() => import('./pages/ContattiPage.jsx'));
const RefPage              = lazy(() => import('./pages/RefPage.jsx'));
const StatusPage           = lazy(() => import('./pages/StatusPage.jsx'));
const SuccessPage          = lazy(() => import('./pages/SuccessPage.jsx'));
const CommandsPage         = lazy(() => import('./pages/CommandsPage.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      localStorage.removeItem('streammindai_ref');
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = getToken();
    if (!token) { setLoading(false); return; }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) clearToken();
      else setUser(payload);
    } catch { clearToken(); }
    setLoading(false);
  }, []);

  const logout = () => { clearToken(); setUser(null); };
  return { user, loading, logout };
}

function ProtectedRoute({ user, loading, children }) {
  if (loading) return <div className="min-h-screen bg-hally-bg flex items-center justify-center"><span className="text-hally-text-muted">Caricamento...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const auth = useAuth();

  return (
    <HelmetProvider>
      <BotStatusProvider>
      <ConfigDirtyProvider>
      <BrowserRouter>
        <ScrollToTop />
        <CookieBanner />
        <Suspense fallback={<div className="min-h-screen bg-hally-bg" />}>
        <Routes>
          <Route path="/" element={<LandingPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/prova-gratis" element={<ProvaGratisPage   user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/analisi/:id" element={<SharedAnalisiPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/analisi-pubblica" element={<AnalisiPage  user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/changelog" element={<ChangelogPage user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/status"    element={<StatusPage    user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/faq"       element={<FaqPage       user={auth.user} loading={auth.loading} onLogout={auth.logout} />} />
          <Route path="/privacy"   element={<PrivacyPage />} />
          <Route path="/termini"   element={<TerminiPage />} />
          <Route path="/cookie"    element={<CookiePage />} />
          <Route path="/contatti"  element={<ContattiPage />} />
          <Route path="/ref/:code" element={<RefPage />} />
          <Route path="/success"   element={<SuccessPage user={auth.user} />} />

          {/* Rotte protette */}
          <Route path="/analisi"     element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><DashboardAnalisiPage user={auth.user} /></Layout></ProtectedRoute>} />
          <Route path="/dashboard"   element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><DashboardPage user={auth.user} /></Layout></ProtectedRoute>} />
          <Route path="/config"      element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><ConfigPage /></Layout></ProtectedRoute>} />
          <Route path="/commands"    element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><CommandsPage /></Layout></ProtectedRoute>} />
          <Route path="/memory"      element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><MemoryPage /></Layout></ProtectedRoute>} />
          <Route path="/subscription"element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><SubscriptionPage /></Layout></ProtectedRoute>} />
          <Route path="/guide"       element={<ProtectedRoute user={auth.user} loading={auth.loading}><Layout user={auth.user} onLogout={auth.logout}><GuidePage /></Layout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ConfigDirtyProvider>
      </BotStatusProvider>
    </HelmetProvider>
  );
}

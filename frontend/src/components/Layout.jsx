import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

const REAUTH_LS_KEY   = 'sma_reauth_cooldown_ts';
const REAUTH_COOLDOWN = 60;

function useReauthCooldown() {
  const [remaining, setRemaining] = useState(() => {
    const ts = parseInt(localStorage.getItem(REAUTH_LS_KEY) ?? '0');
    return Math.max(0, REAUTH_COOLDOWN - Math.floor((Date.now() - ts) / 1000));
  });
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const ts = parseInt(localStorage.getItem(REAUTH_LS_KEY) ?? '0');
      const left = Math.max(0, REAUTH_COOLDOWN - Math.floor((Date.now() - ts) / 1000));
      setRemaining(left);
      if (left <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const startCooldown = useCallback(() => {
    localStorage.setItem(REAUTH_LS_KEY, String(Date.now()));
    setRemaining(REAUTH_COOLDOWN);
  }, []);
  return { remaining, startCooldown };
}
import Sidebar from './Sidebar.jsx';
import OnboardingWizard from './OnboardingWizard.jsx';
import { getToken } from '../utils/auth.js';
import { useBotStatus } from '../contexts/BotStatusCtx.jsx';

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/config':       'Il Mio Bot',
  '/memory':       'Memoria',
  '/subscription': 'Abbonamento',
  '/analisi':      'La mia analisi',
  '/guide':        'Guida',
};

// Pagine che richiedono un piano attivo per essere usate
const GATED_PATHS = new Set(['/memory']);

function PaywallGate({ locked, children }) {
  if (!locked) return children;
  return (
    <div className="relative min-h-[420px]">
      {/* Contenuto sfocato */}
      <div style={{ filter: 'blur(8px)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Card paywall */}
      <div className="absolute inset-0 flex items-start justify-center pt-16 sm:pt-24 px-4 pointer-events-none">
        <div
          className="w-full max-w-sm rounded-2xl border p-8 text-center pointer-events-auto shadow-2xl"
          style={{ backgroundColor: '#151515', borderColor: '#262626', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        >
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-bold text-hally-text mb-3">Funzionalità Premium</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#a0a0a0' }}>
            Attiva il tuo abbonamento per accedere. Prova gratis per 7 giorni — nessun addebito oggi.
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center gap-2 font-bold text-white px-6 py-3 rounded-xl text-sm transition-all duration-150"
            style={{ backgroundColor: '#8B5CF6' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
          >
            Inizia la prova gratuita →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ user, onLogout, children }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'StreaMindAI';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [botName, setBotName] = useState('Il tuo bot');
  const [hasActivePlan, setHasActivePlan] = useState(null); // null=caricamento, true/false=caricato
  const [onboarding, setOnboarding] = useState({ completed: true, step: 0 }); // default true evita flicker
  const [needsReauth, setNeedsReauth] = useState(false);
  const { remaining: reauthRemaining, startCooldown: startReauthCooldown } = useReauthCooldown();

  const { botActive, setBotActive } = useBotStatus();

  // Chiudi drawer al cambio di rotta
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) { setHasActivePlan(false); return; }
    const token = getToken();
    fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data == null) return;
        setBotName(data.bot_name || 'Il tuo bot');
        setBotActive(data.bot_active === true ? true : data.bot_active === false ? false : null);
      })
      .catch(() => {});
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const s = data?.subscription?.status;
        const active = s === 'active' || s === 'cancelling' || s === 'trialing';
        setHasActivePlan(active);
        if (active) {
          fetch('/api/onboarding', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(ob => { if (ob) setOnboarding({ completed: ob.completed, step: ob.step }); })
            .catch(() => {});
        }
      })
      .catch(() => setHasActivePlan(false));
    fetch('/api/auth/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setNeedsReauth(data.needs_reauth === true); })
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex min-h-screen bg-hally-bg">
      {hasActivePlan && !onboarding.completed && (
        <OnboardingWizard
          initialStep={onboarding.step}
          onComplete={() => setOnboarding({ completed: true, step: 3 })}
        />
      )}

      <Sidebar
        user={user}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hasActivePlan={hasActivePlan === true}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 shrink-0 border-b border-hally-border bg-hally-bg-card flex items-center justify-between px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3">
            {/* Hamburger — visibile solo mobile */}
            <button
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Titolo pagina */}
            <h1 className="text-sm font-semibold text-hally-text">{title}</h1>
          </div>

          {/* Destra: bot badge + user */}
          <div className="flex items-center gap-3">
            {/* Nome bot */}
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
              style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)', color: '#8B5CF6' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300"
                style={{
                  backgroundColor: botActive === true ? '#4ade80' : botActive === false ? '#f87171' : '#6b7280',
                }}
                title={botActive === true ? 'Bot attivo' : botActive === false ? 'Bot inattivo' : 'Bot non configurato'}
              />
              {botName}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-hally-border hidden sm:block" />

            {/* Avatar + nome Twitch */}
            <div className="flex items-center gap-2.5">
              {user?.avatar
                ? <img src={user.avatar} alt={user.display_name} className="w-7 h-7 rounded-full border border-hally-border" />
                : <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
                    style={{ backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#8B5CF6' }}
                  >
                    {user?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
              }
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-semibold text-hally-text">{user?.display_name}</p>
                <p className="text-xs text-hally-text-muted">@{user?.twitch_username}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Banner ri-autenticazione Twitch */}
        {needsReauth && (
          <div
            className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 text-sm"
            style={{ backgroundColor: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.3)' }}
          >
            <span style={{ color: '#fbbf24' }}>
              ⚠️ Aggiorna la connessione Twitch per abilitare tutte le funzioni del bot (follow, sub, gift, hype train). Richiede solo 10 secondi.
            </span>
            {reauthRemaining > 0 ? (
              <button
                disabled
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(107,114,128,0.12)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)', cursor: 'not-allowed' }}
              >
                Riconnessione in corso… ({reauthRemaining}s)
              </button>
            ) : (
              <a
                href={`/api/auth/twitch?redirect_to=${encodeURIComponent(pathname)}`}
                onClick={startReauthCooldown}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(251,191,36,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(251,191,36,0.15)'; }}
              >
                Riconnetti Twitch →
              </a>
            )}
          </div>
        )}

        {/* Contenuto pagina */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-7">
            <PaywallGate locked={GATED_PATHS.has(pathname) && hasActivePlan === false}>
              {children}
            </PaywallGate>
          </div>
        </main>
      </div>
    </div>
  );
}

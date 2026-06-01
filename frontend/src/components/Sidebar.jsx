import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useConfigDirty } from '../contexts/ConfigDirtyCtx.jsx';

const REAUTH_LS_KEY   = 'sma_reauth_cooldown_ts';
const REAUTH_COOLDOWN = 60; // secondi

function useTwitchReauthCooldown() {
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

  const startCooldown = () => {
    localStorage.setItem(REAUTH_LS_KEY, String(Date.now()));
    setRemaining(REAUTH_COOLDOWN);
  };

  return { remaining, startCooldown };
}

// ---------------------------------------------------------------------------
// Icone SVG inline
// ---------------------------------------------------------------------------

const IconDashboard = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
    <rect x="1" y="1" width="6.2" height="6.2" rx="1.2"/>
    <rect x="8.8" y="1" width="6.2" height="6.2" rx="1.2"/>
    <rect x="1" y="8.8" width="6.2" height="6.2" rx="1.2"/>
    <rect x="8.8" y="8.8" width="6.2" height="6.2" rx="1.2"/>
  </svg>
);

const IconBot = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <rect x="3" y="4" width="10" height="9" rx="1.5"/>
    <path d="M5 4V2.5m6 1.5V2.5M1 8h2m10 0h2"/>
    <circle cx="5.5" cy="8" r="1" fill="currentColor" stroke="none"/>
    <circle cx="10.5" cy="8" r="1" fill="currentColor" stroke="none"/>
    <path d="M6 11h4"/>
  </svg>
);

const IconMemory = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 .9.3 1.8.7 2.5C3.8 9.2 3.5 10 3.5 11c0 2 1.6 3.5 3.5 3.5h2c2 0 3.5-1.6 3.5-3.5 0-1-.3-1.8-.7-2.5.4-.7.7-1.6.7-2.5C12.5 3.5 10.5 1.5 8 1.5Z"/>
    <path d="M8 1.5v13"/>
  </svg>
);

const IconSubscription = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M1.5 5.5 4 2h8l2.5 3.5L8 14 1.5 5.5Z"/>
    <path d="M1.5 5.5h13M5.5 2 4 5.5M10.5 2l1.5 3.5"/>
  </svg>
);

const IconCommands = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M2 4h12M2 8h8M2 12h5"/>
    <path d="M12 10l2 2-2 2"/>
  </svg>
);

const IconGuide = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M2 2.5A.5.5 0 0 1 2.5 2H10a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5H2.5a.5.5 0 0 1-.5-.5v-11Z"/>
    <path d="M10.5 4H14v9.5a.5.5 0 0 1-.5.5H10.5"/>
    <path d="M4.5 5.5h4M4.5 8h4M4.5 10.5h2.5"/>
  </svg>
);

const IconChangelog = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z"/>
    <path d="M8 4.5v4l2.5 1.5"/>
  </svg>
);

const IconStatus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
    <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none"/>
    <path d="M3.5 12.5A6.5 6.5 0 0 1 8 1.5a6.5 6.5 0 0 1 4.5 11"/>
    <path d="M1.5 10a7.5 7.5 0 0 0 13 0"/>
  </svg>
);

function BrainWaveLogo({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M18 4C14.134 4 11 7.134 11 11C11 11.55 11.06 12.09 11.17 12.6C10 13.38 9.3 14.64 9.3 16C9.3 17.77 10.33 19.3 11.82 20.03C12 21.1 12.44 22.1 13.1 22.9L13.5 27H18V4Z" fill="#8B5CF6"/>
      <path d="M18 4C21.866 4 25 7.134 25 11C25 11.55 24.94 12.09 24.83 12.6C26 13.38 26.7 14.64 26.7 16C26.7 17.77 25.67 19.3 24.18 20.03C24 21.1 23.56 22.1 22.9 22.9L22.5 27H18V4Z" fill="#8B5CF6" fillOpacity="0.6"/>
      <line x1="18" y1="4.5" x2="18" y2="27" stroke="#0d0d0d" strokeWidth="1.5"/>
      <path d="M4 32C6.5 30 8.5 32 11 30C13.5 28 15.5 31 18 29C20.5 27 22.5 30 25 30C27.5 30 29.5 32 32 32" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dati navigazione
// ---------------------------------------------------------------------------

const navItems = [
  { to: '/dashboard',    Icon: IconDashboard,    label: 'Dashboard' },
  { to: '/config',       Icon: IconBot,          label: 'Il Mio Bot' },
  { to: '/commands',     Icon: IconCommands,     label: 'Comandi' },
  { to: '/memory',       Icon: IconMemory,       label: 'Memoria' },
  { to: '/subscription', Icon: IconSubscription, label: 'Abbonamento' },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar({ user, onLogout, open, onClose, hasActivePlan }) {
  const { dirty } = useConfigDirty();
  const { pathname } = useLocation();
  const { remaining, startCooldown } = useTwitchReauthCooldown();
  const reauthHref = `/api/auth/twitch?redirect_to=${encodeURIComponent(pathname)}`;
  return (
    <>
      {/* Overlay mobile (scuro dietro il drawer) */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Aside — drawer su mobile, sticky su desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-64
          bg-hally-bg-card border-r border-hally-border
          transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo + X (mobile) */}
        <div className="px-5 py-2 border-b border-hally-border flex items-center gap-2.5">
          <a
            href="/"
            className="flex items-center flex-1 hover:opacity-80 transition-opacity"
            onClick={onClose}
          >
            <img
              src="/logo-horizontal.png"
              alt="StreaMindAI"
              className="h-10 w-auto"
            />
          </a>
          {/* ← button — solo mobile */}
          <button
            onClick={onClose}
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover transition-colors flex-shrink-0"
            aria-label="Chiudi menu"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M10 3L4 8l6 5" />
            </svg>
          </button>
        </div>

        {/* Nav principale */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-hally-orange-muted text-hally-orange'
                    : 'text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#8B5CF6' : undefined }}>
                    <Icon />
                  </span>
                  <span className="flex-1">{label}</span>
                  {to === '/config' && dirty && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: '#f59e0b' }}
                      title="Modifiche non salvate"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Separator */}
          <div className="my-2 border-t border-hally-border" />

          {/* Guida */}
          <NavLink
            to="/guide"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-hally-orange-muted text-hally-orange'
                  : 'text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#8B5CF6' : undefined }}>
                  <IconGuide />
                </span>
                Guida
              </>
            )}
          </NavLink>

          {/* Changelog */}
          <NavLink
            to="/changelog"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-hally-orange-muted text-hally-orange'
                  : 'text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#8B5CF6' : undefined }}>
                  <IconChangelog />
                </span>
                Novità
              </>
            )}
          </NavLink>

          {/* Status */}
          <NavLink
            to="/status"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-hally-orange-muted text-hally-orange'
                  : 'text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? '#8B5CF6' : undefined }}>
                  <IconStatus />
                </span>
                Status
              </>
            )}
          </NavLink>

          {/* Torna al sito */}
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium text-hally-text-muted hover:text-hally-text hover:bg-hally-bg-hover transition-all duration-150"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <path d="M2 8h12M2 8l4-4M2 8l4 4"/>
            </svg>
            Torna al sito
          </a>
        </nav>

        {/* Riconnetti Twitch */}
        {user && (
          <div className="px-3 pb-2 border-t border-hally-border pt-3">
            {remaining > 0 ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)', color: '#6b7280', cursor: 'not-allowed' }}
              >
                🔄 Riconnessione in corso… ({remaining}s)
              </button>
            ) : (
              <a
                href={reauthHref}
                onClick={startCooldown}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.12)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.06)'}
              >
                🔄 Riconnetti Twitch
              </a>
            )}
          </div>
        )}

        {/* User info + logout */}
        <div className="px-3 py-3 border-t border-hally-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-hally-bg-hover transition-colors group">
            {user?.avatar
              ? <img src={user.avatar} alt={user.display_name} className="w-8 h-8 rounded-full border border-hally-border shrink-0" />
              : <div className="w-8 h-8 rounded-full bg-hally-orange-muted border border-hally-orange/30 flex items-center justify-center shrink-0 text-xs font-bold text-hally-orange">
                  {user?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-hally-text truncate leading-tight">{user?.display_name ?? '—'}</p>
              <p className="text-xs text-hally-text-muted truncate leading-tight">@{user?.twitch_username ?? '—'}</p>
            </div>
            <button
              onClick={() => { onLogout(); onClose(); }}
              title="Esci"
              className="w-9 h-9 flex items-center justify-center rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity text-hally-text-muted hover:text-red-400 hover:bg-hally-bg-hover flex-shrink-0"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
                <path d="M6 2H2.5A.5.5 0 0 0 2 2.5v11a.5.5 0 0 0 .5.5H6M11 11l3-3-3-3M6 8h8"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

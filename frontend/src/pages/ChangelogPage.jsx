import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AccountMenu from '../components/AccountMenu.jsx';

const PURPLE = '#8B5CF6';

// ---------------------------------------------------------------------------
// Logo (stesso di LandingPage)
// ---------------------------------------------------------------------------
function BrainWaveLogo({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M18 4C14.134 4 11 7.134 11 11C11 11.55 11.06 12.09 11.17 12.6C10 13.38 9.3 14.64 9.3 16C9.3 17.77 10.33 19.3 11.82 20.03C12 21.1 12.44 22.1 13.1 22.9L13.5 27H18V4Z" fill="#8B5CF6" />
      <path d="M18 4C21.866 4 25 7.134 25 11C25 11.55 24.94 12.09 24.83 12.6C26 13.38 26.7 14.64 26.7 16C26.7 17.77 25.67 19.3 24.18 20.03C24 21.1 23.56 22.1 22.9 22.9L22.5 27H18V4Z" fill="#8B5CF6" fillOpacity="0.7" />
      <line x1="18" y1="4.5" x2="18" y2="27" stroke="#0d0d0d" strokeWidth="1.5" />
      <path d="M4 32C6.5 30 8.5 32 11 30C13.5 28 15.5 31 18 29C20.5 27 22.5 30 25 30C27.5 30 29.5 32 32 32" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dati changelog
// ---------------------------------------------------------------------------
const months = [
  {
    label: 'Maggio 2026',
    badge: 'Lancio Beta',
    badgeColor: PURPLE,
    entries: [
      { emoji: '🚀', text: 'Lancio ufficiale piattaforma StreaMindAI' },
      { emoji: '🤖', text: 'Bot AI personalizzabile con nome, personalità e membri' },
      { emoji: '🎵', text: 'Song request Spotify integrato' },
      { emoji: '💾', text: 'Sistema memoria — il bot impara dalla chat' },
      { emoji: '📊', text: 'Analisi canale gratuita con piano editoriale' },
      { emoji: '🎮', text: 'Supporto eventi Twitch: follow, sub, gift, bit, hype train, raid' },
      { emoji: '🎯', text: 'Shoutout automatico durante i raid' },
      { emoji: '📱', text: 'Dashboard responsive mobile' },
      { emoji: '🔒', text: 'Trial gratuito 7 giorni (Starter, Creator, Elite)' },
      { emoji: '📧', text: 'Email automatiche per tutti gli eventi' },
      { emoji: '🌐', text: 'Dominio ufficiale: streamindai.com' },
      { emoji: '⚙️', text: 'Personalizzazione limiti messaggi e song request per piano' },
    ],
  },
  {
    label: 'Aprile 2026',
    badge: 'Sviluppo',
    badgeColor: '#0ea5e9',
    entries: [
      { emoji: '⚡', text: 'Sistema multi-tenant' },
      { emoji: '🗄️', text: 'Database PostgreSQL con memoria' },
      { emoji: '🔐', text: 'Autenticazione Twitch OAuth 2.0' },
      { emoji: '💳', text: 'Integrazione Stripe pagamenti ricorrenti' },
      { emoji: '🤖', text: 'Motore AI proprietario StreaMindAI' },
      { emoji: '📋', text: 'Pannello configurazione bot' },
      { emoji: '🎃', text: 'Prima versione Hally — bot demo di gCernu' },
    ],
  },
  {
    label: 'Marzo 2026',
    badge: 'Prototipo',
    badgeColor: '#10b981',
    entries: [
      { emoji: '💡', text: 'Idea iniziale nata dal bot Hally di gCernu' },
      { emoji: '🔧', text: 'Prima versione bot Hally su Twitch' },
      { emoji: '🧠', text: 'Sistema apprendimento automatico dalla chat' },
      { emoji: '🎵', text: 'Prima integrazione Spotify' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Componente principale
// ---------------------------------------------------------------------------
export default function ChangelogPage({ user, loading, onLogout }) {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f0f0f0' }}>

      <Helmet>
        <title>Changelog — Novità e Aggiornamenti | StreaMindAI</title>
        <meta name="description" content="Tutte le novità, funzionalità e aggiornamenti di StreaMindAI — il bot AI personalizzato per streamer Twitch italiani." />
        <link rel="canonical" href="https://streamindai.com/changelog" />
        <meta property="og:title" content="Changelog — Novità e Aggiornamenti | StreaMindAI" />
        <meta property="og:url" content="https://streamindai.com/changelog" />
      </Helmet>

      {/* ── Navbar ── */}
      <header style={{ borderBottom: '1px solid #1e1e1e', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}
        className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo-horizontal.png" alt="StreaMindAI" className="h-10 md:h-14 w-auto max-w-[200px] md:max-w-[280px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#a0a0a0' }}>
            <Link to="/#features" className="hover:text-white transition-colors">Funzionalità</Link>
            <Link to="/#pricing"  className="hover:text-white transition-colors">Prezzi</Link>
            <Link to="/prova-gratis" className="hover:text-white transition-colors">Analisi Gratis</Link>
          </nav>
          <AccountMenu user={user} loading={loading} onLogout={onLogout} />
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(139,92,246,0.12)', color: PURPLE, border: '1px solid rgba(139,92,246,0.25)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: PURPLE, display: 'inline-block' }} />
          Aggiornamenti
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
          Changelog
        </h1>
        <p className="text-lg" style={{ color: '#6b6b6b' }}>
          Tutte le novità e gli aggiornamenti di StreaMindAI, in ordine cronologico.
        </p>
      </section>

      {/* ── Timeline ── */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        {months.map((month, mi) => (
          <section key={mi} className="mb-16 last:mb-0">

            {/* Intestazione mese */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold" style={{ color: '#fff' }}>{month.label}</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${month.badgeColor}18`, color: month.badgeColor, border: `1px solid ${month.badgeColor}30` }}>
                  {month.badge}
                </span>
              </div>
              <div className="flex-1 h-px" style={{ background: '#1e1e1e' }} />
            </div>

            {/* Voci timeline */}
            <div className="relative">
              {/* Linea verticale */}
              <div className="absolute left-4 top-2 bottom-2 w-px"
                style={{ background: `linear-gradient(to bottom, ${month.badgeColor}60, ${month.badgeColor}10)` }} />

              <div className="space-y-1">
                {month.entries.map((entry, ei) => (
                  <div key={ei} className="flex items-start gap-5 group">

                    {/* Dot sulla linea */}
                    <div className="relative z-10 flex-shrink-0 mt-3.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
                        style={{ background: '#111', border: `1px solid ${month.badgeColor}40` }}>
                        <span className="text-sm leading-none" role="img" aria-hidden="true">{entry.emoji}</span>
                      </div>
                    </div>

                    {/* Testo */}
                    <div className="flex-1 py-3 px-4 rounded-xl transition-colors duration-150"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#111'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <p className="text-sm leading-relaxed" style={{ color: '#c0c0c0' }}>
                        {entry.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Fine timeline */}
        <div className="flex items-center gap-4 mt-16">
          <div className="flex-1 h-px" style={{ background: '#1e1e1e' }} />
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ color: '#444', border: '1px solid #1e1e1e' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#333', display: 'inline-block' }} />
            Inizio dello sviluppo
          </div>
          <div className="flex-1 h-px" style={{ background: '#1e1e1e' }} />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t px-6 py-10" style={{ borderColor: '#1e1e1e', background: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BrainWaveLogo className="w-5 h-5" />
            <span className="text-sm font-extrabold" style={{ color: '#fff' }}>StreaMindAI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: '#6b6b6b' }}>
            <Link to="/"          className="hover:text-white transition-colors">Home</Link>
            <Link to="/prova-gratis" className="hover:text-white transition-colors">Analisi Gratis</Link>
            <Link to="/changelog" className="hover:text-white transition-colors" style={{ color: PURPLE }}>Changelog</Link>
            <Link to="/login"     className="hover:text-white transition-colors">Accedi</Link>
          </div>
          <p className="text-xs text-center" style={{ color: '#444' }}>
            © 2026 StreaMindAI — Non affiliato con Twitch Interactive, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}

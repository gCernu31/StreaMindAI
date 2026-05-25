import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AccountMenu from '../components/AccountMenu.jsx';

// ---------------------------------------------------------------------------
// Logo cervello + onda (SVG inline, lilla)
// ---------------------------------------------------------------------------

function BrainWaveLogo({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      {/* Lobo sinistro */}
      <path
        d="M18 4C14.134 4 11 7.134 11 11C11 11.55 11.06 12.09 11.17 12.6C10 13.38 9.3 14.64 9.3 16C9.3 17.77 10.33 19.3 11.82 20.03C12 21.1 12.44 22.1 13.1 22.9L13.5 27H18V4Z"
        fill="#8B5CF6"
      />
      {/* Lobo destro */}
      <path
        d="M18 4C21.866 4 25 7.134 25 11C25 11.55 24.94 12.09 24.83 12.6C26 13.38 26.7 14.64 26.7 16C26.7 17.77 25.67 19.3 24.18 20.03C24 21.1 23.56 22.1 22.9 22.9L22.5 27H18V4Z"
        fill="#8B5CF6"
        fillOpacity="0.7"
      />
      {/* Solco centrale */}
      <line x1="18" y1="4.5" x2="18" y2="27" stroke="#0d0d0d" strokeWidth="1.5" />
      {/* Onda */}
      <path
        d="M4 32C6.5 30 8.5 32 11 30C13.5 28 15.5 31 18 29C20.5 27 22.5 30 25 30C27.5 30 29.5 32 32 32"
        stroke="#8B5CF6"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Dati statici
// ---------------------------------------------------------------------------

const PURPLE   = '#8B5CF6';
const PURPLE_H = '#7C3AED';

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    title: 'AI Personalizzata',
    desc: 'Definisci personalità, tono e stile. StreaMindAI diventa unica per la tua community — non un bot generico, ma un\'entità che conosce la tua stream.',
    detail: 'Motore AI proprietario StreaMindAI',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
      </svg>
    ),
    title: 'Song Request Spotify',
    desc: 'I tuoi viewer possono richiedere canzoni direttamente in chat. StreaMindAI le aggiunge alla coda Spotify in tempo reale.',
    detail: 'Limite configurabile per sub e non-sub',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'EventSub in Tempo Reale',
    desc: 'Ringraziamenti automatici per follow, sub, bit e raid. StreaMindAI celebra ogni momento importante della tua stream.',
    detail: 'Follow · Sub · Bit · Raid · Hype Train',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'Memoria Persistente',
    desc: 'StreaMindAI impara dalla tua chat e ricorda inside joke, eventi, promesse e preferenze. La community si sente riconosciuta ad ogni stream.',
    detail: 'Apprendimento automatico ogni 20 messaggi',
  },
];

const steps = [
  { n: '01', title: 'Accedi con Twitch', desc: 'Un click. Usi il tuo account Twitch esistente, nessuna nuova password.' },
  { n: '02', title: 'Configura StreaMindAI', desc: 'Dai una personalità al bot, imposta i comandi e personalizza le risposte in pochi minuti.' },
  { n: '03', title: 'Live sul tuo canale', desc: 'StreaMindAI è attiva automaticamente. La tua community inizia a interagire da subito.' },
];

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    desc: 'Nessuna carta di credito richiesta',
    features: [
      'Bot AI di base',
      'Showstarter automatico al go-live',
      'Benvenuto nuovi follower',
      'Ringraziamenti eventi (sub, gift, cheer, raid)',
      'Lurker Love (!lurk)',
    ],
    cta: 'Inizia gratis →',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '12',
    desc: 'Per chi inizia',
    features: [
      'Bot AI base con personalità configurabile',
      'Max 10 membri configurabili',
      'Risposte automatiche: follow e sub',
      'Max 200 messaggi/sera sul canale',
      '4.000 messaggi/mese',
      'Trial 7 giorni con carta',
    ],
    cta: 'Inizia con Starter',
    highlight: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '24',
    desc: 'Per streamer in crescita',
    features: [
      'Bot AI completamente personalizzato',
      'Song request Spotify (!sr)',
      'Memoria base (apprendimento automatico)',
      'Tutti gli eventi automatici',
      'Max 600 messaggi/sera sul canale',
      '12.000 messaggi/mese',
      'Trial 7 giorni con carta',
    ],
    cta: 'Scegli Creator',
    highlight: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '44',
    desc: 'Il più scelto',
    badge: 'Più popolare',
    features: [
      'Tutto di Creator',
      'Analytics canale mensile',
      'Memoria avanzata con contesto di gioco',
      'Messaggi eventi completamente personalizzabili',
      'Max 1.200 messaggi/sera sul canale',
      '24.000 messaggi/mese',
      'Trial 7 giorni con carta',
    ],
    cta: 'Vai con Elite',
    highlight: true,
  },
  {
    id: 'signature',
    name: 'Signature',
    price: '99',
    desc: 'Il massimo, senza limiti',
    features: [
      'Tutto di Elite',
      'Onboarding 1:1 con gCernu',
      'Supporto diretto',
      'Setup completamente personalizzato',
      'Max 3.000 messaggi/sera sul canale',
      '60.000 messaggi/mese',
      'Nessun trial — contatto diretto prima dell\'attivazione',
    ],
    cta: 'Signature Experience',
    highlight: false,
  },
];


// ---------------------------------------------------------------------------
// Mockup chat Twitch animato
// ---------------------------------------------------------------------------

const chatMessages = [
  { user: 'darkwolf_99',  color: '#9147ff', text: '!bot qual è il tuo gioco preferito?' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: 'Dipende dall\'umore! Ma se mi costringi a scegliere… God of War. gCernu ne ha parlato per ore 😄' },
  { user: 'streamer_fan', color: '#00c8ff', text: '!sr Blinding Lights - The Weeknd' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: '✅ Aggiunta alla coda Spotify! Posizione #2 🎵' },
  { user: 'luigi_gamer',  color: '#ff4e6a', text: 'primo follow della serata!' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: '🎉 Benvenuto luigi_gamer! Primo follow = cuore speciale nel nostro stream ❤️' },
  { user: 'marta_plays',  color: '#43b581', text: '!bot cosa sta giocando oggi?' },
  { user: 'StreaMindAI', color: PURPLE, badge: 'BOT', text: 'Oggi è serata Elden Ring! gCernu ha giurato di finire il boss stasera… vedremo 😂' },
];

function TwitchChatMockup() {
  const [visible, setVisible] = useState(2);

  useEffect(() => {
    if (visible >= chatMessages.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 1400);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#18181b] shadow-2xl shadow-black/60 font-sans">
      {/* Barra titolo */}
      <div className="bg-[#0e0e10] px-4 py-3 flex items-center justify-between border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
            <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
            <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
          </div>
          <span className="text-[#efeff1] text-xs font-medium ml-2">💬 Chat — #gcernu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-[#bf94ff] text-xs font-semibold">LIVE</span>
          <span className="text-[#adadb8] text-xs ml-1">1.2k</span>
        </div>
      </div>

      {/* Messaggi */}
      <div className="px-3 py-3 space-y-2.5 min-h-[280px]">
        {chatMessages.slice(0, visible).map((msg, i) => (
          <div key={i} className="text-sm leading-snug" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            {msg.badge && (
              <span
                className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 align-middle"
                style={{ backgroundColor: PURPLE, color: '#fff' }}
              >
                {msg.badge}
              </span>
            )}
            <span className="font-bold" style={{ color: msg.color }}>{msg.user}</span>
            <span className="text-[#adadb8]">: </span>
            <span className={msg.badge ? 'text-[#efeff1]' : 'text-[#c0c0c0]'}>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="border-t border-[#2a2a2a] px-3 py-2.5">
        <div className="bg-[#3a3a3d] rounded-md px-3 py-2 text-xs text-[#adadb8]">
          Invia un messaggio…
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({ user, loading, onLogout }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#262626]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <BrainWaveLogo className="w-7 h-7 group-hover:opacity-80 transition-opacity" />
          <span className="text-xl font-extrabold text-white tracking-tight group-hover:text-[#8B5CF6] transition-colors">
            StreaMindAI
          </span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#a0a0a0]">
          <a href="#features" className="hover:text-white transition-colors">Funzionalità</a>
          <a href="#how"      className="hover:text-white transition-colors">Come funziona</a>
          <a href="#pricing"  className="hover:text-white transition-colors">Prezzi</a>
          <Link to="/faq"     className="hover:text-white transition-colors">FAQ</Link>
          <Link to="/prova-gratis" className="hover:text-white transition-colors" style={{ color: PURPLE }}>Analisi Gratis</Link>
        </nav>

        {/* Account */}
        <AccountMenu user={user} loading={loading} onLogout={onLogout} />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

const STRUCTURED_DATA_APP = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StreaMindAI',
  description: 'Bot AI personalizzato per chat Twitch. Risponde in chat, ringrazia follower, gestisce song request e impara dalla community.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://streamindai.com',
  offers: [
    { '@type': 'Offer', name: 'Free',      price: '0.00',  priceCurrency: 'EUR', description: 'Bot AI di base, eventi automatici, nessuna carta richiesta' },
    { '@type': 'Offer', name: 'Starter',   price: '12.00', priceCurrency: 'EUR', description: 'Bot AI base, 4.000 messaggi/mese, trial 7 giorni' },
    { '@type': 'Offer', name: 'Creator',   price: '24.00', priceCurrency: 'EUR', description: 'Song request Spotify, 12.000 messaggi/mese, trial 7 giorni' },
    { '@type': 'Offer', name: 'Elite',     price: '44.00', priceCurrency: 'EUR', description: 'Analytics, memoria avanzata, 24.000 messaggi/mese, trial 7 giorni' },
    { '@type': 'Offer', name: 'Signature', price: '99.00', priceCurrency: 'EUR', description: 'Onboarding 1:1, setup personalizzato, 60.000 messaggi/mese' },
  ],
};

const STRUCTURED_DATA_ORG = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StreaMindAI',
  url: 'https://streamindai.com',
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@streamindai.com' },
};

export default function LandingPage({ user, loading, onLogout }) {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>

      <Helmet>
        <title>StreaMindAI — Il Bot AI per la tua Chat Twitch | Prova Gratis</title>
        <meta name="description" content="Crea il tuo bot AI personalizzato per Twitch in pochi minuti. StreaMindAI impara dalla tua community, risponde in chat e cresce con te. Prova gratis 7 giorni." />
        <meta name="keywords" content="bot AI Twitch, intelligenza artificiale chat Twitch, chatbot AI personalizzato Twitch, AI per streamer, tool AI streaming, bot AI italiano Twitch, integrare AI chat Twitch" />
        <link rel="canonical" href="https://streamindai.com/" />
        <link rel="preconnect" href="https://id.twitch.tv" />
        <link rel="preconnect" href="https://api.twitch.tv" />
        <meta property="og:type"        content="website" />
        <meta property="og:url"         content="https://streamindai.com/" />
        <meta property="og:title"       content="StreaMindAI — Il Bot AI per la tua Chat Twitch | Prova Gratis" />
        <meta property="og:description" content="Crea il tuo bot AI personalizzato per Twitch in pochi minuti. StreaMindAI impara dalla tua community, risponde in chat e cresce con te. Prova gratis 7 giorni." />
        <meta property="og:locale"      content="it_IT" />
        <meta property="og:site_name"   content="StreaMindAI" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="StreaMindAI — Il Bot AI per la tua Chat Twitch" />
        <meta name="twitter:description" content="Crea il tuo bot AI personalizzato per Twitch in pochi minuti. Prova gratis 7 giorni." />
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA_APP)}</script>
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA_ORG)}</script>
      </Helmet>

      <Header user={user} loading={loading} onLogout={onLogout} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Sfondo glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(139,92,246,0.13) 0%, transparent 70%)' }}
        />
        {/* Griglia decorativa */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Testo */}
            <div className="flex-1 text-center lg:text-left">
              {/* Launch Badge */}
              <div
                className="inline-flex items-center gap-2 border text-xs font-bold px-4 py-2 rounded-full mb-3"
                style={{
                  borderColor: 'rgba(139,92,246,0.6)',
                  backgroundColor: 'rgba(139,92,246,0.14)',
                  color: PURPLE,
                  boxShadow: '0 0 18px rgba(139,92,246,0.25)',
                }}
              >
                🎉 Beta Launch — Sii tra i primi. Trial gratuito 7 giorni.
              </div>

              {/* Badge */}
              <div
                className="flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-full mb-8 w-fit"
                style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }}></span>
                In produzione su Twitch
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Il bot AI per Twitch<br />
                <span style={{ color: PURPLE }}>che impara da te</span>
              </h1>

              <p className="text-lg lg:text-xl mb-10 max-w-xl mx-auto lg:mx-0" style={{ color: '#a0a0a0' }}>
                StreaMindAI è il chatbot AI personalizzato per la tua chat Twitch: risponde agli spettatori, ringrazia i follower, gestisce le song request e cresce con la tua community — tutto in automatico, tutto configurabile.
              </p>

              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 justify-center lg:justify-start">
                <Link
                  to={user ? '/dashboard' : '/login'}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl text-base transition-all duration-150 shadow-lg"
                  style={{ backgroundColor: PURPLE, boxShadow: '0 0 24px rgba(139,92,246,0.35)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = PURPLE_H; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.35)'; }}
                >
                  {user ? 'Apri Dashboard' : 'Inizia Gratis'}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href="#pricing"
                  className="w-full sm:w-auto flex items-center justify-center font-medium px-8 py-3.5 rounded-xl text-base transition-colors duration-150 border"
                  style={{ borderColor: '#262626', color: '#a0a0a0', backgroundColor: '#151515' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#383838'; e.currentTarget.style.color = '#f0f0f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.color = '#a0a0a0'; }}
                >
                  Vedi i prezzi
                </a>
              </div>

              <p className="mt-6 text-sm" style={{ color: '#6b6b6b' }}>
                7 giorni di prova — nessun addebito oggi · Annulla quando vuoi
              </p>
            </div>

            {/* Mockup chat */}
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
              <TwitchChatMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNZIONALITÀ ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Funzionalità
            </p>
            <h2 className="text-4xl font-extrabold mb-4">Tutto quello che ti serve</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#a0a0a0' }}>
              Un bot completo, non solo risposte AI. StreaMindAI gestisce ogni aspetto della tua stream in modo intelligente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-xl p-7 border transition-all duration-200 cursor-default"
                style={{ backgroundColor: '#151515', borderColor: '#262626' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.backgroundColor = '#151515'; }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                  style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: PURPLE }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#a0a0a0' }}>{f.desc}</p>
                <p className="text-xs font-medium" style={{ color: '#6b6b6b' }}>{f.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COME FUNZIONA ────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Come funziona
            </p>
            <h2 className="text-4xl font-extrabold mb-4">Pronto in 3 minuti</h2>
            <p className="text-lg" style={{ color: '#a0a0a0' }}>
              Nessuna configurazione tecnica. Nessun server da gestire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute" />
            {steps.map((step, i) => (
              <div key={i} className="text-center md:text-left">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-xl font-black mb-5 border"
                  style={{ backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: PURPLE }}
                >
                  {step.n}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#a0a0a0' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
              Prezzi
            </p>
            <h2 className="text-4xl font-extrabold mb-4">Semplici e trasparenti</h2>
            <p className="text-lg" style={{ color: '#a0a0a0' }}>
              Nessuna commissione. Nessun costo nascosto. Cancelli quando vuoi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-start">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl p-7 border flex flex-col relative transition-all duration-200"
                style={{
                  backgroundColor: plan.highlight ? '#1a1a1a' : '#151515',
                  borderColor: plan.highlight ? PURPLE : '#262626',
                  boxShadow: plan.highlight ? '0 0 40px rgba(139,92,246,0.12)' : 'none',
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full text-white"
                    style={{ backgroundColor: PURPLE }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>{plan.desc}</p>
                </div>

                <div className="mb-7 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold" style={{ color: PURPLE }}>{plan.price}€</span>
                  <span className="text-sm" style={{ color: '#6b6b6b' }}>/mese</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: PURPLE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span style={{ color: '#a0a0a0' }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login"
                  className="block text-center font-semibold py-3 rounded-xl text-sm transition-all duration-150"
                  style={
                    plan.highlight
                      ? { backgroundColor: PURPLE, color: '#fff' }
                      : { backgroundColor: '#1e1e1e', color: '#f0f0f0', border: '1px solid #262626' }
                  }
                  onMouseEnter={e => {
                    if (plan.highlight) e.currentTarget.style.backgroundColor = PURPLE_H;
                    else e.currentTarget.style.borderColor = '#383838';
                  }}
                  onMouseLeave={e => {
                    if (plan.highlight) e.currentTarget.style.backgroundColor = PURPLE;
                    else e.currentTarget.style.borderColor = '#262626';
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-sm" style={{ color: '#6b6b6b' }}>
            Hai dubbi? Scrivici a <a href="mailto:support@streamindai.com" style={{ color: '#8B5CF6', textDecoration: 'none' }}>support@streamindai.com</a> — rispondiamo entro poche ore.
          </p>
        </div>
      </section>

      {/* ── CTA FINALE ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <BrainWaveLogo className="w-14 h-14" />
          </div>
          <h2 className="text-4xl font-extrabold mb-4">
            Integra l'AI nella tua chat Twitch, oggi
          </h2>
          <p className="text-lg mb-10" style={{ color: '#a0a0a0' }}>
            Unisciti agli streamer italiani che usano già il bot AI StreaMindAI per coinvolgere la community ogni sera con intelligenza artificiale.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 font-bold text-white px-10 py-4 rounded-xl text-base transition-all duration-150 shadow-lg"
            style={{ backgroundColor: PURPLE, boxShadow: '0 0 32px rgba(139,92,246,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = PURPLE_H; e.currentTarget.style.boxShadow = '0 0 48px rgba(139,92,246,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.35)'; }}
          >
            Inizia Gratis con Twitch
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t px-6 py-12" style={{ borderColor: '#1e1e1e', backgroundColor: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <BrainWaveLogo className="w-6 h-6" />
                <span className="text-lg font-extrabold text-white">StreaMindAI</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: '#6b6b6b' }}>
                Dai una mente alla tua stream. L'AI che trasforma il tuo canale Twitch in un'esperienza indimenticabile.
              </p>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-10">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6b6b6b' }}>Prodotto</h4>
                <ul className="space-y-3 text-sm" style={{ color: '#a0a0a0' }}>
                  <li><a href="#features" className="hover:text-white transition-colors">Funzionalità</a></li>
                  <li><a href="#pricing"  className="hover:text-white transition-colors">Prezzi</a></li>
                  <li><a href="#how"      className="hover:text-white transition-colors">Come funziona</a></li>
                  <li><Link to="/prova-gratis" className="hover:text-white transition-colors">Analisi Gratis</Link></li>
                  <li><Link to="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                  <li><Link to="/status"    className="hover:text-white transition-colors">Status</Link></li>
                  <li><Link to="/login"    className="hover:text-white transition-colors">Accedi</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#6b6b6b' }}>Legale</h4>
                <ul className="space-y-3 text-sm" style={{ color: '#a0a0a0' }}>
                  <li><Link to="/privacy"  className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/termini"  className="hover:text-white transition-colors">Termini di Servizio</Link></li>
                  <li><Link to="/cookie"   className="hover:text-white transition-colors">Cookie Policy</Link></li>
                  <li><Link to="/faq"      className="hover:text-white transition-colors">FAQ</Link></li>
                  <li><Link to="/contatti" className="hover:text-white transition-colors">Contatti</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: '#1e1e1e' }}>
            <p className="text-xs" style={{ color: '#6b6b6b' }}>
              © 2026 StreaMindAI — Il bot AI per Twitch, fatto per gli streamer italiani
            </p>
            <p className="text-xs" style={{ color: '#6b6b6b' }}>
              Non affiliato con Twitch Interactive, Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

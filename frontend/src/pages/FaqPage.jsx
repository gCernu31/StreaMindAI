import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AccountMenu from '../components/AccountMenu.jsx';

const PURPLE = '#8B5CF6';

function BrainWaveLogo({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M18 4C14.134 4 11 7.134 11 11C11 11.55 11.06 12.09 11.17 12.6C10 13.38 9.3 14.64 9.3 16C9.3 17.77 10.33 19.3 11.82 20.03C12 21.1 12.44 22.1 13.1 22.9L13.5 27H18V4Z" fill="#8B5CF6"/>
      <path d="M18 4C21.866 4 25 7.134 25 11C25 11.55 24.94 12.09 24.83 12.6C26 13.38 26.7 14.64 26.7 16C26.7 17.77 25.67 19.3 24.18 20.03C24 21.1 23.56 22.1 22.9 22.9L22.5 27H18V4Z" fill="#8B5CF6" fillOpacity="0.7"/>
      <line x1="18" y1="4.5" x2="18" y2="27" stroke="#0d0d0d" strokeWidth="1.5"/>
      <path d="M4 32C6.5 30 8.5 32 11 30C13.5 28 15.5 31 18 29C20.5 27 22.5 30 25 30C27.5 30 29.5 32 32 32" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

const FAQS = [
  {
    q: 'Come funziona StreaMindAI?',
    a: 'StreaMindAI è una piattaforma che ti permette di creare un bot AI personalizzato per la tua chat Twitch. Il bot risponde alle domande degli spettatori, impara dalla tua community e gestisce automaticamente eventi come follow, sub e raid.',
  },
  {
    q: 'StreaMindAI funziona con qualsiasi gioco su Twitch?',
    a: 'Sì, StreaMindAI funziona con qualsiasi categoria su Twitch — giochi, Just Chatting, musica e qualsiasi altro contenuto. Il bot AI si adatta al contesto della tua live.',
  },
  {
    q: 'Devo avere competenze tecniche per usare StreaMindAI?',
    a: 'No, StreaMindAI è pensata per essere usata da chiunque. La configurazione richiede solo 3 passi guidati e non serve scrivere nessun codice. Accedi con Twitch, configura la personalità del bot e sei pronto.',
  },
  {
    q: 'Posso personalizzare il nome del bot AI?',
    a: 'Sì, puoi chiamare il tuo chatbot AI come vuoi — Luna, Max, Aria o qualsiasi nome che si adatti alla tua personalità e al tuo brand su Twitch.',
  },
  {
    q: 'Cosa succede alla scadenza del trial gratuito?',
    a: 'Alla scadenza dei 7 giorni di prova, l\'abbonamento si attiva automaticamente con la carta inserita. Puoi cancellare in qualsiasi momento prima della scadenza senza alcun addebito.',
  },
  {
    q: 'Posso cambiare piano in qualsiasi momento?',
    a: 'Sì, puoi passare a un piano superiore o inferiore in qualsiasi momento dalla sezione Abbonamento della dashboard. Le modifiche entrano in vigore immediatamente.',
  },
  {
    q: 'StreaMindAI supporta il song request su Spotify?',
    a: 'Sì, nei piani Creator, Elite e Signature gli spettatori possono richiedere canzoni con il comando !sr e il bot AI le aggiunge automaticamente alla coda del tuo Spotify.',
  },
  {
    q: 'Il bot AI impara dalla mia chat?',
    a: 'Sì, StreaMindAI analizza automaticamente la tua chat ogni 20 messaggi e salva le informazioni importanti — inside joke, eventi, caratteristiche degli spettatori — diventando sempre più personalizzata nel tempo.',
  },
  {
    q: 'Posso usare StreaMindAI su più canali Twitch?',
    a: 'Ogni account StreaMindAI è collegato a un singolo canale Twitch. Per gestire più canali è necessario un account separato per ciascuno.',
  },
];

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: '1px solid #1e1e1e',
        transition: 'background 0.15s',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
          padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
        }}
        aria-expanded={open}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', lineHeight: '1.5' }}>{q}</span>
        <span
          style={{
            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
            border: `1px solid ${open ? PURPLE : '#333'}`,
            background: open ? 'rgba(139,92,246,0.12)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            color: open ? PURPLE : '#666',
          }}
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ width: '10px', height: '10px', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </span>
      </button>
      {open && (
        <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#8a8a8a', paddingBottom: '20px', margin: 0 }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FaqPage({ user, loading, onLogout }) {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f0f0f0' }}>

      <Helmet>
        <title>FAQ — Domande Frequenti sul Bot AI per Twitch | StreaMindAI</title>
        <meta name="description" content="Tutte le risposte sul bot AI per Twitch di StreaMindAI. Come funziona, prezzi, integrazione Spotify, personalizzazione e molto altro." />
        <link rel="canonical" href="https://streamindai.com/faq" />
        <meta property="og:title" content="FAQ — Domande Frequenti | StreaMindAI" />
        <meta property="og:description" content="Tutte le risposte sul bot AI per Twitch di StreaMindAI. Come funziona, prezzi, Spotify e personalizzazione." />
        <meta property="og:url" content="https://streamindai.com/faq" />
        <script type="application/ld+json">{JSON.stringify(FAQ_JSON_LD)}</script>
      </Helmet>

      {/* Navbar */}
      <header style={{ borderBottom: '1px solid #1e1e1e', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }} className="sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo-horizontal.png" alt="StreaMindAI" className="h-10 md:h-14 w-auto max-w-[200px] md:max-w-[280px]" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: '#a0a0a0' }}>
            <Link to="/#features" className="hover:text-white transition-colors">Funzionalità</Link>
            <Link to="/#pricing"  className="hover:text-white transition-colors">Prezzi</Link>
          </nav>
          <AccountMenu user={user} loading={loading} onLogout={onLogout} />
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(139,92,246,0.12)', color: PURPLE, border: '1px solid rgba(139,92,246,0.25)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: PURPLE, display: 'inline-block' }} />
          Domande Frequenti
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: '#fff', letterSpacing: '-0.03em' }}>
          FAQ
        </h1>
        <p className="text-lg" style={{ color: '#6b6b6b' }}>
          Tutto quello che devi sapere sul bot AI per Twitch di StreaMindAI.
        </p>
      </section>

      {/* FAQ list */}
      <main className="max-w-3xl mx-auto px-6 pb-24">
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '20px', padding: '8px 32px' }}>
          {FAQS.map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center rounded-2xl p-10 border"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.04))', borderColor: 'rgba(139,92,246,0.2)' }}>
          <p className="text-lg font-bold mb-2" style={{ color: '#fff' }}>Non hai trovato risposta?</p>
          <p className="text-sm mb-6" style={{ color: '#6b6b6b' }}>
            Scrivici su Twitch o via email, rispondiamo entro poche ore.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://twitch.tv/StreaMindAI" target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 font-bold text-white px-6 py-3 rounded-xl text-sm transition-all"
              style={{ backgroundColor: PURPLE }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = PURPLE}>
              Scrivici su Twitch
            </a>
            <a href="mailto:support@streamindai.com"
              className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl text-sm border transition-all"
              style={{ borderColor: '#333', color: '#a0a0a0', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#a0a0a0'; }}>
              support@streamindai.com
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-10" style={{ borderColor: '#1e1e1e', background: '#0a0a0a' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BrainWaveLogo className="w-5 h-5" />
            <span className="text-sm font-extrabold" style={{ color: '#fff' }}>StreaMindAI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm" style={{ color: '#6b6b6b' }}>
            <Link to="/"          className="hover:text-white transition-colors">Home</Link>
            <Link to="/faq"       className="hover:text-white transition-colors" style={{ color: PURPLE }}>FAQ</Link>
            <Link to="/changelog" className="hover:text-white transition-colors">Changelog</Link>
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

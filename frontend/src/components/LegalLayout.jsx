import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

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

// Renderer Markdown minimo per le pagine legali
function LegalContent({ text }) {
  return (
    <div style={{ fontSize: '15px', lineHeight: '1.85', color: '#b0b0b0' }}>
      {text.trim().split('\n').map((line, i) => {
        if (line.startsWith('# '))
          return <h1 key={i} style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>{line.slice(2)}</h1>;
        if (line.startsWith('## '))
          return <h2 key={i} style={{ fontSize: '18px', fontWeight: 700, color: '#f0f0f0', margin: '32px 0 10px' }}>{line.slice(3)}</h2>;
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**'))
          return <p key={i} style={{ fontWeight: 700, color: '#e0e0e0', margin: '4px 0' }}>{line.slice(2, -2)}</p>;
        if (line.startsWith('- '))
          return (
            <div key={i} style={{ display: 'flex', gap: '10px', margin: '6px 0' }}>
              <span style={{ color: PURPLE, flexShrink: 0 }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e0e0e0">$1</strong>') }} />
            </div>
          );
        if (!line.trim())
          return <div key={i} style={{ height: '8px' }} />;
        return (
          <p key={i} style={{ margin: '4px 0' }}
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e0e0e0">$1</strong>') }} />
        );
      })}
    </div>
  );
}

export default function LegalLayout({ title, description, canonical, lastUpdate, children }) {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#f0f0f0' }}>
      <Helmet>
        <title>{title} | StreaMindAI</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://streamindai.com${canonical}`} />
        <meta name="robots" content="noindex,follow" />
      </Helmet>

      {/* Navbar */}
      <header style={{ borderBottom: '1px solid #1e1e1e', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }} className="sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo-horizontal.png" alt="StreaMindAI" className="h-16 md:h-20 w-auto" />
          </Link>
          <Link to="/" className="text-sm transition-colors" style={{ color: '#6b6b6b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b6b')}>
            ← Home
          </Link>
        </div>
      </header>

      {/* Contenuto */}
      <main className="max-w-3xl mx-auto px-6 py-14 pb-24">
        {lastUpdate && (
          <p style={{ fontSize: '12px', color: '#4a4a4a', marginBottom: '32px' }}>
            Ultimo aggiornamento: {lastUpdate}
          </p>
        )}
        {children}
      </main>

      {/* Footer minimale */}
      <footer className="border-t px-6 py-8" style={{ borderColor: '#1e1e1e' }}>
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" style={{ color: '#4a4a4a' }}>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/termini" className="hover:text-white transition-colors">Termini di Servizio</Link>
          <Link to="/cookie"  className="hover:text-white transition-colors">Cookie Policy</Link>
          <Link to="/faq"     className="hover:text-white transition-colors">FAQ</Link>
          <Link to="/contatti" className="hover:text-white transition-colors">Contatti</Link>
        </div>
      </footer>
    </div>
  );
}

export { LegalContent };

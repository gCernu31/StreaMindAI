import { useState } from 'react';

const PURPLE      = '#8B5CF6';
const PURPLE_DARK = '#1a0a2e';

const steps = [
  'Scarica il banner cliccando il bottone sopra',
  'Vai sul tuo canale Twitch → clicca "Modifica pannelli" sotto la live',
  'Aggiungi un nuovo pannello e carica questa immagine',
  'Imposta come link il tuo referral copiato sopra',
];

export default function PromoMaterialsModal({ onClose, referralLink }) {
  const [copied, setCopied] = useState(false);

  const downloadBanner = () => {
    const link = document.createElement('a');
    link.href = '/twitch-panel-streamindai.png';
    link.download = 'streamindai-banner.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyRef = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', animation: 'promoFadeIn 0.18s ease-out' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes promoFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: PURPLE_DARK,
          border: `1px solid rgba(139,92,246,0.45)`,
          boxShadow: `0 0 40px rgba(139,92,246,0.22), 0 20px 60px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white tracking-tight">Materiali promozionali</h3>
            <p className="text-xs mt-0.5" style={{ color: '#a78bfa' }}>
              Scarica e usa questi materiali per promuovere StreaMindAI sul tuo canale
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#6b6b6b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b6b6b'}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Banner preview */}
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: 'rgba(139,92,246,0.25)', background: '#0d0d0d' }}
          >
            <img
              src="/twitch-panel-streamindai-large.png"
              alt="Banner Twitch StreaMindAI"
              className="w-full object-contain"
              style={{ maxHeight: 180 }}
            />
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed" style={{ color: '#a0a0a0' }}>
            Usa questo banner come pannello info sotto la tua live Twitch. Cliccandoci sopra,
            i tuoi viewer potranno scoprire StreaMindAI con il tuo referral.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadBanner}
              className="flex-1 flex items-center justify-center gap-2 font-semibold text-white text-sm px-4 py-3 rounded-xl transition-all duration-150"
              style={{ background: PURPLE, boxShadow: `0 0 18px rgba(139,92,246,0.3)` }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 26px rgba(139,92,246,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = PURPLE;     e.currentTarget.style.boxShadow = '0 0 18px rgba(139,92,246,0.3)'; }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <path d="M8 2v8M5 7l3 3 3-3M2 13h12"/>
              </svg>
              Scarica banner (320×100)
            </button>

            <button
              onClick={copyRef}
              disabled={!referralLink}
              className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm px-4 py-3 rounded-xl border transition-all duration-150"
              style={copied
                ? { color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)', background: 'rgba(74,222,128,0.06)' }
                : { color: '#c4b5fd', borderColor: 'rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.07)' }
              }
              onMouseEnter={e => { if (!copied) e.currentTarget.style.background = 'rgba(139,92,246,0.14)'; }}
              onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'rgba(139,92,246,0.07)'; }}
            >
              {copied ? '✓ Copiato' : 'Copia link referral'}
            </button>
          </div>

          {/* How-to */}
          <div
            className="rounded-xl px-4 py-4 space-y-2.5"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B5CF6' }}>Come usarlo</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-snug" style={{ color: '#a0a0a0' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const PURPLE = '#8b5cf6';

const PLAN_LABELS = {
  starter:   'Starter',
  creator:   'Creator',
  elite:     'Elite',
  signature: 'Signature',
};

const STEPS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: 'Dai un nome al tuo bot',
    desc: 'Scegli il nome e la personalità del tuo bot dalla pagina Configurazione.',
    href: '/config',
    cta: 'Configura ora',
    external: false,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: 'Rendilo moderatore',
    desc: null,
    descNode: (
      <span>
        Vai nella tua chat Twitch e scrivi{' '}
        <code
          className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#c4b5fd' }}
        >
          /mod NOMEBOT
        </code>{' '}
        per abilitare tutte le funzioni.
      </span>
    ),
    href: null,
    cta: null,
    external: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    title: 'Testalo in chat',
    desc: 'Avvia il bot dalla Dashboard e scrivi !NOMEBOT nella tua chat Twitch per vederlo in azione.',
    href: '/dashboard',
    cta: 'Vai alla Dashboard',
    external: false,
  },
];

export default function SuccessPage({ user }) {
  const [searchParams] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const plan = searchParams.get('plan') ?? '';
  const period = searchParams.get('period') ?? '1m';
  const planLabel = PLAN_LABELS[plan] ?? null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-16"
      style={{ backgroundColor: '#0a0a0a', color: '#f0f0f0' }}
    >
      {/* Glow background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative w-full max-w-2xl transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
      >
        {/* Check icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.4)' }}
          >
            <svg className="w-10 h-10" style={{ color: PURPLE }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Titolo */}
        <h1 className="text-4xl lg:text-5xl font-extrabold text-center mb-3 tracking-tight">
          Benvenuto su StreaMindAI!
        </h1>
        <p className="text-center text-lg mb-2" style={{ color: '#a0a0a0' }}>
          {plan === 'signature'
            ? <>Il tuo piano <strong style={{ color: '#f0f0f0' }}>Signature</strong> è attivo — benvenuto!</>
            : period !== '1m'
              ? <>Il tuo abbonamento è attivo — <strong style={{ color: '#f0f0f0' }}>inizia subito!</strong></>
              : <>Il tuo abbonamento è attivo. Hai <strong style={{ color: '#f0f0f0' }}>7 giorni di prova gratuita</strong> — nessun addebito oggi.</>
          }
        </p>

        {/* Piano attivato */}
        {planLabel && (
          <div
            className="mx-auto mt-6 mb-10 w-fit px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: PURPLE }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }} />
            Piano {planLabel} attivato
          </div>
        )}

        {/* Passi successivi */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ backgroundColor: '#111', border: '1px solid #222' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: '#666' }}>
            Prossimi passi
          </h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl p-4 transition-colors duration-150"
                style={{ backgroundColor: '#191919', border: '1px solid #252525' }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: PURPLE }}
                >
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: PURPLE, color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <p className="font-semibold text-sm" style={{ color: '#f0f0f0' }}>{step.title}</p>
                  </div>
                  <p className="text-sm" style={{ color: '#888' }}>{step.descNode ?? step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA principale */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="flex items-center justify-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl text-base transition-all duration-150"
            style={{ backgroundColor: PURPLE, boxShadow: '0 0 24px rgba(139,92,246,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = PURPLE; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.35)'; }}
          >
            Vai alla Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to="/config"
            className="flex items-center justify-center font-medium px-8 py-3.5 rounded-xl text-base transition-colors duration-150 border"
            style={{ borderColor: '#262626', color: '#a0a0a0', backgroundColor: '#151515' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#383838'; e.currentTarget.style.color = '#f0f0f0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#262626'; e.currentTarget.style.color = '#a0a0a0'; }}
          >
            Configura il bot
          </Link>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: '#444' }}>
          Hai domande? Scrivici su{' '}
          <a href="/contatti" className="underline" style={{ color: '#666' }}>
            contatti
          </a>{' '}
          — risponderemo in poche ore.
        </p>
      </div>
    </div>
  );
}

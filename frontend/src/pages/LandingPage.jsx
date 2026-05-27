import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
    price: '7,99',
    desc: 'Per chi inizia',
    features: [
      'Bot AI base con personalità configurabile',
      'Max 10 membri configurabili',
      'Risposte automatiche: follow e sub',
      '1,5M token AI/mese',
      'Trial 7 giorni con carta',
    ],
    cta: 'Inizia con Starter',
    highlight: false,
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '22',
    desc: 'Per streamer in crescita',
    features: [
      'Bot AI completamente personalizzato',
      'Song request Spotify (!sr)',
      'Memoria base (apprendimento automatico)',
      'Tutti gli eventi automatici',
      '8M token AI/mese',
      'Trial 7 giorni con carta',
    ],
    cta: 'Scegli Creator',
    highlight: false,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '70',
    desc: 'Il più scelto',
    badge: 'Più popolare',
    features: [
      'Tutto di Creator',
      'Analytics canale mensile',
      'Memoria avanzata con contesto di gioco',
      'Messaggi eventi completamente personalizzabili',
      '25M token AI/mese',
      'Trial 7 giorni con carta',
    ],
    cta: 'Vai con Elite',
    highlight: true,
  },
  {
    id: 'signature',
    name: 'Signature',
    price: '165',
    desc: 'Il massimo, senza limiti',
    features: [
      'Tutto di Elite',
      'Onboarding 1:1 con gCernu',
      'Supporto diretto',
      'Setup completamente personalizzato',
      '60M token AI/mese',
      'Nessun trial — contatto diretto prima dell\'attivazione',
    ],
    cta: 'Signature Experience',
    highlight: false,
  },
];


// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Demo Section — chat simulata + 3 step
// ---------------------------------------------------------------------------

const DEMO_MSGS = [
  { type: 'user',  user: 'GinoHernandez', color: '#00c8ff', text: 'quanto sei bravo su questo gioco dai' },
  { type: 'bot',   text: 'Grazie Gino! gcernu si sta davvero superando stasera 🎮' },
  { type: 'user',  user: 'Millina',        color: '#ff69b4', text: '!nexis chi sono io per te?' },
  { type: 'bot',   text: 'Millina! La preferita della chat, lo sai benissimo 😄' },
  { type: 'event', text: '⭐ TheRealSam ha seguito il canale!' },
  { type: 'bot',   text: 'Benvenuto @TheRealSam! Che bello averti qui 🎃' },
  { type: 'user',  user: 'Insane_x',       color: '#ffa500', text: '!nexis di che gioco si tratta?' },
  { type: 'bot',   text: 'Stiamo giocando a Rocket League — gcernu sta dominando 🚀' },
  { type: 'bot',   text: 'Bella partita eh? Chi tifa per il goal? ⚡' },
  { type: 'user',  user: 'GinoHernandez',  color: '#00c8ff', text: '!lurk' },
  { type: 'bot',   text: 'Gino è in modalità lurk — silenzioso ma presente! 👀' },
];

function DemoBotInput() {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const names = ['Nexis', 'Hally'];
    let ni = 0, ci = 0, del = false, tid;
    function tick() {
      const name = names[ni];
      if (!del) {
        ci++;
        setTxt(name.slice(0, ci));
        if (ci === name.length) { del = true; tid = setTimeout(tick, 1400); }
        else tid = setTimeout(tick, 120);
      } else {
        ci--;
        setTxt(name.slice(0, ci));
        if (ci === 0) { del = false; ni = (ni + 1) % names.length; tid = setTimeout(tick, 400); }
        else tid = setTimeout(tick, 70);
      }
    }
    tid = setTimeout(tick, 700);
    return () => clearTimeout(tid);
  }, []);
  return (
    <div className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-lg text-sm font-mono"
      style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
      <span style={{ color: '#555' }}>nome:</span>
      {txt || ' '}
      <span style={{ borderLeft: '2px solid #8B5CF6', height: '13px', display: 'inline-block', animation: 'demoCursor 1s step-end infinite' }} />
    </div>
  );
}

function DemoChatPanel() {
  const [msgs, setMsgs]         = useState([]);
  const [typing, setTyping]     = useState(false);
  const [viewers, setViewers]   = useState(234);
  const chatRef = useRef(null);
  const tidRef  = useRef(null);

  useEffect(() => {
    let v = 234;
    const iv = setInterval(() => {
      if (Math.random() > 0.55) {
        v = Math.min(251, v + 1);
        setViewers(v);
        if (v >= 251) clearInterval(iv);
      }
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let i = 0;
    function next() {
      if (i >= DEMO_MSGS.length) {
        tidRef.current = setTimeout(() => { setMsgs([]); setTyping(false); i = 0; tidRef.current = setTimeout(next, 800); }, 3200);
        return;
      }
      const m = DEMO_MSGS[i];
      if (m.type === 'bot') {
        setTyping(true);
        tidRef.current = setTimeout(() => {
          setTyping(false);
          setMsgs(p => [...p, m]);
          i++;
          tidRef.current = setTimeout(next, 950);
        }, 700);
      } else {
        setMsgs(p => [...p, m]);
        i++;
        tidRef.current = setTimeout(next, m.type === 'event' ? 650 : 1300);
      }
    }
    tidRef.current = setTimeout(next, 900);
    return () => { if (tidRef.current) clearTimeout(tidRef.current); };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  return (
    <div className="rounded-2xl overflow-hidden border w-full"
      style={{
        backgroundColor: '#0a0a0a', borderColor: '#1e1e1e',
        boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 0 60px rgba(139,92,246,0.2), 0 24px 64px rgba(0,0,0,0.7)',
        minHeight: '520px', display: 'flex', flexDirection: 'column',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: '#1a1a1a', background: 'linear-gradient(180deg,#111 0%,#0d0d0d 100%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.22)', boxShadow: '0 0 12px rgba(139,92,246,0.3)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#8B5CF6">
              <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v6.262h-2.149v-6.262h2.149zm-5.731 0v6.262h-2.149v-6.262h2.149z"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold block leading-tight" style={{ color: '#fff' }}>gcernu</span>
            <span className="text-xs" style={{ color: '#555' }}>Rocket League</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ml-1"
            style={{ backgroundColor: '#c0392b', color: '#fff' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="#555" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="text-xs font-semibold tabular-nums" style={{ color: '#888' }}>{viewers}</span>
        </div>
      </div>

      {/* Messaggi */}
      <div ref={chatRef} className="p-4 space-y-3 overflow-y-auto flex-1 demo-scroll" style={{ minHeight: '400px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ animation: 'demoFade 0.25s ease-out' }}>
            {m.type === 'event' ? (
              <div className="text-xs py-1.5 px-3 rounded-full text-center"
                style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.18)' }}>
                {m.text}
              </div>
            ) : m.type === 'bot' ? (
              <div className="flex items-start gap-1.5 flex-wrap">
                <span className="text-sm font-bold shrink-0" style={{ color: '#8B5CF6' }}>NexisAI</span>
                <span className="text-sm shrink-0" style={{ color: '#555' }}>🤖:</span>
                <span className="text-sm leading-snug" style={{ color: '#ddd' }}>{m.text}</span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 flex-wrap">
                <span className="text-sm font-bold shrink-0" style={{ color: m.color }}>{m.user}</span>
                <span className="text-sm leading-snug" style={{ color: '#999' }}>: {m.text}</span>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: '#8B5CF6' }}>NexisAI</span>
            <span className="text-sm" style={{ color: '#555' }}>🤖</span>
            <div className="flex items-center gap-1 ml-1">
              {[0,1,2].map(k => (
                <div key={k} className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#8B5CF6', animation: `demoBounce 1.1s ${k*0.18}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t px-4 py-3" style={{ borderColor: '#1a1a1a' }}>
        <div className="rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: '#161616', color: '#3a3a3a' }}>
          Invia un messaggio…
        </div>
      </div>
    </div>
  );
}

function DemoSection({ user }) {
  return (
    <section className="py-24 px-4" style={{
      background: 'linear-gradient(180deg, #0d0d0d 0%, #060410 50%, #0d0d0d 100%)',
    }}>
      <style>{`
        @keyframes demoSlide  { from{opacity:0;transform:translateX(-20px);}to{opacity:1;transform:translateX(0);} }
        @keyframes demoFade   { from{opacity:0;transform:translateY(6px); }to{opacity:1;transform:translateY(0);} }
        @keyframes demoCursor { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @keyframes demoBounce { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-5px);} }
        .demo-scroll::-webkit-scrollbar       { width:4px; }
        .demo-scroll::-webkit-scrollbar-track  { background:transparent; }
        .demo-scroll::-webkit-scrollbar-thumb  { background:rgba(139,92,246,0.35);border-radius:2px; }
      `}</style>

      <div className="max-w-screen-2xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#8B5CF6' }}>Demo</p>
          <h2 className="text-4xl font-extrabold mb-4">Vedi il bot in azione</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: '#a0a0a0' }}>Tre passi e il tuo bot AI è live in chat</p>
        </div>

        {/* Layout asimmetrico 38 / 62 */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

          {/* ── Sinistra: step verticali ─────────────────────────────── */}
          <div className="lg:w-[38%] flex flex-col">

            {/* Step 1 */}
            <div className="flex gap-4" style={{ animation: 'demoSlide 0.55s 0.1s both' }}>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.5)',
                    color: '#8B5CF6', boxShadow: '0 0 18px rgba(139,92,246,0.28)' }}>01</div>
                <div className="w-px mt-2 mb-0 flex-1"
                  style={{ minHeight:'56px', background:'repeating-linear-gradient(to bottom,rgba(139,92,246,0.45) 0px,rgba(139,92,246,0.45) 5px,transparent 5px,transparent 12px)' }} />
              </div>
              <div className="pb-8 flex-1">
                <div className="rounded-2xl p-5 border" style={{ backgroundColor:'#131313', borderColor:'#232323' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor:'rgba(139,92,246,0.12)' }}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#8B5CF6">
                      <path d="M2.149 0l-1.612 4.119v16.836h5.731v3.045h3.224l3.045-3.045h4.657l6.269-6.269v-14.686h-21.314zm19.164 13.612l-3.582 3.582h-5.731l-3.045 3.045v-3.045h-4.836v-15.045h17.194v11.463zm-3.582-7.343v6.262h-2.149v-6.262h2.149zm-5.731 0v6.262h-2.149v-6.262h2.149z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-bold mb-1">Connetti Twitch</h3>
                  <p className="text-sm" style={{ color:'#888' }}>Login con un click — zero configurazione tecnica</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4" style={{ animation: 'demoSlide 0.55s 0.22s both' }}>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ backgroundColor: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.5)',
                    color: '#8B5CF6', boxShadow: '0 0 18px rgba(139,92,246,0.28)' }}>02</div>
                <div className="w-px mt-2 flex-1"
                  style={{ minHeight:'56px', background:'repeating-linear-gradient(to bottom,rgba(139,92,246,0.45) 0px,rgba(139,92,246,0.45) 5px,transparent 5px,transparent 12px)' }} />
              </div>
              <div className="pb-8 flex-1">
                <div className="rounded-2xl p-5 border" style={{ backgroundColor:'#131313', borderColor:'#232323' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor:'rgba(139,92,246,0.12)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.091Z"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-bold mb-1">Personalizza il bot</h3>
                  <p className="text-sm mb-1" style={{ color:'#888' }}>Scegli nome, personalità e lingua</p>
                  <DemoBotInput />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4" style={{ animation: 'demoSlide 0.55s 0.34s both' }}>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)',
                    color: '#4ade80', boxShadow: '0 0 18px rgba(74,222,128,0.2)' }}>03</div>
              </div>
              <div className="pb-4 flex-1">
                <div className="rounded-2xl p-5 border" style={{ backgroundColor:'#131313', borderColor:'#232323' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor:'rgba(74,222,128,0.1)' }}>
                    <span className="w-3.5 h-3.5 rounded-full animate-pulse"
                      style={{ backgroundColor:'#4ade80', boxShadow:'0 0 12px rgba(74,222,128,0.6)' }} />
                  </div>
                  <h3 className="text-base font-bold mb-1">Il bot è attivo</h3>
                  <p className="text-sm" style={{ color:'#888' }}>Inizia a rispondere in chat in tempo reale</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-extrabold mb-2"
                style={{ background:'linear-gradient(90deg,#fff 0%,#a78bfa 55%,#8B5CF6 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Il tuo bot può fare tutto questo — gratis
              </h3>
              <p className="text-sm mb-4" style={{ color:'#888' }}>Piano Free attivo subito. Nessuna carta di credito richiesta.</p>
              <Link to={user ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 font-bold text-white px-7 py-3 rounded-xl text-sm transition-all duration-150"
                style={{ backgroundColor:'#8B5CF6', boxShadow:'0 0 22px rgba(139,92,246,0.38)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor='#7C3AED'; e.currentTarget.style.boxShadow='0 0 32px rgba(139,92,246,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor='#8B5CF6'; e.currentTarget.style.boxShadow='0 0 22px rgba(139,92,246,0.38)'; }}>
                Inizia gratis con Twitch →
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <span className="text-xs" style={{ color:'#555' }}>🔒 Sicuro</span>
                <span className="text-xs" style={{ color:'#333' }}>·</span>
                <span className="text-xs" style={{ color:'#555' }}>✓ Nessuna carta</span>
                <span className="text-xs" style={{ color:'#333' }}>·</span>
                <span className="text-xs" style={{ color:'#555' }}>⚡ Attivo in 30 secondi</span>
              </div>
            </div>
          </div>

          {/* ── Destra: chat grande ──────────────────────────────────── */}
          <div className="lg:w-[62%] w-full">
            <DemoChatPanel />
          </div>
        </div>
      </div>
    </section>
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
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
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
    { '@type': 'Offer', name: 'Free',      price: '0.00',   priceCurrency: 'EUR', description: 'Bot AI di base, eventi automatici, nessuna carta richiesta' },
    { '@type': 'Offer', name: 'Starter',   price: '7.99',   priceCurrency: 'EUR', description: 'Bot AI base, 1,5M token AI/mese, trial 7 giorni' },
    { '@type': 'Offer', name: 'Creator',   price: '22.00',  priceCurrency: 'EUR', description: 'Song request Spotify, 8M token AI/mese, trial 7 giorni' },
    { '@type': 'Offer', name: 'Elite',     price: '70.00',  priceCurrency: 'EUR', description: 'Analytics, memoria avanzata, 25M token AI/mese, trial 7 giorni' },
    { '@type': 'Offer', name: 'Signature', price: '165.00', priceCurrency: 'EUR', description: 'Onboarding 1:1, setup personalizzato, 60M token AI/mese' },
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
    <div
      className="min-h-screen font-sans"
      style={{
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(88,28,235,0.12) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 60%, rgba(139,92,246,0.08) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 95%, rgba(67,56,202,0.09) 0%, transparent 40%),
          #0d0d0d
        `,
        color: '#f0f0f0',
      }}
    >

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

      {/* Keyframe globali landing */}
      <style>{`
        @keyframes smaTwinkle { from{opacity:0.1;transform:scale(0.8);} to{opacity:0.9;transform:scale(1.2);} }
        @keyframes smaFloat   { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
      `}</style>

      <Header user={user} loading={loading} onLogout={onLogout} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Sfondo glow potenziato */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 85% 65% at 50% -5%, rgba(139,92,246,0.22) 0%, transparent 70%)' }}
        />
        {/* Glow laterale sinistra */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 40% at -5% 60%, rgba(88,28,235,0.1) 0%, transparent 60%)' }}
        />
        {/* Griglia decorativa */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Stelle/particelle decorative */}
        {[
          {x:6,y:14,s:2.5,d:0},{x:14,y:48,s:2,d:0.4},{x:89,y:17,s:2.5,d:0.8},
          {x:76,y:54,s:2,d:1.2},{x:93,y:75,s:3,d:0.2},{x:4,y:72,s:2,d:1.6},
          {x:27,y:88,s:2.5,d:0.6},{x:63,y:7,s:2,d:1.0},{x:82,y:36,s:3,d:0.3},
          {x:38,y:22,s:1.5,d:1.4},{x:52,y:68,s:2,d:0.7},{x:18,y:33,s:1.5,d:1.1},
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left:`${star.x}%`, top:`${star.y}%`,
              width:`${star.s}px`, height:`${star.s}px`,
              backgroundColor: '#c4b5fd',
              boxShadow:`0 0 ${star.s*2}px rgba(139,92,246,0.7)`,
              animation:`smaTwinkle ${2+i*0.35}s ease-in-out ${star.d}s infinite alternate`,
            }}
          />
        ))}

        <div className="relative max-w-screen-2xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Testo */}
            <div className="flex-1 text-center">
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
                className="flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-full mb-8 mx-auto w-fit"
                style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }}></span>
                In produzione su Twitch
              </div>

              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Il bot AI per Twitch <span style={{ color: PURPLE }}>che impara da te</span>
              </h1>

              <p className="text-lg lg:text-xl mb-10 max-w-3xl mx-auto" style={{ color: '#a0a0a0' }}>
                StreaMindAI è il chatbot AI personalizzato per la tua chat Twitch: risponde agli spettatori, ringrazia i follower, gestisce le song request e cresce con la tua community — tutto in automatico, tutto configurabile.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
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
          </div>
        </div>
      </section>

      {/* ── DEMO ──────────────────────────────────────────────────────── */}
      <DemoSection user={user} />

      {/* ── FUNZIONALITÀ ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-screen-2xl mx-auto">
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
                style={{ backgroundColor: '#151515', borderColor: 'rgba(139,92,246,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.backgroundColor = '#1a1a1a'; e.currentTarget.style.boxShadow = '0 0 24px rgba(139,92,246,0.12), 0 4px 20px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)'; e.currentTarget.style.backgroundColor = '#151515'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)'; }}
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
      <section id="how" className="py-24 px-4" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-screen-2xl mx-auto">
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
      <section id="pricing" className="py-24 px-4" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-screen-2xl mx-auto">
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
                  borderColor: plan.highlight ? PURPLE : 'rgba(139,92,246,0.12)',
                  boxShadow: plan.highlight
                    ? '0 0 0 1px rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.18), 0 8px 32px rgba(0,0,0,0.4)'
                    : '0 2px 12px rgba(0,0,0,0.3)',
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
      <section className="py-24 px-4">
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
      <footer className="border-t px-4 py-12" style={{ borderColor: '#1e1e1e', backgroundColor: '#0a0a0a' }}>
        <div className="max-w-screen-2xl mx-auto">
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

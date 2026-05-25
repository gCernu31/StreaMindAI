import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../utils/auth.js';
import { useBotStatus } from '../contexts/BotStatusCtx.jsx';

// ── Renderer markdown minimo per analisi mensile ──────────────────────────────
function AnalysisBody({ text }) {
  if (!text) return null;
  return (
    <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#a0a0a0' }}>
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '14px', margin: '18px 0 6px' }}>{line.slice(4)}</h4>;
        if (line.startsWith('## '))
          return <h3 key={i} style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '14px', margin: '18px 0 6px' }}>{line.slice(3)}</h3>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <div key={i} style={{ display: 'flex', gap: '8px', margin: '5px 0' }}>
              <span style={{ color: '#8B5CF6', flexShrink: 0 }}>•</span>
              <span>{line.slice(2).replace(/\*\*(.+?)\*\*/g, (_, t) => t)}</span>
            </div>
          );
        if (!line.trim()) return <div key={i} style={{ height: '6px' }} />;
        return <p key={i} style={{ margin: '3px 0' }}>{line.replace(/\*\*(.+?)\*\*/g, (_, t) => t)}</p>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Limiti messaggi mensili per piano
// ---------------------------------------------------------------------------

const MONTHLY_LIMITS = {
  starter:   4_000,
  creator:   12_000,
  elite:     24_000,
  signature: 60_000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

function buildChartData(apiRows, days = 7) {
  // Normalizza le chiavi: il bot scrive date UTC (toISOString), dobbiamo usare UTC anche qui
  const map = {};
  apiRows.forEach(r => { map[String(r.date).slice(0, 10)] = r.count; });

  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const iso     = d.toISOString().slice(0, 10);
    const isToday = i === days - 1;
    // Per 7 giorni: etichetta giorno abbreviato; per 30: D/M ogni 5 o oggi
    const dayLabel = days <= 7
      ? DAY_LABELS[d.getUTCDay()]
      : (i % 5 === 0 || isToday ? `${d.getUTCDate()}/${d.getUTCMonth() + 1}` : '');
    return { day: dayLabel, count: map[iso] ?? 0, today: isToday };
  });
}

function catStyle(cat) {
  const m = {
    inside_joke: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    utente:      { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    promessa:    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
    evento:      { bg: 'rgba(234,179,8,0.12)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)' },
    nome_gioco:  { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  };
  return m[cat] ?? { bg: 'rgba(113,113,122,0.12)', color: '#a1a1aa', border: 'rgba(113,113,122,0.3)' };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function formatExpiry(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Banner upgrade per utenti free/inattivi
// ---------------------------------------------------------------------------

function FreePlanBanner() {
  return (
    <div className="space-y-3">
      {/* Banner informativo free */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border px-5 py-4"
        style={{ background: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-hally-text">Sei sul piano Free</p>
            <p className="text-xs text-hally-text-muted mt-0.5">
              Il bot è attivo in chat (showstarter + !lurk), ma le risposte AI richiedono un piano a pagamento.
            </p>
          </div>
        </div>
        <Link
          to="/subscription"
          className="self-start sm:self-auto inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl whitespace-nowrap transition-colors"
          style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.2)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.12)'}
        >
          Sblocca l'AI →
        </Link>
      </div>

      {/* CTA trial prominente */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border px-5 py-4"
        style={{
          background:  'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.04) 100%)',
          borderColor: 'rgba(139,92,246,0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <p className="text-sm font-bold text-hally-text">Prova StreaMindAI gratis per 7 giorni</p>
            <p className="text-xs text-hally-text-muted mt-0.5">Nessun addebito oggi. Disdici in qualsiasi momento.</p>
          </div>
        </div>
        <Link
          to="/subscription"
          className="self-start sm:self-auto inline-flex items-center gap-2 font-bold text-white text-sm px-5 py-3 rounded-xl flex-shrink-0 min-h-[44px] transition-all duration-150"
          style={{ backgroundColor: '#8B5CF6' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
        >
          Inizia la prova gratuita →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottone Attiva/Disattiva Bot
// ---------------------------------------------------------------------------

function BotToggle() {
  const { botActive, setBotActive } = useBotStatus();
  const [loading, setLoading]       = useState(false);

  // Legge lo stato dal context (inizializzato da Layout al mount)
  const active = botActive;

  const toggle = async () => {
    if (loading || active === null) return;
    const newState = !active;
    setLoading(true);
    try {
      const token = getToken();
      const r = await fetch('/api/config/bot-active', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState }),
      });
      if (r.ok) {
        setBotActive(newState);
      }
    } catch {}
    setLoading(false);
  };

  if (active === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-full flex items-center justify-between gap-4 rounded-2xl px-6 py-5 transition-all duration-200"
      style={{
        backgroundColor: active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.75 : 1,
      }}
      onMouseEnter={e => {
        if (!loading) e.currentTarget.style.backgroundColor = active ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)';
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)', borderTopColor: active ? '#4ade80' : '#f87171' }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              className="w-5 h-5" style={{ color: active ? '#4ade80' : '#f87171' }}>
              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          )}
        </div>
        <div className="text-left">
          <p className="font-bold text-hally-text text-sm">
            {active ? 'Bot Attivo' : 'Bot Inattivo'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: active ? '#4ade80' : '#f87171' }}>
            {active ? 'Clicca per disattivare' : 'Clicca per attivare'}
          </p>
        </div>
      </div>
      <div
        className="flex-shrink-0 w-12 h-6 rounded-full relative transition-colors duration-200"
        style={{ backgroundColor: active ? '#22c55e' : '#ef4444' }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: active ? '26px' : '4px' }}
        />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card: Bot Status
// ---------------------------------------------------------------------------

function BotStatusCard({ botName, channel }) {
  const { botActive } = useBotStatus();
  const online = botActive === true;
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Stato bot</p>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={online
            ? { backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
            : { backgroundColor: 'rgba(239,68,68,0.12)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
          }
        >
          <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div>
        <p className="text-base sm:text-xl font-bold text-hally-text break-words">{botName}</p>
        <p className="text-xs text-hally-text-muted mt-0.5">#{channel}</p>
      </div>
      {!online && (
        <p className="text-xs text-hally-text-muted border-t border-hally-border pt-2.5">
          Attiva StreaMindAI per iniziare
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Utilizzi oggi
// ---------------------------------------------------------------------------

function UsageCard({ value, delta }) {
  const up = delta >= 0;
  return (
    <div className="card flex flex-col gap-3">
      <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Utilizzi oggi</p>
      <div>
        <p className="text-3xl sm:text-4xl font-extrabold text-hally-text">{value}</p>
        <p className="text-xs text-hally-text-muted mt-1">comandi ricevuti</p>
      </div>
      <div
        className="flex items-center gap-1.5 text-xs font-medium border-t border-hally-border pt-2.5"
        style={{ color: up ? '#4ade80' : '#f87171' }}
      >
        <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
          {up
            ? <path d="M6 2L10 7H2L6 2Z"/>
            : <path d="M6 10L2 5H10L6 10Z"/>
          }
        </svg>
        {up ? '+' : ''}{delta} rispetto a ieri
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Memorie
// ---------------------------------------------------------------------------

function MemoriesCard({ total, thisWeek }) {
  return (
    <div className="card flex flex-col gap-3">
      <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Memorie salvate</p>
      <div>
        <p className="text-3xl sm:text-4xl font-extrabold text-hally-text">{total}</p>
        <p className="text-xs text-hally-text-muted mt-1">memoria totale</p>
      </div>
      <div
        className="flex items-center gap-1.5 text-xs font-medium border-t border-hally-border pt-2.5"
        style={{ color: '#8B5CF6' }}
      >
        <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
          <path d="M6 2L10 7H2L6 2Z"/>
        </svg>
        +{thisWeek} questa settimana
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Abbonamento + Messaggi mensili
// ---------------------------------------------------------------------------

function SubscriptionCard({ status, plan, daysRemaining, totalDays, expiresAt, monthly }) {
  const pctRemaining = totalDays > 0 ? (daysRemaining / totalDays) * 100 : 0;
  const isLow = daysRemaining < 7;
  const barColor = isLow ? '#f87171' : '#8B5CF6';
  const active = status === 'active' || status === 'cancelling' || status === 'trialing';

  const monthlyLimit = MONTHLY_LIMITS[monthly?.plan ?? plan?.toLowerCase() ?? 'starter'] ?? 2_000;
  const monthlyCount = monthly?.count ?? 0;
  const monthlyPct   = Math.min((monthlyCount / monthlyLimit) * 100, 100);
  const monthlyColor = monthlyPct > 85 ? '#f87171' : monthlyPct > 60 ? '#fbbf24' : '#8B5CF6';

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-hally-text-muted text-xs font-medium uppercase tracking-wider">Abbonamento</p>
        {active && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            {plan}
          </span>
        )}
      </div>

      {active ? (
        <>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-hally-text">
              {daysRemaining}
              <span className="text-base sm:text-lg font-medium text-hally-text-muted ml-1">gg</span>
            </p>
            {expiresAt && <p className="text-xs text-hally-text-muted mt-0.5">Scade il {expiresAt}</p>}
          </div>
          <div className="border-t border-hally-border pt-2.5 space-y-1.5">
            <div className="h-1.5 rounded-full bg-hally-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctRemaining}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="text-xs text-hally-text-muted">{pctRemaining.toFixed(0)}% rimanente</p>
          </div>
          <div className="border-t border-hally-border pt-2.5 space-y-1.5">
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="text-hally-text-muted">Messaggi/mese</span>
              <span className="font-medium text-hally-text">
                {monthlyCount.toLocaleString('it-IT')} / {monthlyLimit.toLocaleString('it-IT')}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-hally-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${monthlyPct}%`, backgroundColor: monthlyColor }}
              />
            </div>
          </div>
        </>
      ) : (
        <div>
          <p className="text-sm font-medium text-hally-text-muted">Nessun piano attivo</p>
          <a href="/subscription" className="text-xs font-semibold mt-2 inline-block" style={{ color: '#8B5CF6' }}>
            Attiva StreaMindAI →
          </a>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grafico utilizzi (SVG area chart)
// ---------------------------------------------------------------------------

function UsageChart({ data, days = 7, onDaysChange }) {
  const W = 500, H = 150;
  const pL = 36, pR = 12, pT = 14, pB = 28;
  const cW = W - pL - pR;
  const cH = H - pT - pB;
  const max = Math.max(...data.map(d => d.count), 1);

  const pts = data.map((d, i) => ({
    x: pL + (i / (data.length - 1)) * cW,
    y: pT + (1 - d.count / max) * cH,
    ...d,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev.x + p.x) / 2).toFixed(1);
    return `${acc} C${cx},${prev.y.toFixed(1)} ${cx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const last = pts.at(-1);
  const first = pts[0];
  const areaPath = `${linePath} L${last.x.toFixed(1)},${(pT + cH).toFixed(1)} L${first.x.toFixed(1)},${(pT + cH).toFixed(1)} Z`;

  const yTicks = (() => {
    const seen = new Set();
    return [0, 0.5, 1].map(t => ({ y: pT + (1 - t) * cH, label: Math.round(max * t) }))
      .filter(({ label }) => { if (seen.has(label)) return false; seen.add(label); return true; });
  })();

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-hally-text">Utilizzi ultimi {days} giorni</h2>
          <p className="text-xs text-hally-text-muted mt-0.5">{total} comandi totali</p>
        </div>
        <div className="flex gap-1">
          {[7, 30].map(d => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={days === d
                ? { backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.35)' }
                : { backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2a2a2a' }}
            >
              {d}gg
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B5CF6" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {yTicks.map(({ y, label }) => (
          <g key={label}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#1e1e1e" strokeWidth="1"/>
            <text x={pL - 6} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#4a4a4a" fontFamily="Inter, sans-serif">{label}</text>
          </g>
        ))}

        <path d={areaPath} fill="url(#areaGrad)"/>
        <path d={linePath} stroke="#8B5CF6" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {pts.map((p, i) => (
          <g key={i}>
            {p.today && (
              <circle cx={p.x} cy={p.y} r="9" fill="rgba(139,92,246,0.15)"/>
            )}
            <circle
              cx={p.x} cy={p.y}
              r={p.today ? 5 : 4}
              fill={p.today ? '#8B5CF6' : '#151515'}
              stroke="#8B5CF6"
              strokeWidth="2.5"
            />
            {p.today && (
              <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="10" fill="#8B5CF6" fontWeight="600" fontFamily="Inter, sans-serif">
                {p.count}
              </text>
            )}
          </g>
        ))}

        {pts.map((p, i) => (
          <text
            key={i}
            x={p.x} y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill={p.today ? '#8B5CF6' : '#5a5a5a'}
            fontWeight={p.today ? '600' : '400'}
            fontFamily="Inter, sans-serif"
          >
            {data[i].day}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed ultime memorie
// ---------------------------------------------------------------------------

function MemoryFeed({ memories }) {
  if (memories.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-hally-text">Ultime memorie salvate</h2>
          <a href="/memory" className="text-xs font-medium" style={{ color: '#8B5CF6' }}>Vedi tutte →</a>
        </div>
        <p className="text-xs text-hally-text-muted text-center py-8">
          Nessuna memoria salvata ancora.<br />StreaMindAI inizierà a ricordare non appena sarà attiva.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-hally-text">Ultime memorie salvate</h2>
        <a href="/memory" className="text-xs font-medium transition-colors" style={{ color: '#8B5CF6' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7C3AED'}
          onMouseLeave={e => e.currentTarget.style.color = '#8B5CF6'}
        >
          Vedi tutte →
        </a>
      </div>

      <div className="space-y-2.5">
        {memories.map((m) => {
          const s = catStyle(m.category);
          return (
            <div
              key={m.id}
              className="flex items-start gap-3 p-3 rounded-lg border transition-colors duration-150"
              style={{ backgroundColor: '#111', borderColor: '#222' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#222'}
            >
              <div
                className="mt-1 w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: s.bg, color: s.color, borderColor: s.border }}
                  >
                    {m.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-hally-text truncate">{m.subject}</span>
                </div>
                <p className="text-xs text-hally-text-muted truncate">{m.content}</p>
              </div>
              <span className="text-[10px] text-hally-text-muted shrink-0 mt-0.5">{formatDate(m.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Referral
// ---------------------------------------------------------------------------

function ReferralCard({ code, link, activeReferrals, creditsEarned }) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(() => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [link]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-hally-text">Invita un amico</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
          Referral
        </span>
      </div>

      {code ? (
        <>
          {/* Link copiabile */}
          <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
            style={{ background: '#111', border: '1px solid #222' }}>
            <span className="flex-1 text-xs truncate font-mono" style={{ color: '#8B5CF6' }}>
              {link}
            </span>
            <button
              onClick={copyLink}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
              style={copied
                ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)' }
              }
            >
              {copied ? '✓ Copiato' : 'Copia'}
            </button>
          </div>

          {/* Statistiche */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <p className="text-2xl font-extrabold text-hally-text">{activeReferrals}</p>
              <p className="text-xs text-hally-text-muted mt-0.5">Referral attivi</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#8B5CF6' }}>{creditsEarned}</p>
              <p className="text-xs text-hally-text-muted mt-0.5">Sconti ottenuti</p>
            </div>
          </div>

          <p className="text-xs text-hally-text-muted leading-relaxed" style={{ borderTop: '1px solid #1e1e1e', paddingTop: '12px' }}>
            Chi si abbona tramite il tuo link: riceve <strong className="text-hally-text">14 giorni</strong> di trial.
            Tu guadagni <strong className="text-hally-text">15% di sconto</strong> sul prossimo rinnovo per ogni abbonato attivo.
          </p>
        </>
      ) : (
        <p className="text-xs text-hally-text-muted text-center py-6">
          Codice referral non ancora assegnato.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card: Analisi mensile canale (solo abbonati)
// ---------------------------------------------------------------------------

function ChannelAnalysisCard({ isSubscriber }) {
  const [analysis, setAnalysis]         = useState(null);
  const [generatedAt, setGeneratedAt]   = useState(null);
  const [loadingData, setLoadingData]   = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [genError, setGenError]         = useState(null);
  const [expanded, setExpanded]         = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token || !isSubscriber) { setLoadingData(false); return; }
    fetch('/api/dashboard/analysis', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.analysis) { setAnalysis(data.analysis); setGeneratedAt(data.generated_at); }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [isSubscriber]);

  const generate = async () => {
    const token = getToken();
    if (!token || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const r = await fetch('/api/dashboard/analysis/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) { setGenError(data.error ?? 'Errore nella generazione.'); return; }
      setAnalysis(data.analysis);
      setGeneratedAt(data.generated_at);
      setExpanded(true);
    } catch {
      setGenError('Errore di rete. Riprova.');
    } finally {
      setGenerating(false);
    }
  };

  const formatTs = (iso) => iso
    ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-hally-text">Analisi mensile canale</h2>
          {generatedAt && (
            <p className="text-xs text-hally-text-muted mt-0.5">Generata il {formatTs(generatedAt)}</p>
          )}
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          AI
        </span>
      </div>

      {/* Non abbonato */}
      {!isSubscriber && (
        <div className="text-center py-6">
          <p className="text-xs text-hally-text-muted mb-3">
            L'analisi mensile è riservata agli abbonati StreaMindAI.
          </p>
          <Link
            to="/subscription"
            className="text-xs font-semibold"
            style={{ color: '#8B5CF6' }}
          >
            Attiva StreaMindAI →
          </Link>
        </div>
      )}

      {/* Loading iniziale */}
      {isSubscriber && loadingData && (
        <div className="flex items-center gap-2 py-4">
          <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: '#8B5CF6' }} />
          <span className="text-xs text-hally-text-muted">Caricamento…</span>
        </div>
      )}

      {/* Nessuna analisi ancora */}
      {isSubscriber && !loadingData && !analysis && (
        <div className="text-center py-4">
          <p className="text-xs text-hally-text-muted mb-4">
            Nessuna analisi ancora. Generane una per ricevere consigli strategici personalizzati sul tuo canale.
          </p>
          {genError && (
            <p className="text-xs mb-3 px-3 py-2 rounded-lg"
              style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {genError}
            </p>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-150"
            style={{
              background: generating ? 'rgba(139,92,246,0.08)' : '#8B5CF6',
              color: generating ? '#8B5CF6' : '#fff',
              border: '1px solid rgba(139,92,246,0.4)',
              cursor: generating ? 'default' : 'pointer',
            }}
          >
            {generating ? (
              <>
                <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(139,92,246,0.3)', borderTopColor: '#8B5CF6' }} />
                Generazione in corso…
              </>
            ) : '✨ Genera analisi mensile'}
          </button>
        </div>
      )}

      {/* Analisi presente */}
      {isSubscriber && !loadingData && analysis && (
        <>
          <div
            style={{
              maxHeight: expanded ? 'none' : '180px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <AnalysisBody text={analysis} />
            {!expanded && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                background: 'linear-gradient(transparent, var(--hally-card, #131313))',
              }} />
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-hally-border">
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs font-medium transition-colors"
              style={{ color: '#8B5CF6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {expanded ? '↑ Comprimi' : '↓ Leggi tutta'}
            </button>

            <button
              onClick={generate}
              disabled={generating}
              className="text-xs font-medium transition-colors"
              style={{ color: '#4a4a4a', background: 'none', border: 'none', cursor: generating ? 'default' : 'pointer', padding: 0 }}
              onMouseEnter={e => { if (!generating) e.currentTarget.style.color = '#a0a0a0'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4a4a4a'; }}
            >
              {generating ? 'Rigenerazione…' : '↺ Rigenera (1/giorno)'}
            </button>
          </div>

          {genError && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg"
              style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {genError}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage({ user }) {
  const [stats, setStats]       = useState(null);
  const [botName, setBotName]   = useState(null);
  const [memories, setMemories] = useState([]);
  const [monthly, setMonthly]   = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [referral, setReferral]   = useState(null);
  const [extraTokens, setExtraTokens] = useState(null); // { count, expiry } | null
  const [chartDays, setChartDays]     = useState(7);
  const [chartUsage, setChartUsage]   = useState([]);
  const chartDaysSkipRef              = useRef(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    fetch('/api/dashboard/stats', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { setStats(data); setChartUsage(data.usage_last_7_days ?? []); } })
      .catch(() => {});

    fetch('/api/config', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.bot_name) setBotName(data.bot_name); })
      .catch(() => {});

    fetch('/api/memories?limit=5', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.memories) setMemories(data.memories); })
      .catch(() => {});

    fetch('/api/me', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMonthly({
            count: data.monthly_messages?.count ?? 0,
            plan:  data.subscription?.plan ?? null,
          });
          setSubStatus(data.subscription?.status ?? 'inactive');
          const et = data.extra_tokens;
          if (et && et.count > 0 && et.expiry) setExtraTokens(et);
        }
      })
      .catch(() => {});

    fetch('/api/referral', { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setReferral(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (chartDaysSkipRef.current) { chartDaysSkipRef.current = false; return; }
    const token = getToken();
    if (!token) return;
    fetch(`/api/dashboard/stats?days=${chartDays}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setChartUsage(data.usage_last_7_days ?? []); })
      .catch(() => {});
  }, [chartDays]);

  const sub = stats?.subscription ?? {};
  const chartData = buildChartData(chartUsage, chartDays);

  return (
    <div className="space-y-5">
      {/* Benvenuto */}
      <div>
        <h1 className="text-xl font-bold text-hally-text">
          Ciao, {user?.display_name ?? 'streamer'} 👋
        </h1>
        <p className="text-sm text-hally-text-muted mt-0.5">
          Ecco cosa sta succedendo sul tuo canale oggi.
        </p>
      </div>

      {/* ── CTA Configura — prominente, prima dei dati ─────────────── */}
      <a
        href="/config"
        className="block w-full rounded-2xl px-6 py-5 transition-all duration-150"
        style={{
          backgroundColor: '#8B5CF6',
          boxShadow: '0 0 32px rgba(139,92,246,0.35)',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 40px rgba(139,92,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#8B5CF6'; e.currentTarget.style.boxShadow = '0 0 32px rgba(139,92,246,0.35)'; }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6 shrink-0">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572C4.561 14.924 4.561 12.426 6.317 12a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.572-1.065Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <div className="min-w-0">
              <p className="text-lg font-extrabold text-white leading-tight">Configura il tuo bot</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Personalità, comandi, orari e integrazioni
              </p>
            </div>
          </div>
          <span className="shrink-0 flex items-center gap-1.5 font-bold text-white text-sm bg-white/20 px-4 py-2.5 rounded-xl whitespace-nowrap">
            Vai alle impostazioni
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </a>

      {/* ── Banner upgrade piano free ─────────────────────────────── */}
      {subStatus === 'inactive' && <FreePlanBanner />}

      {/* ── Toggle attiva/disattiva bot ────────────────────────────── */}
      <BotToggle />

      {/* ── Token extra ────────────────────────────────────────────── */}
      {extraTokens && (
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.2)' }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: '#8B5CF6' }}
          />
          <p className="text-sm text-hally-text">
            <span className="font-semibold">{extraTokens.count.toLocaleString('it-IT')} token extra</span>
            {' '}rimanenti
            <span className="text-hally-text-muted ml-1">
              (scadono il {new Date(extraTokens.expiry).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })})
            </span>
          </p>
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <BotStatusCard
          botName={botName ?? 'Il tuo bot'}
          channel={user?.twitch_username ?? '—'}
        />
        <UsageCard
          value={stats?.messages_today ?? 0}
          delta={stats?.messages_today_delta ?? 0}
        />
        <MemoriesCard
          total={stats?.memories_count ?? 0}
          thisWeek={stats?.memories_this_week ?? 0}
        />
        <SubscriptionCard
          status={sub.status ?? 'inactive'}
          plan={sub.plan ?? null}
          daysRemaining={sub.days_remaining ?? 0}
          totalDays={sub.total_days ?? 30}
          expiresAt={formatExpiry(sub.end)}
          monthly={monthly}
        />
      </div>

      {/* ── Grafico + Feed memorie ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="card overflow-x-auto">
          <UsageChart data={chartData} days={chartDays} onDaysChange={setChartDays} />
        </div>
        <div className="card overflow-x-auto">
          <MemoryFeed memories={memories} />
        </div>
      </div>

      {/* ── Referral ───────────────────────────────────────────────── */}
      {referral && (
        <ReferralCard
          code={referral.code}
          link={referral.link}
          activeReferrals={referral.active_referrals}
          creditsEarned={referral.credits_earned}
        />
      )}

      {/* ── Analisi mensile canale ─────────────────────────────────── */}
      <ChannelAnalysisCard isSubscriber={subStatus === 'active' || subStatus === 'cancelling' || subStatus === 'trialing'} />
    </div>
  );
}

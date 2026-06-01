import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AccountMenu from '../components/AccountMenu.jsx';

const PURPLE = '#8B5CF6';

// ── Logo ──────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META = {
  operational: { label: 'Operativo',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   dot: '#22c55e' },
  degraded:    { label: 'Degradato',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  dot: '#f59e0b' },
  outage:      { label: 'Interruzione', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
};

function statusOf(s) {
  return STATUS_META[s] ?? STATUS_META.operational;
}

function overallStatus(services) {
  if (!services?.length) return 'operational';
  if (services.some(s => s.status === 'outage'))    return 'outage';
  if (services.some(s => s.status === 'degraded'))  return 'degraded';
  return 'operational';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

// ── Componenti UI ─────────────────────────────────────────────────────────────

function StatusDot({ status, size = 10 }) {
  const m = statusOf(status);
  return (
    <span
      style={{
        display: 'inline-block',
        width: size, height: size,
        borderRadius: '50%',
        backgroundColor: m.dot,
        flexShrink: 0,
      }}
    />
  );
}

function ServiceRow({ svc }) {
  const m = statusOf(svc.status);
  return (
    <div
      className="flex items-center justify-between px-5 py-4 rounded-xl border"
      style={{ borderColor: '#262626', backgroundColor: '#111111' }}
    >
      <div className="flex items-center gap-3">
        <StatusDot status={svc.status} size={10} />
        <span className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{svc.name}</span>
        {svc.message && (
          <span className="text-xs" style={{ color: '#6b6b6b' }}>— {svc.message}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs tabular-nums" style={{ color: '#6b6b6b' }}>
          {svc.uptime_30d.toFixed(2)}% uptime
        </span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ color: m.color, backgroundColor: m.bg }}
        >
          {m.label}
        </span>
      </div>
    </div>
  );
}

function HistoryBar({ history = [] }) {
  return (
    <div className="flex gap-0.5 items-end overflow-hidden" style={{ height: 28 }}>
      {history.map((day, i) => {
        const isOperational = day.status === 'operational';
        return (
          <div
            key={i}
            title={`${fmtShortDate(day.date)} — ${statusOf(day.status).label}`}
            style={{
              flex: 1,
              height: '100%',
              minWidth: 4,
              borderRadius: 3,
              backgroundColor: isOperational ? '#22c55e' : '#ef4444',
              opacity: isOperational ? 0.7 : 1,
              cursor: 'default',
            }}
          />
        );
      })}
    </div>
  );
}

function MaintenanceBanner({ maintenance }) {
  if (!maintenance) return null;
  const start = fmtDate(maintenance.starts_at);
  const end   = fmtDate(maintenance.ends_at);
  return (
    <div
      className="rounded-xl border px-5 py-4 flex items-start gap-3"
      style={{ borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.07)' }}
    >
      <svg viewBox="0 0 20 20" fill="#f59e0b" className="w-5 h-5 mt-0.5 shrink-0">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
          Manutenzione in corso — {maintenance.title}
        </p>
        {maintenance.description && (
          <p className="text-sm mt-0.5" style={{ color: '#a0a0a0' }}>{maintenance.description}</p>
        )}
        <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>{start} → {end}</p>
      </div>
    </div>
  );
}

function UpcomingMaint({ items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: '#e0e0e0' }}>
        Manutenzione programmata
      </h3>
      <div className="space-y-2">
        {items.map(m => (
          <div
            key={m.id}
            className="rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{ borderColor: '#262626', backgroundColor: '#111111' }}
          >
            <svg viewBox="0 0 20 20" fill="#6b6b6b" className="w-4 h-4 mt-0.5 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>{m.title}</p>
              {m.description && (
                <p className="text-xs mt-0.5" style={{ color: '#a0a0a0' }}>{m.description}</p>
              )}
              <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
                {fmtDate(m.starts_at)} → {fmtDate(m.ends_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenIncidents({ incidents }) {
  if (!incidents?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-bold mb-3" style={{ color: '#e0e0e0' }}>
        Incidenti in corso
      </h3>
      <div className="space-y-2">
        {incidents.map(inc => (
          <div
            key={inc.id}
            className="rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }}
          >
            <StatusDot status="outage" size={8} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>{inc.service}</p>
              {inc.description && (
                <p className="text-xs mt-0.5" style={{ color: '#a0a0a0' }}>{inc.description}</p>
              )}
              <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
                Iniziato: {fmtDate(inc.started_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function StatusPage({ user, loading, onLogout }) {
  const [data,       setData]       = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  async function fetchStatus() {
    try {
      const r = await fetch('/api/status');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      setData(d);
      setLastUpdate(new Date());
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 30_000);
    return () => clearInterval(id);
  }, []);

  const overall   = overallStatus(data?.services);
  const overallM  = statusOf(overall);

  const OVERALL_LABELS = {
    operational: 'Tutti i sistemi operativi',
    degraded:    'Alcuni sistemi degradati',
    outage:      'Interruzione rilevata',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d0d0d' }}>

      {/* Navbar sticky */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(13,13,13,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo-horizontal.png" alt="StreaMindAI" className="h-16 md:h-20 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/changelog" style={{ fontSize: 13, color: '#6b6b6b', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = '#e0e0e0'}
              onMouseLeave={e => e.target.style.color = '#6b6b6b'}>
              Changelog
            </Link>
            <AccountMenu user={user} loading={loading} onLogout={onLogout} />
          </div>
        </div>
      </header>

      {/* Contenuto */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Hero: stato globale */}
        <div
          className="rounded-2xl border px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ borderColor: data ? overallM.bg.replace('0.1', '0.3') : '#262626', backgroundColor: data ? overallM.bg : '#111111' }}
        >
          {data ? (
            <>
              <StatusDot status={overall} size={14} />
              <div className="flex-1">
                <h1 className="text-xl font-bold" style={{ color: '#e0e0e0' }}>
                  {OVERALL_LABELS[overall]}
                </h1>
                <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
                  Aggiornato: {lastUpdate?.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '—'}
                  {' '}· Aggiornamento automatico ogni 30 s
                </p>
              </div>
              <button
                onClick={fetchStatus}
                className="text-xs px-3 py-1.5 rounded-lg border"
                style={{ borderColor: '#262626', color: '#6b6b6b', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => { e.target.style.color = '#e0e0e0'; e.target.style.borderColor = '#404040'; }}
                onMouseLeave={e => { e.target.style.color = '#6b6b6b'; e.target.style.borderColor = '#262626'; }}
              >
                Aggiorna
              </button>
            </>
          ) : fetchError ? (
            <p className="text-sm" style={{ color: '#ef4444' }}>Impossibile recuperare lo stato. Riprova.</p>
          ) : (
            <p className="text-sm" style={{ color: '#6b6b6b' }}>Caricamento stato...</p>
          )}
        </div>

        {/* Banner manutenzione attiva */}
        {data?.maintenance_active && (
          <MaintenanceBanner maintenance={data.maintenance_active} />
        )}

        {/* Incidenti aperti */}
        {data?.incidents_open?.length > 0 && (
          <OpenIncidents incidents={data.incidents_open} />
        )}

        {/* Servizi */}
        {data?.services && (
          <div>
            <h2 className="text-sm font-bold mb-3" style={{ color: '#e0e0e0' }}>Stato servizi</h2>
            <div className="space-y-2">
              {data.services.map(svc => (
                <ServiceRow key={svc.key} svc={svc} />
              ))}
            </div>
          </div>
        )}

        {/* Storico 30 giorni */}
        {data?.history && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: '#e0e0e0' }}>Storico uptime — 30 giorni</h2>
              <div className="flex items-center gap-3 text-xs" style={{ color: '#6b6b6b' }}>
                <span className="flex items-center gap-1.5">
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: '#22c55e', opacity: 0.7 }} />
                  Operativo
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: '#ef4444' }} />
                  Interruzione
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {data.services.map(svc => (
                <div key={svc.key}
                  className="rounded-xl border px-5 py-4"
                  style={{ borderColor: '#262626', backgroundColor: '#111111' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: '#a0a0a0' }}>{svc.name}</span>
                    <span className="text-xs" style={{ color: '#6b6b6b' }}>
                      {svc.uptime_30d.toFixed(2)}% uptime
                    </span>
                  </div>
                  <HistoryBar history={data.history[svc.key] ?? []} />
                  <div className="flex justify-between text-xs mt-2" style={{ color: '#4a4a4a' }}>
                    <span>30 giorni fa</span>
                    <span>Oggi</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manutenzione programmata */}
        {data?.maintenance_upcoming?.length > 0 && (
          <UpcomingMaint items={data.maintenance_upcoming} />
        )}

        {/* Footer contatti */}
        <div
          className="rounded-2xl border px-6 py-5 text-center"
          style={{ borderColor: '#1a1a1a', backgroundColor: '#111111' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#e0e0e0' }}>Hai riscontrato un problema?</p>
          <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
            Scrivici a{' '}
            <a href="mailto:support@streamindai.com" style={{ color: PURPLE, textDecoration: 'none' }}>
              support@streamindai.com
            </a>
          </p>
        </div>

      </main>
    </div>
  );
}

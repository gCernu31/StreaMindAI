import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../utils/auth.js';
import { useConfigDirty } from '../contexts/ConfigDirtyCtx.jsx';

// ─── Giorni della settimana ───────────────────────────────────────────────────
const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function DayPills({ selected, onChange }) {
  const toggle = (day) =>
    onChange(selected.includes(day) ? selected.filter(d => d !== day) : [...selected, day]);
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(day => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border"
          style={
            selected.includes(day)
              ? { backgroundColor: 'rgba(139,92,246,0.18)', borderColor: '#8B5CF6', color: '#8B5CF6' }
              : { backgroundColor: 'transparent', borderColor: '#262626', color: '#6b6b6b' }
          }
        >
          {day}
        </button>
      ))}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      title={checked ? 'Attivo' : 'Disattivato'}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? '#8B5CF6' : '#333' }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function InlineBanError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs flex items-start gap-1" style={{ color: '#f87171' }}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-3.5 h-3.5 shrink-0 mt-0.5">
        <path d="M8 6v3M8 11.5v.5M3.3 13h9.4L8 3 3.3 13z"/>
      </svg>
      {msg} Rimuovi il termine prima di salvare.
    </p>
  );
}

function Field({ label, hint, children, banError }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-hally-text">{label}</label>
      {hint && <p className="text-xs text-hally-text-muted mb-2">{hint}</p>}
      {children}
      <InlineBanError msg={banError} />
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="font-semibold text-base border-b border-hally-border pb-3 mb-5">{children}</h2>;
}

const IconPlus = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M8 2v12M2 8h12" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l.8 9.5c0 .3.2.5.5.5h7.4c.3 0 .5-.2.5-.5L13 4" />
  </svg>
);

// ─── Messaggi eventi ──────────────────────────────────────────────────────────
const EVENT_LABELS = {
  follow:     { label: 'Nuovo follower',  hint: 'Var: {username}',                    placeholder: 'Es. Benvenuto/a {username}! Grazie per il follow! ❤️' },
  subscribe:  { label: 'Nuova sub',       hint: 'Var: {username}, {months}',          placeholder: 'Es. {username} è diventato/a supporter! Grazie mille! ⭐' },
  gift_sub:   { label: 'Gift sub',        hint: 'Var: {gifter}, {recipient}, {count}',placeholder: 'Es. {gifter} ha regalato una sub a {recipient}! 🎁' },
  cheer:      { label: 'Cheer bits',      hint: 'Var: {username}, {bits}',            placeholder: 'Es. {username} ha cheered {bits} bits! 💜' },
  hype_train: { label: 'Hype Train',      hint: 'Var: {username}, {level}',           placeholder: 'Es. HYPE TRAIN avviato da {username}! 🚂' },
  raid:       { label: 'Raid in arrivo',  hint: 'Var: {raider}, {count}',             placeholder: 'Es. RAID di {raider} con {count} persone! 🎯' },
};

const EMPTY_EVENT_MESSAGES = Object.fromEntries(Object.keys(EVENT_LABELS).map(k => [k, '']));

// ─── Filtro termini bannabili Twitch ─────────────────────────────────────────
const BANNED = [
  { r: /\bn[i!1l]+g{1,2}[ae3]r+s?\b/i,  cat: 'insulto razziale' },
  { r: /\bn[i!1l]+g{1,2}[ae3]s?\b/i,    cat: 'insulto razziale' },
  { r: /\bspics?\b/i,                    cat: 'insulto razziale' },
  { r: /\bgooks?\b/i,                    cat: 'insulto razziale' },
  { r: /\bwetbacks?\b/i,                 cat: 'insulto razziale' },
  { r: /\bkik[e3]s?\b/i,                 cat: 'insulto razziale' },
  { r: /\bcoons?\b/i,                    cat: 'insulto razziale' },
  { r: /\bzingaracc[oi]\b/i,             cat: 'insulto razziale' },
  { r: /\bterron[ei]\b/i,                cat: 'insulto razziale' },
  { r: /\bf[a4]g+[o0]ts?\b/i,           cat: "linguaggio d'odio" },
  { r: /\bf[a4]gs?\b/i,                  cat: "linguaggio d'odio" },
  { r: /\bdyk[e3]s?\b/i,                 cat: "linguaggio d'odio" },
  { r: /\btr[a4]nn[iy]s?\b/i,            cat: "linguaggio d'odio" },
  { r: /\bporn[o]?\b/i,                  cat: 'contenuto sessuale esplicito' },
  { r: /\bcunts?\b/i,                    cat: 'contenuto sessuale esplicito' },
];

function detectBanned(text) {
  if (!text) return null;
  for (const { r, cat } of BANNED) {
    if (r.test(text)) return cat;
  }
  return null;
}

// ─── Cronologia modifiche ─────────────────────────────────────────────────────
function HistoryPanel({ history, onRestore }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" style={{ color: '#6b6b6b' }}>
            <path d="M1.5 8A6.5 6.5 0 1 0 8 1.5M1.5 1.5v6h6"/>
            <path d="M8 5v3.5l2 2"/>
          </svg>
          <span className="font-semibold text-base text-hally-text">Cronologia modifiche</span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
              {history.length}
            </span>
          )}
          <svg
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className="w-3.5 h-3.5 transition-transform duration-150"
            style={{ color: '#6b6b6b', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M3 5l5 5 5-5"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-hally-border pt-4">
          {history.length === 0 ? (
            <p className="text-sm text-hally-text-muted text-center py-4">
              Nessuna modifica salvata ancora. La cronologia si aggiorna ad ogni salvataggio.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => {
                const snap = entry.config_snapshot;
                const ts   = new Date(entry.saved_at);
                const date = ts.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' });
                const time = ts.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                const preview = snap.bot_personality?.slice(0, 55) ?? '';

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                    style={{ backgroundColor: '#111', borderColor: i === 0 ? 'rgba(139,92,246,0.2)' : '#1e1e1e' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-hally-text truncate">{snap.bot_name || '—'}</span>
                        {i === 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                            più recente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-hally-text-muted">
                        {date} alle {time}
                        {preview ? ` · ${preview}${snap.bot_personality?.length > 55 ? '…' : ''}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestore(entry)}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 min-h-[32px]"
                      style={{ borderColor: 'rgba(139,92,246,0.3)', color: '#8B5CF6', backgroundColor: 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      Ripristina
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Default config vuota ─────────────────────────────────────────────────────
const EMPTY = {
  bot_name: '',
  creator_name: '',
  bot_personality: '',
  twitch_username: '',
  stream_schedule: { days: [], time_start: '21:00', time_end: '00:00' },
  social_links: { linktree: '', instagram: '', youtube: '', discord: '' },
  members: [],
  custom_commands: [],
  event_messages: { ...EMPTY_EVENT_MESSAGES },
  spotify_client_id:     '',
  spotify_client_secret: '',
  spotify_connected:     false,
  discord_bot_token:     '',
  user_msg_nonsub:       null,
  user_msg_subvip:       null,
};

let _mid = 1;
let _kid = 1;
const newMember = () => ({ id: _mid++, twitch_username: '', nickname: '', description: '' });
const newCmd    = () => ({ id: _kid++, trigger: '', response: '', active: true });

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function ConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig]       = useState(null);
  const [saveState, setSaveState]     = useState('idle'); // idle | saving | saved | error
  const [banErrors, setBanErrors]     = useState({});     // { fieldKey: 'messaggio' | null }
  const [plan, setPlan]               = useState(null);
  const [history, setHistory]         = useState([]);
  const [restoreNotice, setRestoreNotice] = useState(null);
  const [spotifyBanner, setSpotifyBanner] = useState(null); // 'connected'|'error'|'denied'|null
  const [spotifyAuthLoading, setSpotifyAuthLoading] = useState(false);
  const [discordShowToken, setDiscordShowToken] = useState(false);
  const [nameChangeError, setNameChangeError] = useState(null);
  const [learnedUsers, setLearnedUsers]   = useState([]);
  const [learnedBusy, setLearnedBusy]     = useState(null); // id in elaborazione

  // Stato modifiche non salvate
  const { setDirty } = useConfigDirty();
  const [isDirty, setIsDirty]         = useState(false);
  const [bannerFading, setBannerFading] = useState(false);

  const markDirty = () => { setIsDirty(true); setDirty(true); setBannerFading(false); };
  const clearDirty = () => {
    setBannerFading(true);
    setTimeout(() => { setIsDirty(false); setBannerFading(false); setDirty(false); }, 380);
  };

  useEffect(() => {
    const sp = searchParams.get('spotify');
    if (sp) {
      setSpotifyBanner(sp);
      setSearchParams({}, { replace: true });
      setTimeout(() => setSpotifyBanner(null), 6000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = () => {
    const token = getToken();
    axios.get('/api/config/history', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setHistory(r.data?.history ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchHistory();
    const token = getToken();
    axios.get('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const d = r.data ?? {};
        setConfig({
          ...EMPTY,
          ...d,
          stream_schedule:       d.stream_schedule       ?? EMPTY.stream_schedule,
          social_links:          d.social_links          ?? EMPTY.social_links,
          members:               (d.members ?? []).map(m => ({ ...m, id: _mid++ })),
          custom_commands:       d.custom_commands       ?? [],
          event_messages:        d.event_messages        ?? { ...EMPTY_EVENT_MESSAGES },
          spotify_client_id:     d.spotify_client_id     ?? '',
          spotify_client_secret: d.spotify_client_secret ?? '',
          spotify_connected:     d.spotify_connected     ?? false,
          discord_bot_token:     d.discord_bot_token     ?? '',
          user_msg_nonsub:       d.user_msg_nonsub       ?? null,
          user_msg_subvip:       d.user_msg_subvip       ?? null,
        });
      })
      .catch(() => setConfig({ ...EMPTY }));

    axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPlan(r.data.subscription?.plan ?? 'starter'))
      .catch(() => setPlan('starter'));

    axios.get('/api/users?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setLearnedUsers(r.data?.users ?? []))
      .catch(() => {});
  }, []);

  const set       = (k, v)      => { setConfig(p => ({ ...p, [k]: v })); markDirty(); };
  const setNested = (k, sub, v) => { setConfig(p => ({ ...p, [k]: { ...p[k], [sub]: v } })); markDirty(); };

  // Membri — markDirty già chiamato da set()
  const addMember    = ()         => set('members', [...config.members, newMember()]);
  const removeMember = id         => set('members', config.members.filter(c => c.id !== id));
  const updateMember = (id, f, v) => set('members', config.members.map(c => c.id === id ? { ...c, [f]: v } : c));

  // Commands
  const addCmd    = ()           => set('custom_commands', [...config.custom_commands, newCmd()]);
  const removeCmd = id           => set('custom_commands', config.custom_commands.filter(c => c.id !== id));
  const updateCmd = (id, f, v)   => set('custom_commands', config.custom_commands.map(c => c.id === id ? { ...c, [f]: v } : c));

  // Utenti appresi — elimina
  const deleteLearnedUser = async (id) => {
    setLearnedBusy(id);
    try {
      const token = getToken();
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setLearnedUsers(prev => prev.filter(u => u.id !== id));
    } catch { /* silent */ } finally {
      setLearnedBusy(null);
    }
  };

  // Utenti appresi — promuovi a membro manuale
  const promoteLearnedUser = async (id) => {
    setLearnedBusy(id);
    try {
      const token = getToken();
      await axios.post(`/api/users/${id}/promote`, {}, { headers: { Authorization: `Bearer ${token}` } });
      // Ricarica config per aggiornare la lista membri
      const r = await axios.get('/api/config', { headers: { Authorization: `Bearer ${token}` } });
      const d = r.data ?? {};
      setConfig(prev => ({
        ...prev,
        members: (d.members ?? []).map(m => ({ ...m, id: _mid++ })),
      }));
      setLearnedUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err?.response?.data?.error ?? 'Errore nella promozione.');
    } finally {
      setLearnedBusy(null);
    }
  };

  // Controllo inline per-campo
  const checkBan = (key, val) => {
    const cat = detectBanned(val);
    setBanErrors(prev => ({ ...prev, [key]: cat ? `Contiene ${cat} non consentito dalle linee guida Twitch.` : null }));
  };

  const handleSave = async () => {
    // Ri-verifica tutti i campi sensibili prima di salvare
    const newErrors = {};
    const cat1 = detectBanned(config.bot_name);       if (cat1) newErrors.bot_name        = `Contiene ${cat1} non consentito.`;
    const cat2 = detectBanned(config.bot_personality); if (cat2) newErrors.bot_personality = `Contiene ${cat2} non consentito.`;
    for (const m of config.members ?? []) {
      const c1 = detectBanned(m.nickname);    if (c1) newErrors[`m_${m.id}_nick`] = `Contiene ${c1} non consentito.`;
      const c2 = detectBanned(m.description); if (c2) newErrors[`m_${m.id}_desc`] = `Contiene ${c2} non consentito.`;
    }
    if (Object.values(newErrors).some(Boolean)) {
      setBanErrors(newErrors);
      return;
    }

    setSaveState('saving');
    try {
      const token = getToken();
      await axios.put('/api/config', config, { headers: { Authorization: `Bearer ${token}` } });
      setSaveState('saved');
      setRestoreNotice(null);
      setNameChangeError(null);
      fetchHistory();
      clearDirty();
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === 'NAME_CHANGE_LIMIT') {
        setNameChangeError(data.error);
        setSaveState('idle');
      } else {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 4000);
      }
    }
  };

  const handleSpotifyAuth = async () => {
    setSpotifyAuthLoading(true);
    try {
      const token = getToken();
      const r = await axios.get('/api/spotify/auth-url', { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = r.data.url;
    } catch (e) {
      setSpotifyBanner('error');
      setTimeout(() => setSpotifyBanner(null), 5000);
    } finally {
      setSpotifyAuthLoading(false);
    }
  };

  const handleSpotifyDisconnect = async () => {
    const token = getToken();
    await axios.delete('/api/spotify/disconnect', { headers: { Authorization: `Bearer ${token}` } });
    setConfig(p => ({ ...p, spotify_connected: false }));
  };

  const handleRestore = (entry) => {
    const snap = entry.config_snapshot;
    const ts   = new Date(entry.saved_at).toLocaleString('it-IT', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    setConfig(prev => ({
      ...prev,
      bot_name:        snap.bot_name        ?? prev.bot_name,
      creator_name:    snap.creator_name    ?? prev.creator_name,
      bot_personality: snap.bot_personality ?? prev.bot_personality,
      twitch_username: snap.twitch_username ?? prev.twitch_username,
      stream_schedule: snap.stream_schedule ?? prev.stream_schedule,
      social_links:    snap.social_links    ?? prev.social_links,
      custom_commands: (snap.custom_commands ?? []).map(c => ({ ...c, id: _kid++ })),
      members:         (snap.members         ?? []).map(m => ({ ...m, id: _mid++ })),
      ai_provider:     snap.ai_provider     ?? prev.ai_provider,
      event_messages:  snap.event_messages  ?? prev.event_messages,
      // Mantieni credenziali Spotify/Discord correnti
    }));
    setBanErrors({});
    setRestoreNotice(`Versione del ${ts} caricata — clicca "Salva configurazione" per confermare.`);
    markDirty();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!config) {
    return <div className="text-hally-text-muted text-sm py-8 text-center">Caricamento configurazione...</div>;
  }

  return (
    <div>

      {/* ── Banner modifiche non salvate ── */}
      {(isDirty || bannerFading) && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 16px',
            marginLeft: '-12px',
            marginRight: '-12px',
            marginTop: '-16px',
            marginBottom: '20px',
            backgroundColor: 'rgba(13,13,13,0.97)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(139,92,246,0.35)',
            opacity: bannerFading ? 0 : 1,
            transition: 'opacity 0.38s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f0' }}>Hai modifiche non salvate</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            style={{
              fontSize: '13px',
              fontWeight: 700,
              padding: '7px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: saveState === 'saving' ? 'rgba(139,92,246,0.4)' : '#8B5CF6',
              color: '#fff',
              cursor: saveState === 'saving' ? 'default' : 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (saveState !== 'saving') e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = saveState === 'saving' ? 'rgba(139,92,246,0.4)' : '#8B5CF6'; }}
          >
            {saveState === 'saving' ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          Il Mio Bot
          {isDirty && (
            <span
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0, marginTop: '2px' }}
              title="Modifiche non salvate"
            />
          )}
        </h1>
        <p className="text-hally-text-muted text-sm">Personalizza come StreaMindAI si comporta nel tuo canale.</p>
      </div>

      {/* ── Reminder moderatore ── */}
      <div
        className="mb-6 rounded-xl px-5 py-4 flex gap-3 items-start"
        style={{ backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#a78bfa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#c4b5fd' }}>
            ⚠️ Ricorda: rendi il bot moderatore
          </p>
          <p className="text-sm" style={{ color: '#a0a0a0' }}>
            Per permettere al bot di usare tutte le funzioni (timeout, ban, eliminazione messaggi, comandi moderazione) devi renderlo moderatore del tuo canale. Scrivi nella tua chat Twitch:
          </p>
          <div className="mt-2">
            <code
              className="inline-block px-3 py-1.5 rounded-lg text-sm font-mono"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#e9d5ff', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              /mod StreaMindAI
            </code>
          </div>
          <p className="text-xs mt-2" style={{ color: '#6b6b6b' }}>
            StreaMindAI è il nome dell'account Twitch del bot. Il nome che hai scelto è solo il suo nome in chat.
          </p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── IDENTITÀ ── */}
        <div className="card">
          <SectionTitle>Identità</SectionTitle>
          <div className="space-y-5">

            <Field label="Nome" hint="Come si chiama StreaMindAI in chat. Es. StreamBot, MaxAI, NightBot…" banError={banErrors.bot_name}>
              <input
                className="input"
                value={config.bot_name}
                onChange={e => {
                  set('bot_name', e.target.value);
                  checkBan('bot_name', e.target.value);
                  if (nameChangeError) setNameChangeError(null);
                }}
                placeholder="Es. StreamBot"
                style={nameChangeError ? { borderColor: '#f87171' } : banErrors.bot_name ? { borderColor: '#f87171' } : undefined}
              />
              {nameChangeError ? (
                <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{nameChangeError}</p>
              ) : (
                <p className="text-xs mt-1.5" style={{ color: '#6b7280' }}>
                  Il nome del bot può essere modificato una volta al mese.
                </p>
              )}
            </Field>

            <Field label="Come chiami il tuo streamer" hint="Il nome con cui StreaMindAI si riferisce a te in chat.">
              <input
                className="input"
                value={config.creator_name}
                onChange={e => set('creator_name', e.target.value)}
                placeholder="Es. Signor gCernu, Boss, Il Capo…"
              />
            </Field>

            <Field label="Personalità base" hint="Descrivi il carattere di StreaMindAI: tono, stile, humour, riferimenti alla tua community." banError={banErrors.bot_personality}>
              <textarea
                className="input min-h-[148px] resize-y"
                value={config.bot_personality}
                onChange={e => { set('bot_personality', e.target.value); checkBan('bot_personality', e.target.value); }}
                placeholder={`Es. Sei un bot diretto e ironico, ami i giochi indie e i meme della community. Usi un tono informale, a volte sarcasmo leggero, ma sempre rispettoso. Conosci le reference interne della chat come "modacoda" e "la regola del giovedì".`}
                style={banErrors.bot_personality ? { borderColor: '#f87171' } : undefined}
              />
            </Field>

          </div>
        </div>

        {/* ── LIMITI MESSAGGI PER UTENTE ── */}
        {(() => {
          const PLAN_MSG_MAX = { starter: 10, creator: 50, elite: 100, signature: -1 };
          const maxVal = PLAN_MSG_MAX[plan] ?? 10;
          const maxLabel = maxVal === -1 ? 'illimitati' : maxVal;
          const clamp = (v) => maxVal === -1 ? v : Math.min(Math.max(1, v), maxVal);
          return (
            <div className="card">
              <SectionTitle>Limiti messaggi per utente</SectionTitle>
              <p className="text-xs text-hally-text-muted mb-5">
                Quanti messaggi può inviare al bot ogni utente per sessione di stream. Il bot smette di rispondere a quell'utente una volta raggiunto il limite.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-hally-text">
                    Follower / utente normale
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxVal === -1 ? undefined : maxVal}
                    className="input w-full"
                    value={config.user_msg_nonsub ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : clamp(parseInt(e.target.value, 10) || 1);
                      set('user_msg_nonsub', v);
                    }}
                    placeholder={plan === 'starter' ? '3' : plan === 'creator' ? '3' : plan === 'elite' ? '5' : '10'}
                  />
                  <p className="text-xs mt-1.5 text-hally-text-muted">
                    {maxVal === -1 ? 'Nessun limite massimo sul tuo piano' : `Massimo consentito dal tuo piano: ${maxLabel}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-hally-text">
                    Subscriber / VIP / Mod
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxVal === -1 ? undefined : maxVal}
                    className="input w-full"
                    value={config.user_msg_subvip ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : clamp(parseInt(e.target.value, 10) || 1);
                      set('user_msg_subvip', v);
                    }}
                    placeholder={plan === 'starter' ? '10' : plan === 'creator' ? '20' : plan === 'elite' ? '30' : '50'}
                  />
                  <p className="text-xs mt-1.5 text-hally-text-muted">
                    {maxVal === -1 ? 'Nessun limite massimo sul tuo piano' : `Massimo consentito dal tuo piano: ${maxLabel}`}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── CANALE ── */}
        <div className="card">
          <SectionTitle>Canale</SectionTitle>
          <div className="space-y-5">

            <Field label="Username Twitch">
              <input
                className="input"
                value={config.twitch_username}
                onChange={e => set('twitch_username', e.target.value)}
                placeholder="Es. gcernu"
              />
            </Field>

            <Field label="Orari streaming" hint="Seleziona i giorni in cui vai in live e l'orario di solito.">
              <DayPills
                selected={config.stream_schedule.days}
                onChange={days => setNested('stream_schedule', 'days', days)}
              />
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hally-text-muted w-8">Dalle</span>
                  <input
                    type="time"
                    className="input w-32 text-sm py-1.5"
                    value={config.stream_schedule.time_start}
                    onChange={e => setNested('stream_schedule', 'time_start', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hally-text-muted w-4">alle</span>
                  <input
                    type="time"
                    className="input w-32 text-sm py-1.5"
                    value={config.stream_schedule.time_end}
                    onChange={e => setNested('stream_schedule', 'time_end', e.target.value)}
                  />
                </div>
              </div>
            </Field>

            <Field label="Linktree / Link principale">
              <input
                className="input"
                value={config.social_links.linktree}
                onChange={e => setNested('social_links', 'linktree', e.target.value)}
                placeholder="https://linktr.ee/gcernu"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Instagram">
                <input
                  className="input"
                  value={config.social_links.instagram}
                  onChange={e => setNested('social_links', 'instagram', e.target.value)}
                  placeholder="@handle"
                />
              </Field>
              <Field label="YouTube">
                <input
                  className="input"
                  value={config.social_links.youtube}
                  onChange={e => setNested('social_links', 'youtube', e.target.value)}
                  placeholder="youtube.com/canale"
                />
              </Field>
              <Field label="Discord">
                <input
                  className="input"
                  value={config.social_links.discord}
                  onChange={e => setNested('social_links', 'discord', e.target.value)}
                  placeholder="discord.gg/invito"
                />
              </Field>
            </div>

          </div>
        </div>

        {/* ── MEMBRI ── */}
        {(() => {
          const MEMBERS_CAP = { starter: 10, creator: 20, elite: 30, signature: 50 };
          const membersLimit = MEMBERS_CAP[plan] ?? 20;
          const atLimit = config.members.length >= membersLimit;
          return (
          <div className="card">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-hally-border">
              <h2 className="font-semibold text-base">Membri</h2>
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color: atLimit ? '#f87171' : '#6b7280' }}
              >
                {config.members.length}/{membersLimit}
              </span>
            </div>
            <p className="text-xs text-hally-text-muted mb-4">
              Aggiungi i membri fissi della tua community. StreaMindAI li riconoscerà per nome e si comporterà di conseguenza.
            </p>

            <div className="space-y-3 mb-4">
              {config.members.length === 0 && (
                <p className="text-sm text-hally-text-muted py-6 text-center border border-dashed border-hally-border rounded-lg">
                  Nessun membro aggiunto ancora.
                </p>
              )}
              {config.members.map(member => (
                <div
                  key={member.id}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg border border-hally-border bg-hally-bg"
                >
                  <div>
                    <label className="text-xs text-hally-text-muted block mb-1">Username Twitch</label>
                    <input
                      className="input text-sm"
                      value={member.twitch_username}
                      onChange={e => updateMember(member.id, 'twitch_username', e.target.value)}
                      placeholder="Es. xX_modacoda_Xx"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-hally-text-muted block mb-1">Soprannome</label>
                    <input
                      className="input text-sm"
                      value={member.nickname}
                      onChange={e => { updateMember(member.id, 'nickname', e.target.value); checkBan(`m_${member.id}_nick`, e.target.value); }}
                      placeholder="Es. Il Moderatore"
                      style={banErrors[`m_${member.id}_nick`] ? { borderColor: '#f87171' } : undefined}
                    />
                    <InlineBanError msg={banErrors[`m_${member.id}_nick`]} />
                  </div>
                  <div className="relative">
                    <label className="text-xs text-hally-text-muted block mb-1">Descrizione comportamento</label>
                    <input
                      className="input text-sm pr-8"
                      value={member.description}
                      onChange={e => { updateMember(member.id, 'description', e.target.value); checkBan(`m_${member.id}_desc`, e.target.value); }}
                      placeholder="Es. Moderatore storico, sempre ironico"
                      style={banErrors[`m_${member.id}_desc`] ? { borderColor: '#f87171' } : undefined}
                    />
                    <InlineBanError msg={banErrors[`m_${member.id}_desc`]} />
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="absolute right-2.5 top-[26px] text-hally-text-muted hover:text-red-400 transition-colors"
                      title="Rimuovi membro"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={addMember}
                disabled={atLimit}
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed"
                style={{ color: atLimit ? '#4b4b4b' : '#8B5CF6', opacity: atLimit ? 1 : undefined }}
                onMouseEnter={e => { if (!atLimit) e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <IconPlus />
                Aggiungi membro
              </button>
              {atLimit && (
                <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>
                  Hai raggiunto il limite massimo di {membersLimit} membri.
                </p>
              )}
            </div>
          </div>
          );
        })()}

        {/* ── UTENTI APPRESI ── */}
        {learnedUsers.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-hally-border">
              <h2 className="font-semibold text-base">Utenti appresi automaticamente</h2>
              <span className="text-xs font-medium tabular-nums" style={{ color: '#6b7280' }}>
                {learnedUsers.length}
              </span>
            </div>
            <p className="text-xs text-hally-text-muted mb-4">
              Utenti che hanno interagito col bot. Le note vengono generate automaticamente dopo 10 messaggi e aggiornate ogni 20. Puoi promuoverli a membri manuali per personalizzare il comportamento del bot.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ borderBottom: '1px solid #262626' }}>
                    <th className="pb-2 pr-4 text-xs font-medium text-hally-text-muted">Username</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-hally-text-muted">Msg</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-hally-text-muted hidden sm:table-cell">Ultimo accesso</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-hally-text-muted hidden md:table-cell">Note</th>
                    <th className="pb-2 text-xs font-medium text-hally-text-muted text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hally-border">
                  {learnedUsers.map(u => {
                    const busy = learnedBusy === u.id;
                    const lastSeen = new Date(u.last_seen);
                    const daysAgo  = Math.floor((Date.now() - lastSeen) / 86_400_000);
                    const lastSeenStr = daysAgo === 0 ? 'Oggi'
                      : daysAgo === 1 ? 'Ieri'
                      : `${daysAgo}g fa`;
                    return (
                      <tr key={u.id} style={{ opacity: busy ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                        <td className="py-2.5 pr-4 font-medium text-hally-text">
                          @{u.username}
                        </td>
                        <td className="py-2.5 pr-4 text-hally-text-muted tabular-nums">
                          {u.message_count}
                        </td>
                        <td className="py-2.5 pr-4 text-hally-text-muted hidden sm:table-cell">
                          {lastSeenStr}
                        </td>
                        <td className="py-2.5 pr-4 hidden md:table-cell" style={{ maxWidth: '240px' }}>
                          {u.notes
                            ? <span className="text-hally-text text-xs">{u.notes}</span>
                            : <span className="text-hally-text-muted text-xs italic">Ancora poche interazioni</span>
                          }
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => promoteLearnedUser(u.id)}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all duration-150 disabled:cursor-not-allowed"
                              style={{ borderColor: 'rgba(139,92,246,0.35)', color: '#8B5CF6', backgroundColor: 'transparent' }}
                              onMouseEnter={e => { if (!busy) e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              title="Aggiungi ai membri manuali"
                            >
                              Promuovi
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => deleteLearnedUser(u.id)}
                              className="text-hally-text-muted hover:text-red-400 transition-colors disabled:cursor-not-allowed"
                              title="Elimina profilo appreso"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MESSAGGI EVENTI ── */}
        <div className="card">
          <SectionTitle>Messaggi eventi</SectionTitle>

          {plan === 'starter' && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3 mb-5"
              style={{ backgroundColor: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#a78bfa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-xs" style={{ color: '#a0a0a0' }}>
                Testo personalizzabile per tutti gli eventi. Le variabili avanzate (es. contatori, statistiche) sono disponibili dal piano <strong style={{ color: '#c4b5fd' }}>Creator</strong>.
              </p>
            </div>
          )}

          <p className="text-xs text-hally-text-muted mb-5">
            Personalizza cosa dice StreaMindAI per ogni evento Twitch. Lascia vuoto per usare la risposta automatica.
          </p>

          <div className="space-y-4">
            {Object.entries(EVENT_LABELS).map(([key, meta]) => (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 items-start">
                <div className="pt-2">
                  <p className="text-sm font-medium text-hally-text">{meta.label}</p>
                  <p className="text-[11px] text-hally-text-muted mt-0.5">{meta.hint}</p>
                </div>
                <input
                  className="input text-sm"
                  value={config?.event_messages?.[key] ?? ''}
                  onChange={e => setConfig(p => ({
                    ...p,
                    event_messages: { ...p.event_messages, [key]: e.target.value },
                  }))}
                  placeholder={meta.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── COMANDI ── */}
        <div className="card">
          <SectionTitle>Comandi personalizzati</SectionTitle>
          <p className="text-xs text-hally-text-muted mb-4">
            Crea comandi custom per la tua chat. Quando qualcuno scrive il trigger, StreaMindAI risponde con il testo configurato.
          </p>

          <div className="space-y-3 mb-4">
            {config.custom_commands.length === 0 && (
              <p className="text-sm text-hally-text-muted py-6 text-center border border-dashed border-hally-border rounded-lg">
                Nessun comando personalizzato ancora.
              </p>
            )}
            {config.custom_commands.map(cmd => (
              <div
                key={cmd.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-hally-border bg-hally-bg"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-hally-text-muted block mb-1">Trigger</label>
                    <input
                      className="input text-sm font-mono"
                      value={cmd.trigger}
                      onChange={e => updateCmd(cmd.id, 'trigger', e.target.value)}
                      placeholder="Es. !social, !discord, !orario"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-hally-text-muted block mb-1">Risposta</label>
                    <input
                      className="input text-sm"
                      value={cmd.response}
                      onChange={e => updateCmd(cmd.id, 'response', e.target.value)}
                      placeholder="Es. Seguimi su instagram: @gcernu"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2.5 pt-5 shrink-0">
                  <Toggle
                    checked={cmd.active}
                    onChange={v => updateCmd(cmd.id, 'active', v)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCmd(cmd.id)}
                    className="text-hally-text-muted hover:text-red-400 transition-colors"
                    title="Rimuovi comando"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCmd}
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:opacity-80"
            style={{ color: '#8B5CF6' }}
          >
            <IconPlus />
            Aggiungi comando
          </button>
        </div>

      </div>

        {/* ── SPOTIFY ────────────────────────────────────────────────── */}
        {['creator', 'elite', 'signature'].includes(plan) && (
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <SectionTitle>Song Request — Spotify</SectionTitle>
            {config.spotify_connected
              ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Account collegato
                </span>
              : <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(113,113,122,0.1)', color: '#71717a', border: '1px solid rgba(113,113,122,0.2)' }}>
                  Non collegato
                </span>
            }
          </div>

          {/* Banner risultato OAuth */}
          {spotifyBanner === 'connected' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm" style={{ backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#4ade80' }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M2.5 8.5l4 4 7-8"/></svg>
              Spotify collegato con successo!
            </div>
          )}
          {(spotifyBanner === 'error' || spotifyBanner === 'missing_credentials') && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4 shrink-0"><path d="M8 6v3M8 11.5v.5M3.3 13h9.4L8 3 3.3 13z"/></svg>
              {spotifyBanner === 'missing_credentials' ? 'Salva prima Client ID e Client Secret.' : 'Errore durante la connessione. Riprova.'}
            </div>
          )}
          {spotifyBanner === 'denied' && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              Autorizzazione Spotify rifiutata.
            </div>
          )}

          <p className="text-xs text-hally-text-muted -mt-1">
            Crea un'app su <span className="font-medium text-hally-text">developer.spotify.com</span>, aggiungi
            come Redirect URI: <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: '#1a1a1a', color: '#a78bfa' }}>{window.location.origin}/api/spotify/callback</code>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Spotify Client ID">
              <input
                value={config.spotify_client_id}
                onChange={e => set('spotify_client_id', e.target.value)}
                placeholder="1a2b3c4d5e6f..."
                className="input-base"
              />
            </Field>
            <Field label="Spotify Client Secret">
              <input
                type="password"
                value={config.spotify_client_secret}
                onChange={e => set('spotify_client_secret', e.target.value)}
                placeholder="••••••••••••••••"
                className="input-base"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSpotifyAuth}
              disabled={spotifyAuthLoading || !config.spotify_client_id}
              className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1DB954', color: '#fff' }}
              onMouseEnter={e => { if (!spotifyAuthLoading) e.currentTarget.style.backgroundColor = '#17a34a'; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1DB954'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 01-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.622.622 0 01.207.857zm1.223-2.722a.779.779 0 01-1.072.257C13.924 12.18 10.51 11.7 7.827 12.51a.78.78 0 01-.453-1.489c3.054-.929 6.847-.479 9.208 1.009a.779.779 0 01.227 1.072zm.105-2.835C14.692 9.15 9.375 8.978 6.297 9.928a.935.935 0 11-.543-1.788c3.532-1.072 9.404-.865 13.115 1.334a.935.935 0 01-.955 1.393z"/></svg>
              {spotifyAuthLoading ? 'Apertura...' : config.spotify_connected ? 'Riconnetti account' : 'Autorizza Spotify'}
            </button>

            {config.spotify_connected && (
              <button
                type="button"
                onClick={handleSpotifyDisconnect}
                className="text-xs font-medium transition-colors duration-150"
                style={{ color: '#f87171' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#f87171'}
              >
                Disconnetti
              </button>
            )}
          </div>
        </div>
        )}

        {/* ── DISCORD ─────────────────────────────────────────────────── */}
        {['creator', 'elite', 'signature'].includes(plan) && (
        <div className="card space-y-5">
          <SectionTitle>Integrazione Discord</SectionTitle>

          <p className="text-xs text-hally-text-muted -mt-2">
            Crea un bot su <span className="font-medium text-hally-text">discord.com/developers/applications</span>,
            copia il <span className="font-medium text-hally-text">Token</span> dalla sezione Bot e incollalo qui.
          </p>

          <Field label="Discord Bot Token">
            <div className="relative">
              <input
                type={discordShowToken ? 'text' : 'password'}
                value={config.discord_bot_token}
                onChange={e => set('discord_bot_token', e.target.value)}
                placeholder="MTA1NTk0Nj..."
                className="input-base pr-10"
              />
              <button
                type="button"
                onClick={() => setDiscordShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-hally-text-muted hover:text-hally-text transition-colors"
                tabIndex={-1}
              >
                {discordShowToken
                  ? <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
                  : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                }
              </button>
            </div>
          </Field>

          {config.discord_bot_token && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              Token configurato
            </div>
          )}
        </div>
        )}

        {/* ── CRONOLOGIA ── */}
        <HistoryPanel history={history} onRestore={handleRestore} />

      {/* ── SALVA ── */}
      <div className="mt-8 space-y-3">
        {/* Banner ripristino versione */}
        {restoreNotice && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-lg border text-sm"
            style={{ backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4 shrink-0 mt-0.5">
              <path d="M1.5 8A6.5 6.5 0 1 0 8 1.5M1.5 1.5v6h6"/>
              <path d="M8 5v3.5l2 2"/>
            </svg>
            <span>{restoreNotice}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="btn-primary min-w-[170px]"
        >
          {saveState === 'saving' ? 'Salvataggio...' : 'Salva configurazione'}
        </button>

        {saveState === 'saved' && (
          <span className="text-green-400 text-sm flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M2.5 8.5l4 4 7-8" />
            </svg>
            Salvato con successo
          </span>
        )}

        {saveState === 'error' && (
          <span className="text-red-400 text-sm flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M8 6v3M8 11.5v.5M3.3 13h9.4L8 3 3.3 13z" />
            </svg>
            Errore nel salvataggio
          </span>
        )}
        </div>
      </div>
    </div>
  );
}

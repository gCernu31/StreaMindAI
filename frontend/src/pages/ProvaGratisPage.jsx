import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AccountMenu from '../components/AccountMenu.jsx';
import SlideShow, { parseSlides } from '../components/SlideShow.jsx';
import { getToken } from '../utils/auth.js';

const PURPLE = '#8B5CF6';
const GREEN  = '#4ade80';

const EMPTY_FORM = {
  twitch_username:  '',
  total_followers:  '',
  avg_viewers:      '',
  main_games:       '',
  current_subs:     '',
  hours_per_week:   '',
  main_goal:        '',
  has_socials:      false,
  social_links:     '',
  stream_schedule:  '',
  audience_age:     '',
  language:         '',
  has_collaborated: false,
  main_weakness:    '',
  total_views:      '',
  created_at:       '',
  is_live:          false,
};

// ── Componenti UI ─────────────────────────────────────────────────────────────

function TwitchBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: GREEN, border: '1px solid rgba(74,222,128,0.25)' }}
    >
      ✓ Twitch
    </span>
  );
}

function Field({ label, children, badge }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium">{label}</label>
        {badge && <TwitchBadge />}
      </div>
      {children}
    </div>
  );
}

function TextInput({ type = 'text', value, onChange, placeholder, readOnly }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: '8px',
        backgroundColor: readOnly ? '#0a0a0a' : '#0d0d0d',
        color: '#f0f0f0', fontSize: '14px', outline: 'none',
        transition: 'border-color 0.15s', boxSizing: 'border-box',
        border: '1px solid #2a2a2a',
        cursor: readOnly ? 'default' : 'text',
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = PURPLE; }}
      onBlur={e  => { if (!readOnly) e.target.style.borderColor = '#2a2a2a'; }}
    />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%', padding: '10px 36px 10px 14px', borderRadius: '8px',
          backgroundColor: '#0d0d0d',
          color: value ? '#f0f0f0' : '#6b6b6b',
          fontSize: '14px', border: '1px solid #2a2a2a',
          outline: 'none', cursor: 'pointer', appearance: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = PURPLE)}
        onBlur={e  => (e.target.style.borderColor = '#2a2a2a')}
      >
        {children}
      </select>
      <svg viewBox="0 0 16 16" fill="none" stroke="#6b6b6b" strokeWidth="1.5" strokeLinecap="round"
        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', pointerEvents: 'none' }}>
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        flexShrink: 0, width: '44px', height: '24px', borderRadius: '12px',
        backgroundColor: value ? PURPLE : '#2a2a2a',
        transition: 'background-color 0.2s', border: 'none', cursor: 'pointer',
        position: 'relative',
      }}
      aria-pressed={value}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '9px',
        backgroundColor: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

// Preview sfocata per stato A
function BlurredPreview() {
  return (
    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #222', marginBottom: '32px' }}>
      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', backgroundColor: '#111', padding: '32px 36px' }}>
        <p style={{ color: PURPLE, fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>📊 Situazione Attuale del Canale</p>
        <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>
          Il tuo canale ha registrato una crescita del 23% negli ultimi 30 giorni, con una media di 47 spettatori per live.
          Questo ti posiziona nel top 15% dei canali italiani della categoria — un risultato solido con ampio margine di crescita.
        </p>
        <p style={{ color: PURPLE, fontWeight: 700, fontSize: '15px', marginBottom: '12px' }}>🎯 Punteggio Canale</p>
        <div style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '2.2' }}>
          <p><strong style={{ color: '#f0f0f0' }}>Community</strong>: 7/10 — Community coinvolta e attiva</p>
          <p><strong style={{ color: '#f0f0f0' }}>Monetizzazione</strong>: 5/10 — Potenziale non ancora sfruttato</p>
          <p><strong style={{ color: '#f0f0f0' }}>Discovery</strong>: 8/10 — Ottima visibilità nella categoria</p>
          <p><strong style={{ color: '#f0f0f0' }}>Costanza</strong>: 6/10 — Schedule migliorabile</p>
        </div>
        <p style={{ color: PURPLE, fontWeight: 700, fontSize: '15px', margin: '20px 0 10px' }}>🚀 Roadmap di Crescita</p>
        <p style={{ color: '#a0a0a0', fontSize: '14px', lineHeight: '1.7' }}>
          30 giorni: +120 follower con ottimizzazione orari. 60 giorni: primo host collaborativo...
        </p>
      </div>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(to bottom, rgba(13,13,13,0.5), rgba(13,13,13,0.92))',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
        <p style={{ color: '#f0f0f0', fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>Analisi bloccata</p>
        <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Accedi con Twitch per generare la tua analisi personale</p>
      </div>
    </div>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function ProvaGratisPage({ user, loading: authLoading, onLogout }) {
  const navigate = useNavigate();
  const [pageState, setPageState]     = useState('loading'); // loading | A | B | C
  const [form, setForm]               = useState(EMPTY_FORM);
  const [fetchedFields, setFetchedFields] = useState({});   // campi auto-compilati da Twitch
  const [slides, setSlides]           = useState(null);
  const [analysisId, setAnalysisId]   = useState(null);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [isLive, setIsLive]           = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPageState('A');
      return;
    }

    const token = getToken();

    // Verifica abbonamento aggiornato dal DB (non dal JWT che potrebbe essere stale)
    fetch('/api/subscription', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { status: 'inactive' })
      .then(sub => {
        if (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'cancelling') {
          navigate('/analisi', { replace: true });
          return;
        }

        fetch('/api/analytics/my-analysis', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.analysis) {
              setSlides(parseSlides(data.analysis, user.twitch_username ?? ''));
              setAnalysisId(data.id ?? null);
              setPageState('C');
              return;
            }
            setPrefillLoading(true);
            fetch('/api/analytics/twitch-data', {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(r => r.ok ? r.json() : null)
              .then(tw => {
                const prefills  = { twitch_username: tw?.twitch_username ?? user.twitch_username ?? '' };
                const fetched   = {};
                if (tw?.total_followers != null) { prefills.total_followers = String(tw.total_followers); fetched.total_followers = true; }
                if (tw?.main_games)              { prefills.main_games      = tw.main_games;              fetched.main_games      = true; }
                if (tw?.avg_viewers  != null)    { prefills.avg_viewers     = String(tw.avg_viewers);     fetched.avg_viewers     = true; }
                if (tw?.total_views  != null)    { prefills.total_views     = String(tw.total_views); }
                if (tw?.created_at)              { prefills.created_at      = tw.created_at; }
                if (tw?.is_live)                 { prefills.is_live = true; setIsLive(true); }
                setForm(prev => ({ ...prev, ...prefills }));
                setFetchedFields(fetched);
                setPageState('B');
              })
              .catch(() => {
                setForm(prev => ({ ...prev, twitch_username: user.twitch_username ?? '' }));
                setPageState('B');
              })
              .finally(() => setPrefillLoading(false));
          })
          .catch(() => {
            setForm(prev => ({ ...prev, twitch_username: user.twitch_username ?? '' }));
            setPageState('B');
            setPrefillLoading(false);
          });
      })
      .catch(() => {
        setForm(prev => ({ ...prev, twitch_username: user.twitch_username ?? '' }));
        setPageState('B');
      });
  }, [authLoading, user]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    const token = getToken();
    try {
      const r = await fetch('/api/analytics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Errore durante la generazione.");
      setSlides(parseSlides(data.analysis, user?.twitch_username ?? form.twitch_username));
      setAnalysisId(data.id ?? null);
      setPageState('C');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>
      <Helmet>
        <title>Analisi Gratuita Canale Twitch | StreaMindAI</title>
        <meta name="description" content="Ottieni un'analisi strategica gratuita del tuo canale Twitch. Roadmap 90 giorni, punteggio canale e piano settimanale personalizzato — in meno di 60 secondi." />
        <link rel="canonical" href="https://streamindai.com/prova-gratis" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(12px)', borderColor: '#1e1e1e' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: '#6b6b6b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b6b')}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4">
              <path d="M10 3L4 8l6 5" />
            </svg>
            StreaMindAI
          </Link>
          <AccountMenu user={user} loading={authLoading} onLogout={onLogout} />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* ── Loading ── */}
        {pageState === 'loading' && (
          <div className="py-24 flex justify-center">
            <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
          </div>
        )}

        {/* ── Stato A: non loggato ── */}
        {pageState === 'A' && (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-6"
                style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }} />
                Motore AI StreaMindAI &nbsp;·&nbsp; Completamente gratuito
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
                Ottieni la tua analisi gratuita del<br />
                <span style={{ color: PURPLE }}>canale Twitch</span>
              </h1>
              <p className="text-base max-w-xl mx-auto mb-8" style={{ color: '#a0a0a0' }}>
                StreaMindAI recupera automaticamente i dati dal tuo profilo Twitch e genera
                un report strategico con 12 sezioni — in meno di 60 secondi.
              </p>
              <a
                href="/api/auth/twitch?redirect_to=/prova-gratis"
                className="inline-flex items-center gap-3 font-bold text-white px-8 py-4 rounded-xl text-base transition-all duration-150"
                style={{ backgroundColor: '#9146ff', boxShadow: '0 0 32px rgba(145,70,255,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7c27eb')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#9146ff')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                </svg>
                Accedi con Twitch — è gratis
              </a>
              <p className="text-xs mt-4" style={{ color: '#4a4a4a' }}>
                Nessuna carta di credito · Solo login Twitch richiesto
              </p>
            </div>

            <BlurredPreview />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[['📊','Situazione attuale'],['🎯','Punteggio canale'],['💪','Asset strategici'],
                ['⚠️','Gap da colmare'],['🚀','Roadmap 90 giorni'],['💡','Piano settimanale']].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ backgroundColor: '#111', border: '1px solid #1e1e1e', color: '#6b6b6b' }}>
                  <span>{icon}</span> {label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Stato B: form ── */}
        {pageState === 'B' && (
          <>
            {generating ? (
              <div className="py-20 flex flex-col items-center gap-5">
                <div className="w-14 h-14 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
                <div className="text-center">
                  <p className="font-semibold mb-1">StreaMindAI sta analizzando il tuo canale…</p>
                  <p className="text-sm" style={{ color: '#6b6b6b' }}>Il motore AI sta elaborando i dati — circa 20-40 secondi</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-4"
                    style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PURPLE }} />
                    {user?.display_name ? `Ciao, ${user.display_name}!` : 'Ciao!'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
                    Completa e genera la tua analisi
                  </h1>
                  <p style={{ color: '#a0a0a0', fontSize: '15px' }}>
                    I campi con il badge <TwitchBadge /> sono stati recuperati automaticamente dal tuo profilo Twitch.
                    Puoi modificarli se necessario.
                  </p>
                </div>

                {prefillLoading && (
                  <div className="flex items-center gap-2 text-sm mb-5" style={{ color: '#6b6b6b' }}>
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#333', borderTopColor: PURPLE }} />
                    Recupero dati da Twitch...
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Sezione 1: Dati Twitch */}
                  <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Dati estratti da Twitch</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Follower totali" badge={fetchedFields.total_followers}>
                        <TextInput
                          type="number"
                          value={form.total_followers}
                          onChange={e => set('total_followers', e.target.value)}
                          placeholder="Es. 500"
                        />
                      </Field>

                      <Field label={isLive ? 'Spettatori live ora' : 'Spettatori medi per live'} badge={fetchedFields.avg_viewers}>
                        <TextInput
                          type="number"
                          value={form.avg_viewers}
                          onChange={e => set('avg_viewers', e.target.value)}
                          placeholder="Es. 30"
                        />
                        {!fetchedFields.avg_viewers && (
                          <p className="text-xs mt-1.5" style={{ color: '#4a4a4a' }}>
                            Inserisci la tua media approssimativa
                          </p>
                        )}
                      </Field>
                    </div>

                    <Field label="Giochi principali (ultimi 5)" badge={fetchedFields.main_games}>
                      <TextInput
                        value={form.main_games}
                        onChange={e => set('main_games', e.target.value)}
                        placeholder="Es. Valorant, Minecraft, GTA V"
                      />
                    </Field>
                  </div>

                  {/* Sezione 2: Dati manuali */}
                  <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Completa il profilo</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Sub attuali">
                        <TextInput
                          type="number"
                          value={form.current_subs}
                          onChange={e => set('current_subs', e.target.value)}
                          placeholder="Es. 10"
                        />
                      </Field>

                      <Field label="Ore live a settimana">
                        <SelectInput value={form.hours_per_week} onChange={e => set('hours_per_week', e.target.value)}>
                          <option value="" disabled>Seleziona...</option>
                          <option value="1-2 ore">1-2 ore</option>
                          <option value="3-5 ore">3-5 ore</option>
                          <option value="6-9 ore">6-9 ore</option>
                          <option value="10-19 ore">10-19 ore</option>
                          <option value="20+ ore">20+ ore</option>
                        </SelectInput>
                      </Field>
                    </div>

                    <Field label="Obiettivo principale">
                      <SelectInput value={form.main_goal} onChange={e => set('main_goal', e.target.value)}>
                        <option value="" disabled>Seleziona...</option>
                        <option value="Crescere i follower">Crescere i follower</option>
                        <option value="Aumentare i sub">Aumentare i sub</option>
                        <option value="Monetizzare il canale">Monetizzare il canale</option>
                        <option value="Costruire una community">Costruire una community solida</option>
                      </SelectInput>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Età media del pubblico">
                        <SelectInput value={form.audience_age} onChange={e => set('audience_age', e.target.value)}>
                          <option value="" disabled>Seleziona...</option>
                          <option value="Prevalentemente under 18">Prevalentemente under 18</option>
                          <option value="18-24 anni">18-24 anni</option>
                          <option value="25-34 anni">25-34 anni</option>
                          <option value="35+ anni">35+ anni</option>
                          <option value="Misto">Misto / Non so</option>
                        </SelectInput>
                      </Field>
                      <Field label="Lingua delle live">
                        <SelectInput value={form.language} onChange={e => set('language', e.target.value)}>
                          <option value="" disabled>Seleziona...</option>
                          <option value="Italiano">Italiano</option>
                          <option value="Inglese">Inglese</option>
                          <option value="Entrambe">Entrambe</option>
                        </SelectInput>
                      </Field>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium">Hai mai collaborato con altri streamer?</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>Host, raid condivisi, stream in duo o collab ufficiali</p>
                      </div>
                      <Toggle value={form.has_collaborated} onChange={v => set('has_collaborated', v)} />
                    </div>

                    <Field label="Principale debolezza del canale (opzionale)">
                      <TextInput
                        value={form.main_weakness}
                        onChange={e => set('main_weakness', e.target.value)}
                        placeholder="Es. Poca costanza, chat poco attiva, no social…"
                      />
                    </Field>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium">Usi i social per promuovere le live?</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>TikTok, Instagram, Twitter/X, YouTube Shorts…</p>
                      </div>
                      <Toggle value={form.has_socials} onChange={v => set('has_socials', v)} />
                    </div>

                    {form.has_socials && (
                      <Field label="Link social / Linktree (opzionale)">
                        <TextInput
                          value={form.social_links}
                          onChange={e => set('social_links', e.target.value)}
                          placeholder="Es. linktr.ee/mionome o @mionome"
                        />
                      </Field>
                    )}

                    <Field label="Orari di streaming (opzionale)">
                      <TextInput
                        value={form.stream_schedule}
                        onChange={e => set('stream_schedule', e.target.value)}
                        placeholder="Es. Venerdì e Sabato dalle 21:00"
                      />
                    </Field>
                  </div>

                  {error && (
                    <p className="text-sm px-4 py-3 rounded-lg border"
                      style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-150"
                    style={{ backgroundColor: PURPLE, boxShadow: '0 0 24px rgba(139,92,246,0.3)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
                  >
                    Genera la mia analisi →
                  </button>
                  <p className="text-center text-xs" style={{ color: '#4a4a4a' }}>
                    Analisi generata da StreaMindAI · Un'analisi per account
                  </p>
                </form>
              </>
            )}
          </>
        )}

        {/* ── Stato C: risultati + banner upgrade ── */}
        {pageState === 'C' && slides && (
          <>
            <SlideShow slides={slides} username={user?.twitch_username ?? ''} analysisId={analysisId} />

            <div className="mt-8 rounded-2xl border p-8 text-center"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))', borderColor: 'rgba(139,92,246,0.25)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: PURPLE }}>
                Porta la tua crescita al livello successivo
              </p>
              <h2 className="text-xl font-extrabold mb-3">StreaMindAI lavora per te ogni sera</h2>
              <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: '#a0a0a0' }}>
                Il bot AI risponde alla tua chat in tempo reale, ricorda gli utenti abituali e ottimizza
                il coinvolgimento automaticamente. L'analisi si rigenera ogni mese con i tuoi dati aggiornati.
              </p>
              <Link to="/subscription"
                className="inline-flex items-center gap-2 font-bold text-white px-7 py-3.5 rounded-xl text-sm transition-all duration-150"
                style={{ backgroundColor: PURPLE }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = PURPLE)}
              >
                Inizia la prova gratuita 7 giorni →
              </Link>
              <p className="text-xs mt-3" style={{ color: '#4a4a4a' }}>Annulla quando vuoi · Nessun addebito oggi</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

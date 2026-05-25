import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import AccountMenu from '../components/AccountMenu.jsx';
import SlideShow, { parseSlides } from '../components/SlideShow.jsx';

const PURPLE = '#8B5CF6';

// ─── Dati form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  email: '', twitch_username: '',
  avg_viewers: '', hours_per_month: '', total_followers: '',
  monthly_follower_growth: '', current_subs: '',
  main_games: '', stream_schedule: '', social_links: '',
};

const NUM_FIELDS = [
  { key: 'avg_viewers',             label: 'Spettatori medi per live',  placeholder: 'Es. 50' },
  { key: 'hours_per_month',         label: 'Ore stremate al mese',       placeholder: 'Es. 40' },
  { key: 'total_followers',         label: 'Follower totali',            placeholder: 'Es. 500' },
  { key: 'monthly_follower_growth', label: 'Crescita follower mensile',  placeholder: 'Es. 30' },
  { key: 'current_subs',            label: 'Sub attuali',               placeholder: 'Es. 10' },
];

const TEXT_FIELDS = [
  { key: 'main_games',      label: 'Giochi principali', placeholder: 'Es. Valorant, Minecraft, GTA V' },
  { key: 'stream_schedule', label: 'Orari delle live',  placeholder: 'Es. Venerdì e Sabato dalle 21:00' },
  { key: 'social_links',    label: 'Social / Link',     placeholder: 'Es. Instagram @gcernu, YouTube youtube.com/@gcernu' },
];

const MAX_NUM     = 9_999_999;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const DANGEROUS   = /<[^>]*>|javascript:|on\w+=/i;

function validate(form) {
  const errors = {};
  if (!form.email.trim())                     errors.email = "L'email è obbligatoria.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Inserisci un'email valida.";
  if (form.twitch_username.trim()) {
    if (!USERNAME_RE.test(form.twitch_username.trim()))       errors.twitch_username = 'Solo lettere, numeri e underscore.';
    else if (form.twitch_username.trim().length > 25)         errors.twitch_username = 'Massimo 25 caratteri.';
  }
  for (const f of NUM_FIELDS) {
    const raw = form[f.key];
    if (raw !== '') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) errors[f.key] = 'Solo numeri interi positivi.';
      else if (n > MAX_NUM)              errors[f.key] = `Massimo ${MAX_NUM.toLocaleString('it-IT')}.`;
    }
  }
  for (const f of TEXT_FIELDS) {
    if (form[f.key].trim() && DANGEROUS.test(form[f.key])) errors[f.key] = 'Caratteri non consentiti.';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

function FocusInput({ type = 'text', value, onChange, placeholder, required, error }) {
  const BASE = { width: '100%', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#0d0d0d', color: '#f0f0f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' };
  return (
    <>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        style={{ ...BASE, border: `1px solid ${error ? '#f87171' : '#2a2a2a'}` }}
        onFocus={e  => (e.target.style.borderColor = error ? '#f87171' : PURPLE)}
        onBlur={e   => (e.target.style.borderColor = error ? '#f87171' : '#2a2a2a')}
      />
      {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
    </>
  );
}

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function AnalisiPage({ user, loading: authLoading, onLogout }) {
  const [form, setForm]               = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [slides, setSlides]           = useState(null);
  const [analysisId, setAnalysisId]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(p => ({ ...p, [k]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors } = validate(form);
    if (!isValid) { setFieldErrors(errors); return; }
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSlides(null);
    setAnalysisId(null);
    try {
      const r = await axios.post('/api/analytics/analyze', form, { timeout: 45_000 });
      setSlides(parseSlides(r.data.analysis, form.twitch_username));
      setAnalysisId(r.data.id ?? null);
    } catch (err) {
      setError(err.response?.data?.error ?? "Errore durante l'analisi. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setSlides(null); setAnalysisId(null); setForm(EMPTY_FORM); setError(null); };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0d0d0d', color: '#f0f0f0' }}>

      <Helmet>
        <title>Analisi Gratuita del tuo Canale Twitch | StreaMindAI</title>
        <meta name="description" content="Scopri i punti di forza del tuo canale Twitch con un'analisi AI gratuita. Piano editoriale personalizzato, proiezione crescita e consigli pratici per streamer italiani." />
        <link rel="canonical" href="https://streamindai.com/analisi" />
        <meta property="og:title" content="Analisi Gratuita del tuo Canale Twitch | StreaMindAI" />
        <meta property="og:description" content="Analisi AI gratuita per il tuo canale Twitch. Piano editoriale personalizzato, crescita follower e consigli strategici in pochi secondi." />
        <meta property="og:url" content="https://streamindai.com/analisi" />
      </Helmet>

      {/* ── Header ── */}
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

        {/* ── Hero ── */}
        {!slides && !loading && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border mb-6"
              style={{ borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.08)', color: PURPLE }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PURPLE }} />
              Motore AI StreaMindAI &nbsp;·&nbsp; Completamente gratuito
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
              Analisi gratuita del tuo<br />
              <span style={{ color: PURPLE }}>canale Twitch</span>
            </h1>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#a0a0a0' }}>
              Inserisci i dati del tuo canale e StreaMindAI genera una presentazione strategica personalizzata —
              punti di forza, aree di crescita, giochi consigliati e un piano d'azione in 90 giorni.
            </p>
          </div>
        )}

        {/* ── Form ── */}
        {!slides && !loading && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border p-6 sm:p-8 space-y-5" style={{ backgroundColor: '#111', borderColor: '#222' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#4a4a4a' }}>Dati canale</p>

              <div>
                <label className="block text-sm font-medium mb-1">Email <span style={{ color: PURPLE }}>*</span></label>
                <p className="text-xs mb-2" style={{ color: '#6b6b6b' }}>Riceverai l'analisi anche via email.</p>
                <FocusInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="la-tua@email.com" required error={fieldErrors.email} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username Twitch <span className="text-xs" style={{ color: '#6b6b6b' }}>(max 25 caratteri)</span></label>
                <FocusInput value={form.twitch_username} onChange={e => set('twitch_username', e.target.value)} placeholder="gcernu" error={fieldErrors.twitch_username} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {NUM_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-1">{f.label}</label>
                    <FocusInput type="number" value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} error={fieldErrors[f.key]} />
                  </div>
                ))}
              </div>

              {TEXT_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <FocusInput value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} error={fieldErrors[f.key]} />
                </div>
              ))}
            </div>

            {error && (
              <p className="text-sm px-4 py-3 rounded-lg border" style={{ color: '#f87171', backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
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
              Analizza il mio canale →
            </button>
            <p className="text-center text-xs" style={{ color: '#4a4a4a' }}>
              Analisi generata da StreaMindAI &nbsp;·&nbsp; Ogni email/canale può essere analizzato una sola volta
            </p>
          </form>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full border-2 animate-spin" style={{ borderColor: '#262626', borderTopColor: PURPLE }} />
            <div className="text-center">
              <p className="font-semibold mb-1">StreaMindAI sta analizzando il tuo canale…</p>
              <p className="text-sm" style={{ color: '#6b6b6b' }}>Il motore AI sta elaborando i dati — circa 15-30 secondi</p>
            </div>
          </div>
        )}

        {/* ── Slideshow risultato ── */}
        {slides && (
          <SlideShow
            slides={slides}
            username={form.twitch_username}
            analysisId={analysisId}
            onReset={resetForm}
          />
        )}
      </div>
    </div>
  );
}

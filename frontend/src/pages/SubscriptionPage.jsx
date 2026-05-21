import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth.js';

// ─── Piani ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Bot presente in chat',
      'Showstarter automatico al go-live',
      'Comando !lurk integrato',
      'Messaggi evento base (follow, sub, gift, cheer, raid)',
      'Nessuna risposta AI',
      'Nessun limite di tempo',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9,
    features: [
      'Bot AI base con personalità configurabile',
      'Max 5 membri configurabili',
      'Messaggi automatici per tutti gli eventi (follow, sub, gift, cheer, raid)',
      'Limiti messaggi per utente configurabili',
      'Max 200 messaggi/sera sul canale',
      '4.000 messaggi/mese',
      'Trial 7 giorni con carta',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 19,
    features: [
      'Bot AI completamente personalizzato',
      'Membri illimitati',
      'Song request Spotify (!sr)',
      'Memoria base (apprendimento automatico)',
      'Tutti gli eventi automatici (follow, sub, gift, bit, hype train, raid)',
      'Discord: notifiche live e video',
      'Comandi custom configurabili',
      'Max 600 messaggi/sera sul canale',
      '12.000 messaggi/mese',
      'Trial 7 giorni con carta',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 35,
    highlight: true,
    badge: 'Più popolare',
    features: [
      'Tutto di Creator',
      'Analytics canale mensile',
      'Memoria avanzata con contesto di gioco',
      'Messaggi eventi completamente personalizzabili',
      'Max 1.200 messaggi/sera sul canale',
      '24.000 messaggi/mese',
      'Trial 7 giorni con carta',
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    price: 85,
    features: [
      'Tutto di Elite',
      'Onboarding 1:1 con gCernu',
      'Supporto diretto',
      'Setup completamente personalizzato',
      'Max 3.000 messaggi/sera sul canale',
      '60.000 messaggi/mese',
      'Nessun trial — contatto diretto prima dell\'attivazione',
    ],
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
    <path d="M2.5 8.5l4 4 7-8" />
  </svg>
);

const IconExternal = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M7 3H3.5A.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V9M9 2h5v5M8 8l5.5-5.5" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_VARIANTS = {
  active:     { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.25)',  color: '#4ade80', dot: '#4ade80', label: 'Attivo' },
  trialing:   { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)', color: '#8B5CF6', dot: '#8B5CF6', label: 'Trial attivo' },
  cancelling: { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  color: '#fbbf24', dot: '#fbbf24', label: 'In scadenza' },
  past_due:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', color: '#f87171', dot: '#f87171', label: 'Pagamento scaduto' },
  inactive:   { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', color: '#9ca3af', dot: '#9ca3af', label: 'Inattivo' },
};

function StatusBadge({ status }) {
  const v = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.inactive;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ backgroundColor: v.bg, borderColor: v.border, color: v.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: v.dot }} />
      {v.label}
    </span>
  );
}

// ─── Modal contatto Signature ─────────────────────────────────────────────────
function SignatureContactModal({ onClose }) {
  const [form, setForm]   = useState({ nome: '', twitch_username: '', piano: 'Signature', motivo: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errMsg, setErrMsg] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.twitch_username.trim() || !form.motivo.trim()) return;
    setStatus('sending');
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Errore');
      setStatus('sent');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-hally-bg-card border border-hally-border rounded-xl p-7 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-hally-text">Contattaci per Signature</h3>
            <p className="text-xs text-hally-text-muted mt-0.5">Ti risponderemo entro 24 ore su support@streamindai.com</p>
          </div>
          <button onClick={onClose} className="text-hally-text-muted hover:text-hally-text transition-colors ml-4 shrink-0">
            <IconClose />
          </button>
        </div>

        {status === 'sent' ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="font-semibold text-hally-text mb-1">Messaggio inviato!</p>
            <p className="text-sm text-hally-text-muted">Ti contatteremo entro 24 ore.</p>
            <button onClick={onClose} className="btn-secondary mt-6 text-sm">Chiudi</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-hally-text-muted mb-1.5">Nome *</label>
              <input
                className="input w-full"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Il tuo nome"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hally-text-muted mb-1.5">Username Twitch *</label>
              <input
                className="input w-full"
                value={form.twitch_username}
                onChange={e => set('twitch_username', e.target.value)}
                placeholder="@username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hally-text-muted mb-1.5">Piano di interesse</label>
              <select
                className="input w-full"
                value={form.piano}
                onChange={e => set('piano', e.target.value)}
              >
                <option value="Signature">Signature — 85€/mese</option>
                <option value="Elite">Elite — 35€/mese</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-hally-text-muted mb-1.5">Motivo di interesse *</label>
              <textarea
                className="input w-full min-h-[96px] resize-y"
                value={form.motivo}
                onChange={e => set('motivo', e.target.value)}
                placeholder="Raccontaci brevemente il tuo canale e cosa cerchi…"
                required
              />
            </div>
            {status === 'error' && (
              <p className="text-xs text-red-400">{errMsg}</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors duration-150 disabled:opacity-60"
                style={{ backgroundColor: '#8B5CF6' }}
                onMouseEnter={e => { if (status !== 'sending') e.currentTarget.style.backgroundColor = '#7C3AED'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
              >
                {status === 'sending' ? 'Invio…' : 'Invia richiesta'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm">
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Modal conferma cancellazione ─────────────────────────────────────────────
function CancelModal({ onConfirm, onClose, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-hally-bg-card border border-hally-border rounded-xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold">Cancellare l'abbonamento?</h3>
          <button onClick={onClose} className="text-hally-text-muted hover:text-hally-text transition-colors">
            <IconClose />
          </button>
        </div>
        <p className="text-sm text-hally-text-muted mb-5 leading-relaxed">
          StreaMindAI rimarrà attiva fino alla fine del periodo corrente. Non verranno effettuati ulteriori addebiti.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            {loading ? 'Cancellazione…' : 'Sì, cancella'}
          </button>
          <button onClick={onClose} className="flex-1 btn-secondary text-sm">
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const [sub, setSub]           = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [invLoading, setInvLoading] = useState(true);
  const [checkingOut, setCheckingOut]             = useState(null);
  const [checkingOutPayPal, setCheckingOutPayPal] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancel, setShowCancel]     = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [tokenPackLoading, setTokenPackLoading] = useState(false);
  const [tokenPackBanner, setTokenPackBanner]   = useState(null); // 'success'|'cancelled'|null
  const [referral, setReferral]                 = useState(null);
  const [refCopied, setRefCopied]               = useState(false);

  const headers = () => ({ Authorization: `Bearer ${getToken()}` });

  useEffect(() => {
    // Gestisce feedback post-checkout Token Pack
    const params = new URLSearchParams(window.location.search);
    const tp = params.get('token_pack');
    if (tp) {
      setTokenPackBanner(tp);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setTokenPackBanner(null), 6000);
    }
  }, []);

  useEffect(() => {
    axios.get('/api/subscription', { headers: headers() })
      .then(r => setSub(r.data))
      .catch(() => setSub({ status: 'inactive', plan: null }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get('/api/subscription/invoices', { headers: headers() })
      .then(r => setInvoices(r.data.invoices ?? []))
      .catch(() => setInvoices([]))
      .finally(() => setInvLoading(false));
  }, [sub?.status]);

  useEffect(() => {
    axios.get('/api/referral', { headers: headers() })
      .then(r => setReferral(r.data))
      .catch(() => {});
  }, []);

  const handleCheckout = async (planId, paypal = false) => {
    paypal ? setCheckingOutPayPal(planId) : setCheckingOut(planId);
    try {
      const r = await axios.post('/api/subscription/checkout', { plan: planId, paypal }, { headers: headers() });
      if (r.data.checkout_url) window.location.href = r.data.checkout_url;
      else alert(r.data.error ?? 'Pagamenti non ancora configurati.');
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      paypal ? setCheckingOutPayPal(null) : setCheckingOut(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const r = await axios.post('/api/subscription/portal', {}, { headers: headers() });
      if (r.data.portal_url) window.location.href = r.data.portal_url;
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleTokenPack = async () => {
    setTokenPackLoading(true);
    try {
      const r = await axios.post('/api/subscription/token-pack', {}, { headers: headers() });
      if (r.data.checkout_url) window.location.href = r.data.checkout_url;
      else alert(r.data.error ?? 'Errore imprevisto.');
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      setTokenPackLoading(false);
    }
  };

  const handleCopyRef = () => {
    if (!referral?.link) return;
    navigator.clipboard.writeText(referral.link).then(() => {
      setRefCopied(true);
      setTimeout(() => setRefCopied(false), 2000);
    });
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await axios.post('/api/subscription/cancel', {}, { headers: headers() });
      setSub(prev => ({ ...prev, status: 'cancelling' }));
      setShowCancel(false);
    } catch (err) {
      alert(err.response?.data?.error ?? 'Errore imprevisto.');
    } finally {
      setCancelling(false);
    }
  };

  const isActive  = ['active', 'trialing', 'cancelling', 'past_due'].includes(sub?.status);
  const isTrialing = sub?.status === 'trialing';
  const currentPlan = PLANS.find(p => p.id === sub?.plan);

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  const fmtShort = (iso) =>
    new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

  const extraTokens = sub?.extra_tokens ?? { count: 0, expiry: null };
  const hasExtra = extraTokens.count > 0 && extraTokens.expiry != null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Abbonamento</h1>
        <p className="text-hally-text-muted text-sm">Gestisci il tuo piano StreaMindAI e la fatturazione.</p>
      </div>

      {/* ── Piano attuale ── */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Piano attuale</h2>
        {loading ? (
          <p className="text-hally-text-muted text-sm">Caricamento…</p>
        ) : isActive ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <StatusBadge status={sub.status} />
                <span className="font-bold text-lg capitalize">{sub.plan}</span>
                {currentPlan && (
                  <span className="text-hally-text-muted text-sm">— {currentPlan.price}€/mese</span>
                )}
              </div>
              {sub.subscription_end && (
                <p className="text-xs text-hally-text-muted">
                  {isTrialing   ? 'Trial attivo — primo addebito il'
                  : sub.status === 'cancelling' ? 'Attivo fino al'
                  : 'Prossimo rinnovo il'}{' '}
                  <span className="text-hally-text font-medium">{fmt(sub.subscription_end)}</span>
                </p>
              )}
              {isTrialing && (
                <p className="text-xs mt-0.5" style={{ color: '#8B5CF6' }}>
                  Puoi cancellare prima della scadenza senza costi.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                {portalLoading ? 'Caricamento…' : 'Gestisci piano'}
                {!portalLoading && <IconExternal />}
              </button>
              {sub.status !== 'cancelling' && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1.5"
                >
                  Cancella abbonamento
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status="inactive" />
            <p className="text-hally-text-muted text-sm">
              Scegli un piano qui sotto per attivare StreaMindAI sul tuo canale.
            </p>
          </div>
        )}
      </div>

      {/* ── Piani ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-10">
        {PLANS.map(plan => {
          const isCurrent    = sub?.plan === plan.id && isActive;
          const isCurrentFree = plan.id === 'free' && !isActive;
          return (
            <div
              key={plan.id}
              className="card flex flex-col relative pt-6"
              style={plan.highlight
                ? { borderColor: '#8B5CF6', boxShadow: '0 0 0 1px rgba(139,92,246,0.2), 0 4px 24px rgba(139,92,246,0.08)' }
                : {}
              }
            >
              {/* Badge "Più popolare" */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap"
                  style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Badge piano attuale */}
              {isCurrent && (
                <div
                  className="self-start text-xs font-semibold px-3 py-1 rounded-full border mb-3"
                  style={{ backgroundColor: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.35)', color: '#8B5CF6' }}
                >
                  Piano attuale
                </div>
              )}

              <div className="font-bold text-lg mb-1">{plan.name}</div>
              <div className="mb-5">
                {plan.price === 0 ? (
                  <span className="text-3xl font-extrabold" style={{ color: '#8B5CF6' }}>Gratis</span>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold" style={{ color: '#8B5CF6' }}>{plan.price}€</span>
                    <span className="text-hally-text-muted text-sm">/mese</span>
                  </>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0" style={{ color: '#8B5CF6' }}><IconCheck /></span>
                    <span className="text-hally-text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              {(isCurrent || isCurrentFree) ? (
                <button disabled className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed">
                  Piano attuale
                </button>
              ) : plan.id === 'free' ? (
                <button disabled className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed">
                  Già incluso
                </button>
              ) : plan.id === 'signature' ? (
                <button
                  onClick={() => setShowContact(true)}
                  className="w-full text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 btn-secondary"
                >
                  Contattaci
                </button>
              ) : plan.highlight ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={!!checkingOut || !!checkingOutPayPal}
                    className="w-full text-sm font-semibold py-2.5 rounded-lg transition-colors duration-150 disabled:opacity-60 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                  >
                    {checkingOut === plan.id ? 'Reindirizzamento…' : `Inizia Trial — ${plan.name}`}
                  </button>
                  <p className="text-center text-xs text-hally-text-muted">7 giorni gratis · carta richiesta</p>
                  <button
                    onClick={() => handleCheckout(plan.id, true)}
                    disabled={!!checkingOut || !!checkingOutPayPal}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg border transition-colors duration-150 disabled:opacity-60"
                    style={{ borderColor: '#1e3a5f', backgroundColor: '#003087', color: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#002a75'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#003087'; }}
                  >
                    {checkingOutPayPal === plan.id ? 'Reindirizzamento…' : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.379 2.909.86 5.679-1.496 7.332-1.975 1.388-4.886 1.644-7.497 1.644H9.952l-1.12 7.107H14.1c.524 0 .968-.382 1.05-.9l.044-.277.87-5.507.056-.304c.082-.518.526-.9 1.05-.9h.662c4.3 0 7.664-1.748 8.648-6.797.412-2.117.2-3.885-.908-5.057z"/></svg>
                        PayPal — senza trial
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={!!checkingOut || !!checkingOutPayPal}
                    className="btn-secondary w-full text-sm font-semibold disabled:opacity-60"
                  >
                    {checkingOut === plan.id ? 'Reindirizzamento…' : `Inizia Trial — ${plan.name}`}
                  </button>
                  <p className="text-center text-xs text-hally-text-muted">7 giorni gratis · carta richiesta</p>
                  <button
                    onClick={() => handleCheckout(plan.id, true)}
                    disabled={!!checkingOut || !!checkingOutPayPal}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg border transition-colors duration-150 disabled:opacity-60"
                    style={{ borderColor: '#1e3a5f', backgroundColor: '#003087', color: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#002a75'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#003087'; }}
                  >
                    {checkingOutPayPal === plan.id ? 'Reindirizzamento…' : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.379 2.909.86 5.679-1.496 7.332-1.975 1.388-4.886 1.644-7.497 1.644H9.952l-1.12 7.107H14.1c.524 0 .968-.382 1.05-.9l.044-.277.87-5.507.056-.304c.082-.518.526-.9 1.05-.9h.662c4.3 0 7.664-1.748 8.648-6.797.412-2.117.2-3.885-.908-5.057z"/></svg>
                        PayPal — senza trial
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Token Pack banner ── */}
      {tokenPackBanner === 'success' && (
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-4 mb-6 border"
          style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }}
        >
          <span className="text-green-400 text-xl shrink-0">✓</span>
          <div>
            <p className="text-sm font-semibold text-hally-text">Token Pack acquistato!</p>
            <p className="text-xs text-hally-text-muted mt-0.5">5.000 messaggi extra sono stati aggiunti al tuo account. Validi 30 giorni.</p>
          </div>
        </div>
      )}
      {tokenPackBanner === 'cancelled' && (
        <div
          className="flex items-center gap-3 rounded-xl px-5 py-4 mb-6 border"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <span className="text-red-400 text-sm font-medium">Acquisto annullato.</span>
        </div>
      )}

      {/* ── Token aggiuntivi ── */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold">Token aggiuntivi</h2>
            <p className="text-xs text-hally-text-muted mt-0.5">Messaggi extra oltre il limite mensile del tuo piano</p>
          </div>
          {hasExtra && (
            <div
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
              style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: '#8B5CF6' }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#8B5CF6' }} />
              {extraTokens.count.toLocaleString('it-IT')} disponibili
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Card pacchetto */}
          <div
            className="flex-1 rounded-xl border p-5 flex flex-col gap-4"
            style={{ backgroundColor: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.2)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-hally-text">5.000 messaggi extra</p>
                <p className="text-xs text-hally-text-muted mt-0.5">Validi 30 giorni dall'acquisto</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-extrabold" style={{ color: '#8B5CF6' }}>6€</span>
                <p className="text-xs text-hally-text-muted">una tantum</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-hally-text-muted">
              <li className="flex items-center gap-2"><span style={{ color: '#8B5CF6' }}><IconCheck /></span>Attivi subito dopo il pagamento</li>
              <li className="flex items-center gap-2"><span style={{ color: '#8B5CF6' }}><IconCheck /></span>Si sommano ai token già disponibili</li>
              <li className="flex items-center gap-2"><span style={{ color: '#8B5CF6' }}><IconCheck /></span>Usati solo quando il piano è esaurito</li>
            </ul>
            <button
              onClick={handleTokenPack}
              disabled={tokenPackLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors duration-150 disabled:opacity-60"
              style={{ backgroundColor: '#8B5CF6' }}
              onMouseEnter={e => { if (!tokenPackLoading) e.currentTarget.style.backgroundColor = '#7C3AED'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#8B5CF6'; }}
            >
              {tokenPackLoading ? 'Reindirizzamento…' : 'Acquista — 6€'}
            </button>
          </div>

          {/* Stato token correnti */}
          {hasExtra ? (
            <div
              className="sm:w-52 rounded-xl border p-5 flex flex-col justify-center gap-2"
              style={{ backgroundColor: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.18)' }}
            >
              <p className="text-xs font-medium text-hally-text-muted uppercase tracking-wider">Token attivi</p>
              <p className="text-3xl font-extrabold text-hally-text">{extraTokens.count.toLocaleString('it-IT')}</p>
              <p className="text-xs text-hally-text-muted">
                Scadono il <span className="font-medium text-hally-text">{fmtShort(extraTokens.expiry)}</span>
              </p>
            </div>
          ) : (
            <div
              className="sm:w-52 rounded-xl border p-5 flex flex-col justify-center gap-2"
              style={{ backgroundColor: '#111', borderColor: '#1e1e1e' }}
            >
              <p className="text-xs font-medium text-hally-text-muted uppercase tracking-wider">Token attivi</p>
              <p className="text-2xl font-bold text-hally-text-muted">—</p>
              <p className="text-xs text-hally-text-muted">Nessun token extra disponibile</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Porta un amico ── */}
      <div className="card mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-semibold">Porta un amico</h2>
            <p className="text-xs text-hally-text-muted mt-0.5">Condividi il tuo link e guadagna sconti</p>
          </div>
          {referral?.active_referrals > 0 && (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0"
              style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)', color: '#4ade80' }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#4ade80' }} />
              {referral.active_referrals} {referral.active_referrals === 1 ? 'amico' : 'amici'} attivati
            </div>
          )}
        </div>

        <p className="text-sm text-hally-text-muted mb-5 leading-relaxed">
          Porta un amico su StreaMindAI e ottieni il{' '}
          <span className="font-semibold text-hally-text">15% di sconto</span> sul tuo prossimo rinnovo.
          Il tuo amico riceve{' '}
          <span className="font-semibold text-hally-text">14 giorni di trial gratuito</span> invece di 7.
          Il bonus si attiva solo quando il tuo amico sottoscrive un piano.
        </p>

        {referral?.link ? (
          <div className="flex gap-2">
            <div
              className="flex-1 px-3 py-2.5 rounded-lg border text-sm font-mono truncate select-all"
              style={{ backgroundColor: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.2)', color: '#8B5CF6' }}
            >
              {referral.link}
            </div>
            <button
              onClick={handleCopyRef}
              className="btn-secondary text-sm px-4 whitespace-nowrap shrink-0 transition-colors"
              style={refCopied ? { color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' } : {}}
            >
              {refCopied ? '✓ Copiato' : 'Copia link'}
            </button>
          </div>
        ) : (
          <div className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: '#1a1a1a' }} />
        )}
      </div>

      {/* ── Storico fatture ── */}
      <div className="card">
        <h2 className="font-semibold mb-4">Storico fatture</h2>
        {invLoading ? (
          <p className="text-hally-text-muted text-sm">Caricamento fatture…</p>
        ) : invoices.length === 0 ? (
          <p className="text-hally-text-muted text-sm">Nessuna fattura ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hally-border">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Fattura</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Data</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Importo</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-hally-text-muted">Stato</th>
                  <th className="px-3 py-2.5 w-14" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hally-border">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-hally-bg-hover transition-colors">
                    <td className="px-3 py-3 font-mono text-xs text-hally-text-muted">{inv.number ?? inv.id.slice(0, 12)}</td>
                    <td className="px-3 py-3 text-hally-text-muted text-xs whitespace-nowrap">
                      {fmt(inv.created)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-hally-text">
                      {inv.amount.toFixed(2)}{inv.currency === 'eur' ? '€' : ` ${inv.currency.toUpperCase()}`}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        inv.status === 'paid'
                          ? 'bg-green-900/30 text-green-400 border-green-800'
                          : inv.status === 'open'
                          ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                          : 'bg-zinc-800 text-hally-text-muted border-hally-border'
                      }`}>
                        {inv.status === 'paid' ? 'Pagata' : inv.status === 'open' ? 'In attesa' : inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-hally-text-muted hover:text-hally-text transition-colors"
                        >
                          PDF <IconExternal />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal cancellazione ── */}
      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={cancelling}
        />
      )}

      {/* ── Modal contatto Signature ── */}
      {showContact && <SignatureContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}

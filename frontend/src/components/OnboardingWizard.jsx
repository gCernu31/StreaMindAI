import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth.js';

export default function OnboardingWizard({ initialStep = 0, onComplete }) {
  const navigate = useNavigate();
  const [step, setStep]     = useState(initialStep);
  const [saving, setSaving] = useState(false);

  // Step 1 — Identità
  const [botName, setBotName]               = useState('');
  const [creatorName, setCreatorName]       = useState('');
  const [botPersonality, setBotPersonality] = useState('');

  // Step 2 — Primo membro
  const [memberUsername, setMemberUsername]         = useState('');
  const [memberNickname, setMemberNickname]         = useState('');
  const [memberRelationship, setMemberRelationship] = useState('');

  const token = getToken();
  const jsonHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const authHeader  = { Authorization: `Bearer ${token}` };

  function saveProgress(newStep) {
    fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ step: newStep }),
    }).catch(() => {});
  }

  function handleStart() {
    saveProgress(1);
    setStep(1);
  }

  async function handleSaveIdentity() {
    if (!botName.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
          bot_name:        botName.trim(),
          creator_name:    creatorName.trim()    || undefined,
          bot_personality: botPersonality.trim() || undefined,
        }),
      });
      saveProgress(2);
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember() {
    if (!memberUsername.trim()) return;
    setSaving(true);
    try {
      const r   = await fetch('/api/config', { headers: authHeader });
      const cfg = r.ok ? await r.json() : {};
      const members = [...(cfg.members ?? []), {
        username:      memberUsername.trim(),
        nickname:      memberNickname.trim() || memberUsername.trim(),
        how_to_behave: memberRelationship.trim(),
      }];
      await fetch('/api/config', {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ members }),
      });
      saveProgress(3);
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  function handleSkipMember() {
    saveProgress(3);
    setStep(3);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await fetch('/api/onboarding/complete', { method: 'POST', headers: jsonHeaders });
      onComplete();
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  }

  const displayBotName = botName.trim().toLowerCase() || 'nomebot';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-8"
        style={{ backgroundColor: '#111', borderColor: '#262626', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
      >
        {/* Barra di progresso */}
        {step < 3 && (
          <div className="flex items-center gap-2 mb-8">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-1.5 rounded-full flex-1 transition-all duration-500"
                style={{ backgroundColor: i < step ? '#8B5CF6' : i === step ? 'rgba(139,92,246,0.5)' : '#2a2a2a' }}
              />
            ))}
          </div>
        )}

        {/* ─── STEP 0: Benvenuto ─────────────────────────────────── */}
        {step === 0 && (
          <div className="text-center">
            <div className="text-5xl mb-5">🎉</div>
            <h2 className="text-2xl font-bold text-hally-text mb-3">Benvenuta su StreaMindAI!</h2>
            <p className="text-sm text-hally-text-muted mb-8">
              In 3 passi configuriamo la tua AI personalizzata
            </p>
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 font-bold text-white px-8 py-3 rounded-xl text-sm transition-all duration-150"
              style={{ backgroundColor: '#8B5CF6' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
            >
              Iniziamo →
            </button>
          </div>
        )}

        {/* ─── STEP 1: Identità del Bot ──────────────────────────── */}
        {step === 1 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B5CF6' }}>
              Passo 1 di 3
            </p>
            <h2 className="text-xl font-bold text-hally-text mb-6">Identità del tuo bot</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">
                  Nome del tuo bot <span style={{ color: '#8B5CF6' }}>*</span>
                </label>
                <input
                  value={botName}
                  onChange={e => setBotName(e.target.value)}
                  placeholder="es. Luna, Max, Aria"
                  className="w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">
                  Come ti chiama
                </label>
                <input
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                  placeholder="es. Capo, Boss, il mio Signore"
                  className="w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">
                  Personalità base
                </label>
                <textarea
                  value={botPersonality}
                  onChange={e => setBotPersonality(e.target.value)}
                  rows={3}
                  placeholder="es. Sei un bot sarcastico e divertente che ama i giochi di ruolo. Rispondi sempre con un tocco di ironia e usi spesso riferimenti a fantasy."
                  className="w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 resize-none transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSaveIdentity}
              disabled={!botName.trim() || saving}
              className="mt-6 w-full font-bold text-white py-3 rounded-xl text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#8B5CF6' }}
              onMouseEnter={e => { if (!saving && botName.trim()) e.currentTarget.style.backgroundColor = '#7C3AED'; }}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
            >
              {saving ? 'Salvataggio...' : 'Avanti →'}
            </button>
          </div>
        )}

        {/* ─── STEP 2: Primo Membro ──────────────────────────────── */}
        {step === 2 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B5CF6' }}>
              Passo 2 di 3
            </p>
            <h2 className="text-xl font-bold text-hally-text mb-2">Primo membro della community</h2>
            <p className="text-sm text-hally-text-muted mb-6">
              Aggiungi qualcuno che il bot dovrà riconoscere e trattare in modo speciale.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">
                  Username Twitch
                </label>
                <input
                  value={memberUsername}
                  onChange={e => setMemberUsername(e.target.value)}
                  placeholder="es. xXGamer99Xx"
                  className="w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">
                  Soprannome
                </label>
                <input
                  value={memberNickname}
                  onChange={e => setMemberNickname(e.target.value)}
                  placeholder="es. il miglior mod, il caos incarnato"
                  className="w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">
                  Come si comporta con lui
                </label>
                <textarea
                  value={memberRelationship}
                  onChange={e => setMemberRelationship(e.target.value)}
                  rows={2}
                  placeholder="es. È il moderatore storico del canale, trattalo con rispetto e scherzaci su con ironia bonaria"
                  className="w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 resize-none transition-colors"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { saveProgress(1); setStep(1); }}
                disabled={saving}
                className="px-4 py-3 rounded-xl text-sm font-medium border transition-colors duration-150 shrink-0"
                style={{ borderColor: '#2a2a2a', color: '#6b6b6b' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#6b6b6b'; }}
              >
                ← Indietro
              </button>
              <button
                onClick={handleAddMember}
                disabled={!memberUsername.trim() || saving}
                className="flex-1 font-bold text-white py-3 rounded-xl text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#8B5CF6' }}
                onMouseEnter={e => { if (!saving && memberUsername.trim()) e.currentTarget.style.backgroundColor = '#7C3AED'; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
              >
                {saving ? 'Salvataggio...' : 'Aggiungi'}
              </button>
              <button
                onClick={handleSkipMember}
                className="px-5 py-3 rounded-xl text-sm font-medium border transition-colors duration-150"
                style={{ borderColor: '#2a2a2a', color: '#6b6b6b' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#6b6b6b'; }}
              >
                Salta
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Completato ────────────────────────────────── */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-6xl mb-5" style={{ animation: 'bounce 1s infinite' }}>🎊</div>
            <h2 className="text-2xl font-bold text-hally-text mb-3">La tua AI è pronta!</h2>
            <p className="text-sm text-hally-text-muted mb-5">
              Usa questo comando in chat per interagire con il bot:
            </p>
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border mb-8 font-mono text-sm"
              style={{
                backgroundColor: 'rgba(139,92,246,0.1)',
                borderColor:     'rgba(139,92,246,0.3)',
                color:           '#a78bfa',
              }}
            >
              !{displayBotName} [domanda]
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex items-center gap-2 font-bold text-white px-8 py-3 rounded-xl text-sm transition-all duration-150 disabled:opacity-40"
                style={{ backgroundColor: '#8B5CF6' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7C3AED'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#8B5CF6'}
              >
                {saving ? 'Caricamento...' : 'Apri Dashboard →'}
              </button>
              <button
                onClick={() => { saveProgress(2); setStep(2); }}
                disabled={saving}
                className="text-xs font-medium transition-colors"
                style={{ color: '#6b6b6b', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a0a0a0'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b6b6b'}
              >
                ← Torna al passo precedente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

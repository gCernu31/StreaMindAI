import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../utils/auth.js';

const TABS = ['Comandi', 'Template', 'Annunci', 'Contatori', 'Emote'];

const CARD  = { backgroundColor: '#111', border: '1px solid #262626', borderRadius: '12px', padding: '20px' };
const INPUT = 'w-full bg-hally-bg border border-hally-border rounded-lg px-3.5 py-2.5 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 transition-colors';
const BTN_PRIMARY   = { backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const BTN_SECONDARY = { backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' };
const BTN_DANGER    = { backgroundColor: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '5px 11px', fontSize: '12px', cursor: 'pointer' };

function authHeaders() {
  const token = getToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="shrink-0"
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 0,
        backgroundColor: value ? '#8B5CF6' : '#333', transition: 'background-color 0.2s', position: 'relative',
      }}
    >
      <span style={{
        display: 'block', width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff',
        position: 'absolute', top: 3, left: value ? 19 : 3, transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ icon, text }) {
  return (
    <div className="text-center py-10">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm text-hally-text-muted">{text}</p>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: '#111', borderColor: '#262626' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-hally-text">{title}</h3>
          <button onClick={onClose} className="text-hally-text-muted hover:text-hally-text w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hally-bg-hover transition-colors" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── TAB: Comandi ─────────────────────────────────────────────────────────────

function TabComandi() {
  const [commands, setCommands] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'add' | {id,...}
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [form, setForm] = useState({ trigger: '', response: '', cooldown_seconds: 5, mod_only: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/commands', { headers: authHeaders() });
      if (r.ok) setCommands(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setForm({ trigger: '', response: '', cooldown_seconds: 5, mod_only: false });
    setError('');
    setModal('add');
  }

  function openEdit(cmd) {
    setForm({ trigger: cmd.trigger, response: cmd.response, cooldown_seconds: cmd.cooldown_seconds, mod_only: cmd.mod_only });
    setError('');
    setModal(cmd);
  }

  async function save() {
    if (!form.trigger.trim() || !form.response.trim()) { setError('Trigger e risposta obbligatori'); return; }
    setSaving(true); setError('');
    try {
      const isEdit = modal !== 'add';
      const r = await fetch(isEdit ? `/api/commands/${modal.id}` : '/api/commands', {
        method:  isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body:    JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'Errore'); return; }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cmd) {
    await fetch(`/api/commands/${cmd.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ active: !cmd.active }),
    });
    load();
  }

  async function del(cmd) {
    if (!confirm(`Eliminare il comando ${cmd.trigger}?`)) return;
    await fetch(`/api/commands/${cmd.id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Comandi personalizzati che il bot risponde in chat.</p>
        <button style={BTN_PRIMARY} onClick={openAdd}>+ Aggiungi</button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-hally-border" />)}
        </div>
      ) : commands.length === 0 ? (
        <Empty icon="💬" text="Nessun comando personalizzato. Aggiungine uno!" />
      ) : (
        <div className="space-y-2">
          {commands.map(cmd => (
            <div key={cmd.id} style={CARD} className="flex items-center gap-3">
              <Toggle value={cmd.active} onChange={() => toggleActive(cmd)} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-mono font-semibold text-hally-text">{cmd.trigger}</span>
                {cmd.mod_only && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>solo mod</span>}
                <p className="text-xs text-hally-text-muted truncate mt-0.5">{cmd.response}</p>
              </div>
              <span className="text-xs text-hally-text-muted shrink-0">{cmd.cooldown_seconds}s</span>
              <button style={BTN_SECONDARY} onClick={() => openEdit(cmd)}>Modifica</button>
              <button style={BTN_DANGER} onClick={() => del(cmd)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nuovo Comando' : 'Modifica Comando'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Trigger <span style={{ color: '#8B5CF6' }}>*</span></label>
              <input className={INPUT} placeholder="!comando" value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Risposta <span style={{ color: '#8B5CF6' }}>*</span></label>
              <textarea className={INPUT + ' resize-none'} rows={3} placeholder="La risposta del bot..." value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Cooldown (sec)</label>
                <input type="number" min={0} max={600} className={INPUT} value={form.cooldown_seconds} onChange={e => setForm(f => ({ ...f, cooldown_seconds: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Toggle value={form.mod_only} onChange={v => setForm(f => ({ ...f, mod_only: v }))} />
                <span className="text-sm text-hally-text-muted">Solo mod</span>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button style={BTN_SECONDARY} onClick={() => setModal(null)}>Annulla</button>
              <button style={{ ...BTN_PRIMARY, flex: 1 }} onClick={save} disabled={saving}>
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: Template ────────────────────────────────────────────────────────────

function TabTemplate() {
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    fetch('/api/commands/templates', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTemplates(data); setLoading(false); });
  }, []);

  function update(name, key, value) {
    setTemplates(ts => ts.map(t => t.name === name ? { ...t, [key]: value } : t));
  }

  async function saveAll() {
    setSaving(true); setSaved(false);
    try {
      await fetch('/api/commands/templates', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify(templates),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="space-y-2">{[1,2,3,4,5,6,7].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-hally-border" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Comandi predefiniti gestiti automaticamente dal bot.</p>
        <button style={{ ...BTN_PRIMARY, ...(saved ? { backgroundColor: '#10b981' } : {}) }} onClick={saveAll} disabled={saving}>
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva tutto'}
        </button>
      </div>
      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.name} style={CARD} className="flex items-center gap-3">
            <Toggle value={t.enabled} onChange={v => update(t.name, 'enabled', v)} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-mono font-semibold text-hally-text">!{t.name}</span>
              <p className="text-xs text-hally-text-muted mt-0.5">{t.description}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs text-hally-text-muted">Cooldown</span>
              <input
                type="number" min={5} max={300}
                value={t.cooldown_seconds}
                onChange={e => update(t.name, 'cooldown_seconds', Number(e.target.value))}
                style={{ width: 60, backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: '#e2e2e2', outline: 'none' }}
              />
              <span className="text-xs text-hally-text-muted">s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: Annunci ─────────────────────────────────────────────────────────────

function TabAnnunci() {
  const [items,   setItems]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]  = useState(null);
  const [saving,  setSaving] = useState(false);
  const [error,   setError]  = useState('');
  const [form, setForm] = useState({ message: '', interval_minutes: 30 });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/commands/announcements', { headers: authHeaders() });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ message: '', interval_minutes: 30 }); setError(''); setModal('add'); }
  function openEdit(item) { setForm({ message: item.message, interval_minutes: item.interval_minutes }); setError(''); setModal(item); }

  async function save() {
    if (!form.message.trim()) { setError('Messaggio obbligatorio'); return; }
    setSaving(true); setError('');
    try {
      const isEdit = modal !== 'add';
      const r = await fetch(isEdit ? `/api/commands/announcements/${modal.id}` : '/api/commands/announcements', {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'Errore'); return; }
      setModal(null); load();
    } finally { setSaving(false); }
  }

  async function toggle(item) {
    await fetch(`/api/commands/announcements/${item.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  }

  async function del(item) {
    if (!confirm('Eliminare questo annuncio?')) return;
    await fetch(`/api/commands/announcements/${item.id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Messaggi inviati automaticamente durante la live a intervalli regolari.</p>
        <button style={BTN_PRIMARY} onClick={openAdd}>+ Aggiungi</button>
      </div>
      {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-hally-border" />)}</div>
       : items.length === 0 ? <Empty icon="📢" text="Nessun annuncio configurato." />
       : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} style={CARD} className="flex items-center gap-3">
              <Toggle value={item.active} onChange={() => toggle(item)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-hally-text truncate">{item.message}</p>
                <p className="text-xs text-hally-text-muted mt-0.5">ogni {item.interval_minutes} minuti</p>
              </div>
              <button style={BTN_SECONDARY} onClick={() => openEdit(item)}>Modifica</button>
              <button style={BTN_DANGER} onClick={() => del(item)}>✕</button>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Nuovo Annuncio' : 'Modifica Annuncio'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Messaggio <span style={{ color: '#8B5CF6' }}>*</span></label>
              <textarea className={INPUT + ' resize-none'} rows={3} placeholder="es. Seguite il mio Twitch e lasciate un follow! 💜" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Intervallo (minuti, 5–120)</label>
              <input type="number" min={5} max={120} className={INPUT} value={form.interval_minutes} onChange={e => setForm(f => ({ ...f, interval_minutes: Number(e.target.value) }))} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button style={BTN_SECONDARY} onClick={() => setModal(null)}>Annulla</button>
              <button style={{ ...BTN_PRIMARY, flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: Contatori ───────────────────────────────────────────────────────────

function TabContatori() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({ name: '', trigger: '', value: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/commands/counters', { headers: authHeaders() });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setForm({ name: '', trigger: '', value: 0 }); setError(''); setModal('add'); }
  function openEdit(item) { setForm({ name: item.name, trigger: item.trigger, value: item.value }); setError(''); setModal(item); }

  async function save() {
    if (!form.name.trim() || !form.trigger.trim()) { setError('Nome e trigger obbligatori'); return; }
    setSaving(true); setError('');
    try {
      const isEdit = modal !== 'add';
      const r = await fetch(isEdit ? `/api/commands/counters/${modal.id}` : '/api/commands/counters', {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'Errore'); return; }
      setModal(null); load();
    } finally { setSaving(false); }
  }

  async function reset(item) {
    await fetch(`/api/commands/counters/${item.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ value: 0 }),
    });
    load();
  }

  async function toggle(item) {
    await fetch(`/api/commands/counters/${item.id}`, {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  }

  async function del(item) {
    if (!confirm(`Eliminare il contatore ${item.name}?`)) return;
    await fetch(`/api/commands/counters/${item.id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Contatori incrementabili in chat. Usa <code className="text-xs">!trigger +</code> per incrementare.</p>
        <button style={BTN_PRIMARY} onClick={openAdd}>+ Aggiungi</button>
      </div>
      {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-hally-border" />)}</div>
       : items.length === 0 ? <Empty icon="🔢" text="Nessun contatore configurato." />
       : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} style={CARD} className="flex items-center gap-3">
              <Toggle value={item.active} onChange={() => toggle(item)} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-hally-text">{item.name}</span>
                <span className="ml-2 text-xs font-mono text-hally-text-muted">{item.trigger}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-2xl font-bold" style={{ color: '#8B5CF6' }}>{item.value}</span>
                <button style={{ ...BTN_SECONDARY, fontSize: 11, padding: '4px 10px' }} onClick={() => reset(item)}>Reset</button>
              </div>
              <button style={BTN_SECONDARY} onClick={() => openEdit(item)}>Modifica</button>
              <button style={BTN_DANGER} onClick={() => del(item)}>✕</button>
            </div>
          ))}
        </div>
      )}
      {modal && (
        <Modal title={modal === 'add' ? 'Nuovo Contatore' : 'Modifica Contatore'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Nome</label>
              <input className={INPUT} placeholder="es. Morti, Punti, Caffè" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Trigger</label>
              <input className={INPUT} placeholder="!morti" value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} />
              <p className="text-xs text-hally-text-muted mt-1">In chat: <code>!morti</code> per vedere, <code>!morti +</code> per incrementare, <code>!morti reset</code> per azzerare (mod)</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1.5">Valore iniziale</label>
              <input type="number" className={INPUT} value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button style={BTN_SECONDARY} onClick={() => setModal(null)}>Annulla</button>
              <button style={{ ...BTN_PRIMARY, flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── TAB: Emote ───────────────────────────────────────────────────────────────

function TabEmote() {
  // rows: [{emote_name, description, fromTwitch?}]
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/commands/emotes',        { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
      fetch('/api/commands/emotes/twitch', { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
    ]).then(([saved, twitch]) => {
      const descMap = Object.fromEntries(saved.map(e => [e.emote_name, e.description]));
      if (twitch.length > 0) {
        // Mostra tutte le emote Twitch con descrizione opzionale pre-compilata
        const merged = twitch.map(te => ({
          emote_name:  te.name,
          description: descMap[te.name] ?? '',
          fromTwitch:  true,
          emote_type:  te.emote_type,
        }));
        // Aggiungi eventuali emote manuali non presenti in Twitch
        const twitchNames = new Set(twitch.map(t => t.name));
        for (const s of saved) {
          if (!twitchNames.has(s.emote_name)) {
            merged.push({ emote_name: s.emote_name, description: s.description, fromTwitch: false });
          }
        }
        setRows(merged);
      } else if (saved.length > 0) {
        setRows(saved.map(e => ({ ...e, fromTwitch: false })));
      } else {
        setRows([{ emote_name: '', description: '', fromTwitch: false }]);
      }
      setLoading(false);
    });
  }, []);

  function updateDesc(idx, val) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, description: val } : r));
  }
  function updateName(idx, val) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, emote_name: val } : r));
  }
  function addRow() { setRows(rs => [...rs, { emote_name: '', description: '', fromTwitch: false }]); }
  function removeRow(idx) { setRows(rs => rs.filter((_, i) => i !== idx)); }

  async function saveAll() {
    setSaving(true); setSaved(false);
    try {
      const valid = rows.filter(r => r.emote_name?.trim() && r.description?.trim());
      await fetch('/api/commands/emotes', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify(valid.map(r => ({ emote_name: r.emote_name, description: r.description }))),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const typeLabel = { subscriptions: 'sub', bitstiers: 'bits', follower: 'follower' };

  if (loading) return <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl animate-pulse bg-hally-border" />)}</div>;

  const hasTwitch = rows.some(r => r.fromTwitch);

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <p className="text-sm text-hally-text-muted">
            {hasTwitch
              ? 'Emote del canale caricate automaticamente da Twitch. Aggiungi una descrizione per aiutare il bot AI a capirne il significato.'
              : 'Descrivi le emote del canale per aiutare il bot AI a capirne il significato.'}
          </p>
          {hasTwitch && (
            <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
              La descrizione è opzionale — vengono salvate solo le emote con descrizione compilata.
            </p>
          )}
        </div>
        <button
          style={{ ...BTN_PRIMARY, flexShrink: 0, ...(saved ? { backgroundColor: '#10b981' } : {}) }}
          onClick={saveAll}
          disabled={saving}
        >
          {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {row.fromTwitch ? (
              <div
                className="flex items-center gap-1.5 shrink-0"
                style={{ width: 150, backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px' }}
              >
                <span className="text-xs font-mono font-semibold text-hally-text truncate flex-1">{row.emote_name}</span>
                {row.emote_type && (
                  <span className="text-xs shrink-0" style={{ color: '#8B5CF6', fontSize: 10 }}>
                    {typeLabel[row.emote_type] ?? row.emote_type}
                  </span>
                )}
              </div>
            ) : (
              <input
                className={INPUT}
                style={{ width: 150, flex: 'none' }}
                placeholder="Nome emote"
                value={row.emote_name}
                onChange={ev => updateName(idx, ev.target.value)}
              />
            )}
            <input
              className={INPUT}
              placeholder={row.fromTwitch ? 'Descrizione opzionale…' : 'es. Emote di gioia usata quando qualcosa va bene'}
              value={row.description}
              onChange={ev => updateDesc(idx, ev.target.value)}
            />
            {!row.fromTwitch && (
              <button onClick={() => removeRow(idx)} style={{ ...BTN_DANGER, flexShrink: 0 }}>✕</button>
            )}
          </div>
        ))}
      </div>

      <button style={{ ...BTN_SECONDARY, marginTop: 12 }} onClick={addRow}>+ Aggiungi emote manuale</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-hally-text">Comandi</h1>
        <p className="text-sm text-hally-text-muted mt-1">Gestisci tutti i comandi del bot — personalizzati, template, annunci, contatori ed emote.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#1a1a1a', border: '1px solid #262626' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: activeTab === i ? '#8B5CF6' : 'transparent',
              color:            activeTab === i ? '#fff'     : '#6b6b6b',
              border:           'none',
              cursor:           'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={CARD}>
        {activeTab === 0 && <TabComandi />}
        {activeTab === 1 && <TabTemplate />}
        {activeTab === 2 && <TabAnnunci />}
        {activeTab === 3 && <TabContatori />}
        {activeTab === 4 && <TabEmote />}
      </div>
    </div>
  );
}

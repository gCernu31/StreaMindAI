import { useState, useEffect, useCallback, useRef } from 'react';
import { getToken } from '../utils/auth.js';

const TABS = ['Comandi', 'Template', 'Annunci', 'Contatori', 'Emote'];

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

// ─── Stili condivisi ─────────────────────────────────────────────────────────

const CARD    = { backgroundColor: '#111', border: '1px solid #262626', borderRadius: 12, padding: 20 };
const INPUT   = 'w-full bg-hally-bg border border-hally-border rounded-lg px-3 py-2 text-sm text-hally-text placeholder-hally-text-muted focus:outline-none focus:border-purple-500 transition-colors';
const SELECT  = 'bg-hally-bg border border-hally-border rounded-lg px-3 py-2 text-sm text-hally-text focus:outline-none focus:border-purple-500';
const BTN_PRI = { backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const BTN_SEC = { backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const BTN_DEL = { backgroundColor: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer' };

// ─── Piccoli widget ───────────────────────────────────────────────────────────

function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 34, height: 19, borderRadius: 10, border: 'none', padding: 0,
        backgroundColor: value ? '#8B5CF6' : '#333',
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative', flexShrink: 0, transition: 'background-color .15s',
      }}
    >
      <span style={{
        display: 'block', width: 13, height: 13, borderRadius: '50%', backgroundColor: '#fff',
        position: 'absolute', top: 3, left: value ? 18 : 3, transition: 'left .15s',
      }} />
    </button>
  );
}

const ACCESS_OPTS = [
  { value: 'everyone',    label: 'Everyone' },
  { value: 'subscriber',  label: 'Subscriber' },
  { value: 'vip',         label: 'VIP' },
  { value: 'moderator',   label: 'Moderator' },
  { value: 'broadcaster', label: 'Broadcaster' },
];

const ACCESS_COLOR = {
  everyone: '#6b7280', subscriber: '#8B5CF6', vip: '#a855f7',
  moderator: '#6366f1', broadcaster: '#f59e0b',
};

function AccessBadge({ level }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ color: ACCESS_COLOR[level] ?? '#6b7280', backgroundColor: `${ACCESS_COLOR[level] ?? '#6b7280'}18` }}>
      {ACCESS_OPTS.find(o => o.value === level)?.label ?? level}
    </span>
  );
}

function Empty({ icon, text }) {
  return (
    <div className="text-center py-10">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm text-hally-text-muted">{text}</p>
    </div>
  );
}

// ─── TAB: Comandi personalizzati ─────────────────────────────────────────────

const CMD_BLANK = { trigger: '', response: '', global_cooldown_seconds: 5, user_cooldown_seconds: 15, access_level: 'everyone', response_type: 'say' };

function TabComandi() {
  const [commands, setCommands] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null); // null | 'new' | id
  const [form,     setForm]     = useState(CMD_BLANK);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/commands', { headers: authHeaders() });
    if (r.ok) setCommands(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(CMD_BLANK);
    setError('');
    setExpanded('new');
  }

  function openEdit(cmd) {
    setForm({
      trigger:                 cmd.trigger,
      response:                cmd.response,
      global_cooldown_seconds: cmd.global_cooldown_seconds ?? 5,
      user_cooldown_seconds:   cmd.user_cooldown_seconds ?? 15,
      access_level:            cmd.access_level ?? 'everyone',
      response_type:           cmd.response_type ?? 'say',
    });
    setError('');
    setExpanded(cmd.id);
  }

  function cancelEdit() { setExpanded(null); setError(''); }

  async function save() {
    if (!form.trigger.trim() || !form.response.trim()) { setError('Trigger e risposta obbligatori'); return; }
    setSaving(true); setError('');
    try {
      const isEdit = expanded !== 'new';
      const r = await fetch(isEdit ? `/api/commands/${expanded}` : '/api/commands', {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'Errore'); return; }
      setExpanded(null);
      load();
    } finally { setSaving(false); }
  }

  async function toggleActive(cmd) {
    await fetch(`/api/commands/${cmd.id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ active: !cmd.active }),
    });
    setCommands(cs => cs.map(c => c.id === cmd.id ? { ...c, active: !c.active } : c));
  }

  async function del(cmd) {
    if (!confirm(`Eliminare il comando ${cmd.trigger}?`)) return;
    await fetch(`/api/commands/${cmd.id}`, { method: 'DELETE', headers: authHeaders() });
    setCommands(cs => cs.filter(c => c.id !== cmd.id));
  }

  const f = form;
  const setF = fn => setForm(prev => ({ ...prev, ...fn(prev) }));

  const InlineForm = () => (
    <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #333', borderRadius: 10, padding: 16, marginTop: 4 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Trigger <span style={{ color: '#8B5CF6' }}>*</span></label>
          <div className="flex items-center gap-0">
            <span className="text-sm font-mono text-hally-text-muted px-2 py-2 border border-hally-border rounded-l-lg border-r-0" style={{ backgroundColor: '#1a1a1a' }}>!</span>
            <input
              className={INPUT + ' rounded-l-none'}
              placeholder="comando"
              value={f.trigger.replace(/^!/, '')}
              onChange={e => setF(() => ({ trigger: '!' + e.target.value.replace(/^!/, '') }))}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Tipo risposta</label>
          <select className={SELECT + ' w-full'} value={f.response_type} onChange={e => setF(() => ({ response_type: e.target.value }))}>
            <option value="say">Say</option>
            <option value="reply">Reply (@user)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">User Level</label>
          <select className={SELECT + ' w-full'} value={f.access_level} onChange={e => setF(() => ({ access_level: e.target.value }))}>
            {ACCESS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Global CD (s)</label>
            <input type="number" min={0} max={600} className={INPUT} value={f.global_cooldown_seconds} onChange={e => setF(() => ({ global_cooldown_seconds: Number(e.target.value) }))} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">User CD (s)</label>
            <input type="number" min={0} max={600} className={INPUT} value={f.user_cooldown_seconds} onChange={e => setF(() => ({ user_cooldown_seconds: Number(e.target.value) }))} />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">
          Risposta <span style={{ color: '#8B5CF6' }}>*</span>
          <span className="ml-2 normal-case text-hally-text-muted" style={{ fontWeight: 400, fontSize: 10 }}>
            Variabili: {'{user}'} {'{game}'} {'{uptime}'} {'{channel}'} {'{random 1-10}'}
          </span>
        </label>
        <textarea
          rows={3}
          className={INPUT + ' resize-none'}
          placeholder="La risposta del bot…"
          value={f.response}
          onChange={e => setF(() => ({ response: e.target.value }))}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <button style={BTN_SEC} onClick={cancelEdit}>Annulla</button>
        <button style={{ ...BTN_PRI, flex: 1 }} onClick={save} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Salva comando'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Comandi personalizzati. Le risposte supportano variabili dinamiche.</p>
        {expanded !== 'new' && <button style={BTN_PRI} onClick={openNew}>+ Aggiungi</button>}
      </div>

      {expanded === 'new' && <InlineForm />}

      {loading ? (
        <div className="space-y-1 mt-2">{[1,2,3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse bg-hally-border" />)}</div>
      ) : commands.length === 0 && expanded !== 'new' ? (
        <Empty icon="💬" text="Nessun comando personalizzato." />
      ) : (
        <div className="mt-2">
          {/* Header */}
          <div className="hidden md:grid text-xs font-semibold text-hally-text-muted uppercase tracking-wider px-3 pb-1.5" style={{ gridTemplateColumns: '34px 110px 1fr 60px 60px 110px 80px' }}>
            <span></span><span>Comando</span><span>Risposta</span>
            <span className="text-center">Global</span><span className="text-center">User</span>
            <span>Livello</span><span></span>
          </div>
          <div className="space-y-1">
            {commands.map(cmd => (
              <div key={cmd.id}>
                <div
                  className="md:grid flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{
                    gridTemplateColumns: '34px 110px 1fr 60px 60px 110px 80px',
                    backgroundColor: expanded === cmd.id ? '#1a1a1a' : 'transparent',
                  }}
                  onMouseEnter={e => { if (expanded !== cmd.id) e.currentTarget.style.backgroundColor = '#161616'; }}
                  onMouseLeave={e => { if (expanded !== cmd.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Toggle value={cmd.active} onChange={() => toggleActive(cmd)} />
                  <span className="text-sm font-mono font-semibold text-hally-text truncate">{cmd.trigger}</span>
                  <span className="text-xs text-hally-text-muted truncate hidden md:block">{cmd.response}</span>
                  <span className="text-xs text-center text-hally-text-muted hidden md:block">{cmd.global_cooldown_seconds ?? 5}s</span>
                  <span className="text-xs text-center text-hally-text-muted hidden md:block">{cmd.user_cooldown_seconds ?? 15}s</span>
                  <div className="hidden md:flex"><AccessBadge level={cmd.access_level ?? 'everyone'} /></div>
                  <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                    <button
                      style={{ ...BTN_SEC, padding: '4px 10px', fontSize: 12 }}
                      onClick={() => expanded === cmd.id ? cancelEdit() : openEdit(cmd)}
                    >
                      {expanded === cmd.id ? 'Chiudi' : 'Modifica'}
                    </button>
                    <button style={BTN_DEL} onClick={() => del(cmd)}>✕</button>
                  </div>
                </div>
                {expanded === cmd.id && <InlineForm />}
              </div>
            ))}
          </div>
        </div>
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
      await fetch('/api/commands/templates', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(templates) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  if (loading) return <div className="space-y-2">{[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-hally-border" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Comandi predefiniti gestiti automaticamente. Il cooldown di <code className="text-xs">!clip</code> è fisso a 30s.</p>
        <button style={{ ...BTN_PRI, ...(saved ? { backgroundColor: '#10b981' } : {}) }} onClick={saveAll} disabled={saving}>
          {saving ? 'Salvataggio…' : saved ? '✓ Salvato' : 'Salva tutto'}
        </button>
      </div>
      <div className="space-y-1.5">
        {templates.map(t => (
          <div key={t.name} style={{ backgroundColor: '#161616', border: '1px solid #222', borderRadius: 10, padding: '10px 14px' }} className="flex items-center gap-3">
            <Toggle value={t.enabled} onChange={v => update(t.name, 'enabled', v)} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-mono font-semibold text-hally-text">!{t.name}</span>
              <p className="text-xs text-hally-text-muted mt-0.5">{t.description}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs text-hally-text-muted">CD</span>
              <input
                type="number" min={5} max={300}
                disabled={t.fixedCooldown}
                value={t.cooldown_seconds}
                onChange={e => update(t.name, 'cooldown_seconds', Number(e.target.value))}
                style={{ width: 56, backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 7, padding: '4px 8px', fontSize: 12, color: t.fixedCooldown ? '#555' : '#e2e2e2', outline: 'none', cursor: t.fixedCooldown ? 'not-allowed' : 'auto' }}
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

const ANN_BLANK = {
  name: '', messages: [''], interval_minutes: 30, interval_offline_minutes: 0,
  min_chat_lines: 0, title_keywords: '', game_filter: '',
};

function TabAnnunci() {
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [form,     setForm]     = useState(ANN_BLANK);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/commands/announcements', { headers: authHeaders() });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ ...ANN_BLANK, messages: [''] });
    setError('');
    setExpanded('new');
  }

  function openEdit(item) {
    setForm({
      name:                    item.name ?? '',
      messages:                item.messages?.length ? item.messages : [''],
      interval_minutes:        item.interval_minutes ?? 30,
      interval_offline_minutes: item.interval_offline_minutes ?? 0,
      min_chat_lines:          item.min_chat_lines ?? 0,
      title_keywords:          item.title_keywords ?? '',
      game_filter:             item.game_filter ?? '',
    });
    setError('');
    setExpanded(item.id);
  }

  function cancelEdit() { setExpanded(null); setError(''); }
  const setF = fn => setForm(prev => ({ ...prev, ...fn(prev) }));

  // messages helpers
  function setMsg(idx, val) { setF(f => { const m = [...f.messages]; m[idx] = val; return { messages: m }; }); }
  function addMsg()          { setF(f => ({ messages: [...f.messages, ''] })); }
  function removeMsg(idx)    { setF(f => ({ messages: f.messages.filter((_, i) => i !== idx) })); }
  function moveMsg(idx, dir) {
    setF(f => {
      const m = [...f.messages];
      const swap = idx + dir;
      if (swap < 0 || swap >= m.length) return {};
      [m[idx], m[swap]] = [m[swap], m[idx]];
      return { messages: m };
    });
  }

  async function save() {
    const validMsgs = form.messages.filter(m => m?.trim());
    if (validMsgs.length === 0) { setError('Almeno un messaggio obbligatorio'); return; }
    setSaving(true); setError('');
    try {
      const isEdit = expanded !== 'new';
      const payload = { ...form, messages: validMsgs };
      const r = await fetch(isEdit ? `/api/commands/announcements/${expanded}` : '/api/commands/announcements', {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'Errore'); return; }
      setExpanded(null);
      load();
    } finally { setSaving(false); }
  }

  async function toggle(item) {
    await fetch(`/api/commands/announcements/${item.id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ active: !item.active }),
    });
    setItems(is => is.map(i => i.id === item.id ? { ...i, active: !i.active } : i));
  }

  async function del(item) {
    if (!confirm('Eliminare questo annuncio?')) return;
    await fetch(`/api/commands/announcements/${item.id}`, { method: 'DELETE', headers: authHeaders() });
    setItems(is => is.filter(i => i.id !== item.id));
  }

  const f = form;

  const AnnForm = () => (
    <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #333', borderRadius: 10, padding: 16, marginTop: 4 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Nome timer</label>
          <input className={INPUT} placeholder="es. Social reminder" value={f.name} onChange={e => setF(() => ({ name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Intervallo online (min)</label>
          <input type="number" min={1} max={180} className={INPUT} value={f.interval_minutes} onChange={e => setF(() => ({ interval_minutes: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Intervallo offline (min, 0=disattivo)</label>
          <input type="number" min={0} max={180} className={INPUT} value={f.interval_offline_minutes} onChange={e => setF(() => ({ interval_offline_minutes: Number(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Chat lines minime (5 min)</label>
          <input type="number" min={0} max={500} className={INPUT} value={f.min_chat_lines} onChange={e => setF(() => ({ min_chat_lines: Number(e.target.value) }))} />
          <p className="text-xs text-hally-text-muted mt-1">0 = invia sempre</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Filtro giochi (virgola)</label>
          <input className={INPUT} placeholder="Minecraft, GTA V" value={f.game_filter} onChange={e => setF(() => ({ game_filter: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Messaggi in rotazione <span style={{ color: '#8B5CF6' }}>*</span></label>
          <p className="text-xs text-hally-text-muted mb-2">I messaggi vengono inviati in sequenza ad ogni ciclo. Variabili: <code className="text-xs">{'{channel}'} {'{game}'} {'{uptime}'}</code></p>
          <div className="space-y-1.5">
            {f.messages.map((msg, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                  <button disabled={idx === 0} onClick={() => moveMsg(idx, -1)} style={{ background: 'none', border: 'none', color: idx === 0 ? '#333' : '#666', cursor: idx === 0 ? 'default' : 'pointer', lineHeight: 1, padding: '2px 4px' }}>▲</button>
                  <button disabled={idx === f.messages.length - 1} onClick={() => moveMsg(idx, 1)} style={{ background: 'none', border: 'none', color: idx === f.messages.length - 1 ? '#333' : '#666', cursor: idx === f.messages.length - 1 ? 'default' : 'pointer', lineHeight: 1, padding: '2px 4px' }}>▼</button>
                </div>
                <span className="text-xs text-hally-text-muted pt-2.5 shrink-0 w-4 text-right">{idx + 1}.</span>
                <textarea
                  rows={2}
                  className={INPUT + ' resize-none flex-1'}
                  placeholder={`Messaggio ${idx + 1}…`}
                  value={msg}
                  onChange={e => setMsg(idx, e.target.value)}
                />
                {f.messages.length > 1 && (
                  <button onClick={() => removeMsg(idx)} style={{ ...BTN_DEL, flexShrink: 0, marginTop: 2 }}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button style={{ ...BTN_SEC, marginTop: 8, fontSize: 12 }} onClick={addMsg}>+ Aggiungi messaggio</button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button style={BTN_SEC} onClick={cancelEdit}>Annulla</button>
        <button style={{ ...BTN_PRI, flex: 1 }} onClick={save} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Attiva Timer'}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Messaggi inviati automaticamente in chat a intervalli regolari con rotazione.</p>
        {expanded !== 'new' && <button style={BTN_PRI} onClick={openNew}>+ Aggiungi</button>}
      </div>

      {expanded === 'new' && <AnnForm />}

      {loading ? (
        <div className="space-y-1 mt-2">{[1,2].map(i => <div key={i} className="h-12 rounded-lg animate-pulse bg-hally-border" />)}</div>
      ) : items.length === 0 && expanded !== 'new' ? (
        <Empty icon="📢" text="Nessun annuncio configurato." />
      ) : (
        <div className="space-y-1 mt-2">
          {items.map(item => (
            <div key={item.id}>
              <div
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: expanded === item.id ? '#1a1a1a' : 'transparent' }}
                onMouseEnter={e => { if (expanded !== item.id) e.currentTarget.style.backgroundColor = '#161616'; }}
                onMouseLeave={e => { if (expanded !== item.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Toggle value={item.active} onChange={() => toggle(item)} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-hally-text">{item.name || (item.messages?.[0] ? item.messages[0].slice(0, 50) : '…')}</span>
                  <p className="text-xs text-hally-text-muted mt-0.5">
                    {item.interval_minutes}min online
                    {item.interval_offline_minutes > 0 ? ` · ${item.interval_offline_minutes}min offline` : ''}
                    {item.min_chat_lines > 0 ? ` · min ${item.min_chat_lines} msgs` : ''}
                    {item.messages?.length > 1 ? ` · ${item.messages.length} messaggi` : ''}
                  </p>
                </div>
                <button style={{ ...BTN_SEC, fontSize: 12, padding: '4px 10px' }} onClick={() => expanded === item.id ? cancelEdit() : openEdit(item)}>
                  {expanded === item.id ? 'Chiudi' : 'Modifica'}
                </button>
                <button style={BTN_DEL} onClick={() => del(item)}>✕</button>
              </div>
              {expanded === item.id && <AnnForm />}
            </div>
          ))}
        </div>
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

  function openAdd()    { setForm({ name: '', trigger: '', value: 0 }); setError(''); setModal('add'); }
  function openEdit(i)  { setForm({ name: i.name, trigger: i.trigger, value: i.value }); setError(''); setModal(i); }

  async function save() {
    if (!form.name.trim() || !form.trigger.trim()) { setError('Nome e trigger obbligatori'); return; }
    setSaving(true); setError('');
    try {
      const isEdit = modal !== 'add';
      const r = await fetch(isEdit ? `/api/commands/counters/${modal.id}` : '/api/commands/counters', {
        method: isEdit ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? 'Errore'); return; }
      setModal(null); load();
    } finally { setSaving(false); }
  }

  async function resetCounter(item) {
    await fetch(`/api/commands/counters/${item.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ value: 0 }) });
    setItems(is => is.map(i => i.id === item.id ? { ...i, value: 0 } : i));
  }

  async function toggle(item) {
    await fetch(`/api/commands/counters/${item.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ active: !item.active }) });
    setItems(is => is.map(i => i.id === item.id ? { ...i, active: !i.active } : i));
  }

  async function del(item) {
    if (!confirm(`Eliminare ${item.name}?`)) return;
    await fetch(`/api/commands/counters/${item.id}`, { method: 'DELETE', headers: authHeaders() });
    setItems(is => is.filter(i => i.id !== item.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-hally-text-muted">Contatori in chat. <code className="text-xs">!trigger</code> per vedere, <code className="text-xs">!trigger +</code> per incrementare (tutti), <code className="text-xs">!trigger reset</code> per azzerare (mod).</p>
        <button style={BTN_PRI} onClick={openAdd}>+ Aggiungi</button>
      </div>
      {loading ? <div className="space-y-1">{[1,2].map(i => <div key={i} className="h-10 rounded-lg animate-pulse bg-hally-border" />)}</div>
        : items.length === 0 ? <Empty icon="🔢" text="Nessun contatore configurato." />
        : (
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#161616', border: '1px solid #222' }}>
              <Toggle value={item.active} onChange={() => toggle(item)} />
              <span className="text-sm font-semibold text-hally-text flex-1">{item.name}</span>
              <span className="text-xs font-mono text-hally-text-muted">{item.trigger}</span>
              <span className="text-xl font-bold" style={{ color: '#8B5CF6', minWidth: 32, textAlign: 'center' }}>{item.value}</span>
              <button style={{ ...BTN_SEC, fontSize: 11, padding: '3px 9px' }} onClick={() => resetCounter(item)}>Reset</button>
              <button style={{ ...BTN_SEC, fontSize: 11, padding: '3px 9px' }} onClick={() => openEdit(item)}>Modifica</button>
              <button style={BTN_DEL} onClick={() => del(item)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full max-w-sm rounded-2xl border p-6" style={{ backgroundColor: '#111', borderColor: '#262626' }}>
            <h3 className="text-base font-bold text-hally-text mb-4">{modal === 'add' ? 'Nuovo Contatore' : 'Modifica Contatore'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Nome</label>
                <input className={INPUT} placeholder="es. Morti" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Trigger</label>
                <input className={INPUT} placeholder="!morti" value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-hally-text-muted uppercase tracking-wider block mb-1">Valore iniziale</label>
                <input type="number" className={INPUT} value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button style={BTN_SEC} onClick={() => setModal(null)}>Annulla</button>
                <button style={{ ...BTN_PRI, flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: Emote ───────────────────────────────────────────────────────────────

function TabEmote() {
  const [rows,             setRows]             = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [useEmotes,        setUseEmotes]        = useState(true);
  const [savingToggle,     setSavingToggle]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/commands/emotes',        { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
      fetch('/api/commands/emotes/twitch', { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
      fetch('/api/config',                 { headers: authHeaders() }).then(r => r.ok ? r.json() : {}),
    ]).then(([savedEmotes, twitch, cfg]) => {
      setUseEmotes(cfg.use_channel_emotes !== false);
      const descMap = Object.fromEntries(savedEmotes.map(e => [e.emote_name, e.description]));
      if (twitch.length > 0) {
        const merged = twitch.map(te => ({ emote_name: te.name, description: descMap[te.name] ?? '', fromTwitch: true, emote_type: te.emote_type }));
        const twitchNames = new Set(twitch.map(t => t.name));
        for (const s of savedEmotes) if (!twitchNames.has(s.emote_name)) merged.push({ emote_name: s.emote_name, description: s.description, fromTwitch: false });
        setRows(merged);
      } else if (savedEmotes.length > 0) {
        setRows(savedEmotes.map(e => ({ ...e, fromTwitch: false })));
      } else {
        setRows([{ emote_name: '', description: '', fromTwitch: false }]);
      }
      setLoading(false);
    });
  }, []);

  async function toggleUseEmotes(val) {
    setUseEmotes(val);
    setSavingToggle(true);
    try {
      await fetch('/api/config', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ use_channel_emotes: val }),
      });
    } finally { setSavingToggle(false); }
  }

  function updateDesc(idx, val) { setRows(rs => rs.map((r, i) => i === idx ? { ...r, description: val } : r)); }
  function updateName(idx, val) { setRows(rs => rs.map((r, i) => i === idx ? { ...r, emote_name: val } : r)); }
  function addRow()    { setRows(rs => [...rs, { emote_name: '', description: '', fromTwitch: false }]); }
  function removeRow(idx) { setRows(rs => rs.filter((_, i) => i !== idx)); }

  async function saveAll() {
    setSaving(true); setSaved(false);
    try {
      const valid = rows.filter(r => r.emote_name?.trim() && r.description?.trim());
      await fetch('/api/commands/emotes', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(valid.map(r => ({ emote_name: r.emote_name, description: r.description }))) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  const typeLabel = { subscriptions: 'sub', bitstiers: 'bits', follower: 'follower' };

  if (loading) return <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-10 rounded-xl animate-pulse bg-hally-border" />)}</div>;

  const hasTwitch = rows.some(r => r.fromTwitch);
  return (
    <div>
      {/* Toggle usa emote canale */}
      <div
        className="flex items-center justify-between gap-4 mb-5 px-4 py-3 rounded-xl"
        style={{ backgroundColor: '#141414', border: '1px solid #262626' }}
      >
        <div>
          <p className="text-sm font-medium text-hally-text">Usa le emote del canale nelle risposte</p>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
            Se attivo, il bot userà le emote Twitch del tuo canale invece delle emoji standard
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleUseEmotes(!useEmotes)}
          disabled={savingToggle}
          className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60"
          style={{ backgroundColor: useEmotes ? '#8B5CF6' : '#333' }}
        >
          <span
            className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: useEmotes ? 'translateX(18px)' : 'translateX(3px)' }}
          />
        </button>
      </div>

      <div className="flex items-start justify-between mb-4 gap-4">
        <p className="text-sm text-hally-text-muted">
          {hasTwitch ? 'Emote caricate da Twitch. La descrizione aiuta il bot AI a capirne il significato.' : 'Descrivi le emote del canale per il bot AI.'}
        </p>
        <button style={{ ...BTN_PRI, flexShrink: 0, ...(saved ? { backgroundColor: '#10b981' } : {}) }} onClick={saveAll} disabled={saving}>
          {saving ? 'Salvataggio…' : saved ? '✓ Salvato' : 'Salva'}
        </button>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {row.fromTwitch ? (
              <div className="flex items-center gap-1.5 shrink-0" style={{ width: 140, backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 10px' }}>
                <span className="text-xs font-mono font-semibold text-hally-text truncate flex-1">{row.emote_name}</span>
                {row.emote_type && <span className="text-xs shrink-0" style={{ color: '#8B5CF6', fontSize: 10 }}>{typeLabel[row.emote_type] ?? row.emote_type}</span>}
              </div>
            ) : (
              <input className={INPUT} style={{ width: 140, flex: 'none' }} placeholder="Nome emote" value={row.emote_name} onChange={ev => updateName(idx, ev.target.value)} />
            )}
            <input className={INPUT} placeholder={row.fromTwitch ? 'Descrizione opzionale…' : 'Significato della emote…'} value={row.description} onChange={ev => updateDesc(idx, ev.target.value)} />
            {!row.fromTwitch && <button onClick={() => removeRow(idx)} style={{ ...BTN_DEL, flexShrink: 0 }}>✕</button>}
          </div>
        ))}
      </div>
      <button style={{ ...BTN_SEC, marginTop: 10, fontSize: 12 }} onClick={addRow}>+ Emote manuale</button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-hally-text">Comandi</h1>
        <p className="text-sm text-hally-text-muted mt-1">Gestisci comandi personalizzati, template, annunci in rotazione, contatori ed emote.</p>
      </div>

      <div className="flex gap-0.5 p-1 rounded-xl" style={{ backgroundColor: '#1a1a1a', border: '1px solid #262626' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150" style={{ backgroundColor: activeTab === i ? '#8B5CF6' : 'transparent', color: activeTab === i ? '#fff' : '#6b6b6b', border: 'none', cursor: 'pointer' }}>
            {tab}
          </button>
        ))}
      </div>

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

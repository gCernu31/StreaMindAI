import { Router } from 'express';
import axios from 'axios';
import pool from '../db.js';
import { sendAnalysisReportEmail } from '../services/emailService.js';
import { requireAuth } from '../middleware/auth.js';

export const analyticsRoutes = Router();

// ── Twitch app token (cache in-memory, dura ~60 giorni) ───────────────────────
let _twitchAppToken = null;
let _twitchTokenExpiry = 0;

async function getTwitchAppToken() {
  if (_twitchAppToken && Date.now() < _twitchTokenExpiry) return _twitchAppToken;
  const r = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id:     process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type:    'client_credentials',
    },
  });
  _twitchAppToken   = r.data.access_token;
  _twitchTokenExpiry = Date.now() + (r.data.expires_in - 3600) * 1000;
  return _twitchAppToken;
}

async function twitchUserExists(username) {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) return true;
  try {
    const token = await getTwitchAppToken();
    const r = await axios.get('https://api.twitch.tv/helix/users', {
      params:  { login: username.toLowerCase() },
      headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID, Authorization: `Bearer ${token}` },
      timeout: 8_000,
    });
    return r.data?.data?.length > 0;
  } catch {
    return true; // in caso di errore API lascia passare
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurata');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const r = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 2048 },
    },
  }, { timeout: 90_000 });

  const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Risposta Gemini vuota');
  return text;
}

function buildPrompt(data) {
  const {
    twitch_username,
    total_followers, avg_viewers, main_games, total_views, created_at, is_live,
    current_subs,
    hours_per_week, hours_per_month,
    main_goal, has_socials, social_links, stream_schedule,
    audience_age, language, has_collaborated, main_weakness,
    previous_analysis, analysis_count,
    monthly_follower_growth,
  } = data;

  const hoursStr = hours_per_week
    ? `${hours_per_week} ore a settimana`
    : hours_per_month
    ? `${hours_per_month} ore al mese`
    : 'non specificato';

  const socialsStr = has_socials === true || has_socials === 'true'
    ? `Sì${social_links ? ` — ${social_links}` : ''}`
    : (has_socials === false || has_socials === 'false') ? 'No'
    : social_links || 'non specificato';

  const collaboratedStr = has_collaborated === true || has_collaborated === 'true' ? 'Sì'
    : (has_collaborated === false || has_collaborated === 'false') ? 'No'
    : 'non specificato';

  const isRegen = Number(analysis_count) > 1;

  // Sezione 11 — sempre presente, contenuto varia se prima analisi o rigenerazione
  const prevSection = !isRegen
    ? `

### 🔄 Confronto con Analisi Precedente
Questa è la prima analisi del canale. Scrivi esattamente questa frase e nient'altro in questa sezione: "Prima analisi — nessun confronto disponibile. La prossima analisi mostrerà i tuoi progressi rispetto ai KPI definiti in questo report."`
    : `

### 🔄 Confronto con Analisi Precedente
${previous_analysis
  ? `Confronta i dati attuali con l'analisi precedente. Identifica cosa è migliorato, cosa è peggiorato e cosa è rimasto invariato — usa numeri concreti (delta follower, sub, viewer medi). Riconosci esplicitamente i progressi dove ci sono. Se qualcosa è peggiorato, indica la causa probabile e la correzione suggerita.

**Analisi precedente (solo come riferimento, non citare letteralmente):**
${previous_analysis.substring(0, 1500)}${previous_analysis.length > 1500 ? '…' : ''}`
  : `Rigenerazione senza testo precedente disponibile. Ricorda allo streamer di confrontare i nuovi target KPI con i progressi effettivi dall'analisi precedente e di tenere traccia delle metriche chiave nel tempo.`}`;

  return `Sei Hally, un'AI di analisi specializzata nella crescita dei canali Twitch. Il tuo obiettivo è fornire l'analisi più dettagliata e personalizzata possibile, basata esclusivamente sui dati reali del canale. Il tuo stile è diretto, concreto e senza filtri — dici le cose come stanno, anche quando non piacciono. Ogni affermazione è supportata da almeno un dato numerico. Scrivi in seconda persona singolare (tu, il tuo canale) per rendere ogni analisi personale e immediata.

**REGOLA ASSOLUTA — ANNI DI ATTIVITÀ:** NON menzionare mai la data di apertura del canale, gli anni di attività, né fare confronti del tipo "X follower dopo Y anni". Molti streamer aprono il canale anni prima di iniziare davvero a streammare — questo dato non è un indicatore affidabile e non deve comparire in nessuna slide. Ignora completamente qualsiasi informazione sulla data di creazione del canale.

**REGOLA ASSOLUTA — VISUALIZZAZIONI CANALE:** NON includere mai le visualizzazioni totali del canale in nessuna slide dell'analisi. Non è un dato recuperabile in modo affidabile tramite API e non aggiunge valore all'analisi. Rimuovilo dalla Fotografia Canale e da qualsiasi altra sezione in cui potrebbe comparire.

## DATI CANALE
- Username: ${twitch_username || 'non specificato'}
- Follower totali: ${total_followers || 0}
- Visualizzazioni totali canale: ${total_views ? Number(total_views).toLocaleString('it-IT') : 'non disponibile'}
- Spettatori medi: ${avg_viewers || 'non specificato'}${is_live ? ' *(rilevato in diretta)*' : ''}
- Sub attuali: ${current_subs || 0}
- Giochi principali: ${main_games || 'non specificato'}
- Ore di streaming: ${hoursStr}
- Obiettivo principale: ${main_goal || 'non specificato'}
- Social media: ${socialsStr}
- Orari delle live: ${stream_schedule || 'non specificato'}
- Età media pubblico: ${audience_age || 'non specificato'}
- Lingua delle live: ${language || 'non specificato'}
- Collaborazioni con altri streamer: ${collaboratedStr}
- Principale debolezza percepita: ${main_weakness || 'non specificata'}${monthly_follower_growth ? `\n- Crescita follower mensile: ${monthly_follower_growth}` : ''}

## ISTRUZIONI
Genera un'analisi strutturata con esattamente le seguenti sezioni in Markdown. Ogni sezione inizia con ### (tre hashtag). Non aggiungere testo prima della prima sezione né dopo l'ultima riga ---. Ogni paragrafo massimo 3-4 righe.

### 💬 Intro
Struttura questa sezione con esattamente 3 bullet sintetici, senza paragrafi né muri di testo:
- ✅ **Cosa funziona bene** — il punto di forza principale del canale in una frase (massimo 15 parole)
- ⚠️ **Cosa frena la crescita** — il blocco principale in una frase (massimo 15 parole)
- 🚀 **Cosa faremo** — l'obiettivo dell'analisi in una frase (massimo 15 parole)

### 📊 Fotografia del Canale
Struttura questa sezione come una dashboard visiva a schede, non come testo piatto. Usa questo formato esatto per ogni dato disponibile:

**📌 Follower totali:** [valore]
**🎯 Subscriber attivi:** [valore]
**👁️ Spettatori medi per sessione:** [valore]
**⏱️ Ore streaming settimanali:** [valore]
**🕐 Orario principale:** [valore]
**🎮 Giochi principali:** [valore]

Non includere schede per dati non disponibili. Dopo le schede, aggiungi una riga con il viewer ratio calcolato (spettatori÷follower×100) e il confronto con la media italiana (~1-3%). Se un dato non è disponibile, omettilo completamente — non scrivere N/D né spiegazioni.

### 🎯 Score per Area
Prima degli score per area, mostra il punteggio globale calcolato come media pesata di tutti i punteggi nel formato esatto: **Punteggio complessivo: X.X/10**. Poi elenca i dettagli:
Valuta ogni area con punteggio su 10 e indicatore emoji (🟢 ≥7, 🟡 4-6, 🔴 ≤3). Una riga di motivazione concreta per ognuna:
- **Community**: X/10 🟢/🟡/🔴 — [motivazione specifica con dato]
- **Monetizzazione**: X/10 🟢/🟡/🔴 — [motivazione specifica con dato]
- **Discovery**: X/10 🟢/🟡/🔴 — [motivazione specifica con dato]
- **Costanza**: X/10 🟢/🟡/🔴 — [motivazione specifica con dato]
- **Contenuto**: X/10 🟢/🟡/🔴 — [motivazione specifica con dato]

### 🔍 Analisi Competitor
Cerca streamer italiani reali e verificabili su Twitch con caratteristiche simili allo streamer analizzato (stessi giochi o genere simile, fascia follower comparabile ±50%). Usa solo streamer che esistono con certezza su Twitch — non inventare nomi. Per ogni competitor indica: nome canale Twitch, follower approssimativi, giochi principali, punto di forza distintivo. Dopo la descrizione di ogni competitor, aggiungi obbligatoriamente questa riga nel formato esatto:
**💡 Cosa puoi fare tu:** [una sola azione concreta di massimo 10 parole che lo streamer può replicare immediatamente]
Se non riesci a identificare competitor italiani reali e verificati, cita competitor internazionali noti nello stesso genere invece di inventare nomi italiani.

### 💪 Asset Strategici
Identifica 2-3 punti di forza reali di questo canale basati esclusivamente sui dati forniti. Per ognuno: cita il dato numerico che lo dimostra e spiega perché è un vantaggio competitivo concreto rispetto ai canali della stessa dimensione.

### ⚠️ Gap da Colmare
Identifica 2-3 aree dove stai lasciando crescita sul tavolo. Ogni gap deve iniziare con un'etichetta di priorità visiva nel formato esatto:
- 🔴 **Urgente** se impatta direttamente la crescita nel breve termine
- 🟡 **Medio termine** se importante ma non bloccante
Metti la priorità prima del titolo del gap. Per ognuno: quantifica il potenziale non sfruttato con un numero (es. "+X follower/mese"), identifica la causa principale, indica la soluzione diretta e implementabile.

### ⚡ Quick Wins — 7 Giorni
Esattamente 3 azioni ad alto impatto e basso sforzo, implementabili questa settimana. Per ognuna: cosa fare esattamente (non generico), quanto tempo richiede, risultato atteso quantificato.

### 🎮 Strategia Giochi
Suggerisci 3-4 giochi strategici per questa dimensione di canale usando trend aggiornati alla data corrente — non presentare giochi usciti più di 6 mesi fa come "novità del momento". NON includere statistiche con numeri precisi di canali o spettatori (es. "500 canali, 10.000 spettatori") — questi dati diventano obsoleti rapidamente. Per ogni gioco descrivi: il nome, perché si adatta alla personalità e allo stile dello streamer, perché il suo pubblico potrebbe apprezzarlo, e usa termini qualitativi come "bassa saturazione", "community attiva", "favorisce l'interazione" al posto di numeri hardcodati. Includi almeno un "hidden gem" a bassa saturazione.

### 📅 Piano Editoriale — 4 Settimane
Piano settimanale con focus tematico, tipo contenuto e obiettivo misurabile:
**Settimana 1 — [Focus]:** [descrizione concisa + obiettivo numerico]
**Settimana 2 — [Focus]:** [descrizione concisa + obiettivo numerico]
**Settimana 3 — [Focus]:** [descrizione concisa + obiettivo numerico]
**Settimana 4 — [Focus]:** [descrizione concisa + obiettivo numerico]

### 🚀 Roadmap 30/60/90 Giorni
Piano con KPI specifici e azioni concrete:
- **30 giorni** — Target [metrica]: [2-3 azioni specifiche da fare]
- **60 giorni** — Target [metrica]: [2-3 azioni di follow-up specifiche]
- **90 giorni** — Target [metrica]: [obiettivo principale con proiezione numerica realistica]

### 📈 Proiezione Crescita
3 scenari di crescita realistici e differenziati basati sui dati attuali:
- **Scenario conservativo** (stesse abitudini): +X follower in 90 giorni — [perché]
- **Scenario moderato** (implementi 50% consigli): +X follower in 90 giorni — [perché]
- **Scenario ottimistico** (implementi tutto): +X follower in 90 giorni — [perché]
${prevSection}

### 🎯 Inizia Adesso
Scrivi esattamente questo testo personalizzato senza modifiche al formato:
**${twitch_username || 'Streamer'}, inizia il tuo trial gratuito →**
Prova gratis 7 giorni · Annulla quando vuoi

---
Analisi generata da StreaMindAI · streamindai.com

---
Rispondi **esclusivamente in italiano**. Non aggiungere testo prima della prima sezione ### né dopo l'ultima riga ---.`;
}

// ── HTML email con l'analisi ──────────────────────────────────────────────────
function buildEmailHtml(analysis, username) {
  const escapedAnalysis = analysis
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Converti Markdown base in HTML per l'email
    .replace(/^### (.+)$/gm, '<h3 style="color:#8B5CF6;margin:20px 0 8px;font-size:15px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#f0f0f0;margin:24px 0 12px">$2</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- (.+)/g, '<br>• $1')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0d0d0d;color:#f0f0f0;font-family:Inter,Arial,sans-serif;padding:40px 20px;max-width:640px;margin:0 auto">
  <div style="text-align:center;margin-bottom:32px">
    <div style="font-size:24px;font-weight:900;color:#8B5CF6">StreaMindAI</div>
    <p style="color:#6b6b6b;font-size:14px;margin-top:4px">Dai una mente al tuo stream</p>
  </div>

  <div style="background:#151515;border:1px solid #262626;border-radius:16px;padding:32px">
    <h1 style="font-size:20px;font-weight:700;margin:0 0 8px">La tua analisi è pronta${username ? `, @${username}` : ''}!</h1>
    <p style="color:#6b6b6b;font-size:14px;margin:0 0 28px">Ecco cosa abbiamo trovato analizzando il tuo canale Twitch.</p>

    <div style="font-size:15px;line-height:1.7;color:#a0a0a0">
      ${escapedAnalysis}
    </div>
  </div>

  <div style="background:linear-gradient(135deg,rgba(139,92,246,0.12),rgba(139,92,246,0.04));border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:28px;margin-top:24px;text-align:center">
    <p style="font-size:16px;font-weight:700;margin:0 0 8px">Vuoi raggiungere questi obiettivi?</p>
    <p style="color:#6b6b6b;font-size:14px;margin:0 0 20px">L'AI che ti aiuta attivamente ogni sera sul tuo canale Twitch.</p>
    <a href="${process.env.FRONTEND_URL || 'https://streamindai.com'}/login"
       style="display:inline-block;background:#8B5CF6;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
      Inizia gratis con StreaMindAI →
    </a>
  </div>

  <p style="text-align:center;color:#3a3a3a;font-size:12px;margin-top:24px">
    StreaMindAI · Dai una mente al tuo stream<br>
    Hai ricevuto questa email perché hai richiesto un'analisi gratuita.
  </p>
</body>
</html>`;
}

// ── POST /api/analytics/analyze — pubblico, no auth ───────────────────────────
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{1,25}$/;
const DANGEROUS   = /<[^>]*>|javascript:|on\w+=/i;
const MAX_NUM     = 9_999_999;
const NUM_KEYS    = ['avg_viewers', 'hours_per_month', 'total_followers', 'monthly_follower_growth', 'current_subs'];
const TEXT_KEYS   = ['main_games', 'stream_schedule', 'social_links'];

// ── GET /api/analytics/twitch-data — dati Twitch per l'utente loggato ────────
analyticsRoutes.get('/twitch-data', requireAuth, async (req, res) => {
  const { twitch_id, twitch_username } = req.user;
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    return res.json({ twitch_username });
  }
  try {
    const token = await getTwitchAppToken();
    const headers = {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    };

    const [followersR, videosR, userR, streamR, channelR] = await Promise.allSettled([
      axios.get('https://api.twitch.tv/helix/channels/followers', {
        params: { broadcaster_id: twitch_id, first: 1 },
        headers, timeout: 8_000,
      }),
      axios.get('https://api.twitch.tv/helix/videos', {
        params: { user_id: twitch_id, type: 'archive', first: 20 },
        headers, timeout: 8_000,
      }),
      axios.get('https://api.twitch.tv/helix/users', {
        params: { login: twitch_username },
        headers, timeout: 8_000,
      }),
      axios.get('https://api.twitch.tv/helix/streams', {
        params: { user_id: twitch_id },
        headers, timeout: 8_000,
      }),
      axios.get('https://api.twitch.tv/helix/channels', {
        params: { broadcaster_id: twitch_id },
        headers, timeout: 8_000,
      }),
    ]);

    // Follower totali
    const totalFollowers = followersR.status === 'fulfilled'
      ? (followersR.value.data?.total ?? null) : null;

    // Ultimi 5 giochi unici dagli archivi
    const videos = videosR.status === 'fulfilled' ? (videosR.value.data?.data ?? []) : [];
    const seenGames = new Set();
    const recentGames = [];
    for (const v of videos) {
      if (v.game_name && !seenGames.has(v.game_name) && recentGames.length < 5) {
        recentGames.push(v.game_name);
        seenGames.add(v.game_name);
      }
    }
    // Fallback: gioco corrente del canale
    if (recentGames.length === 0 && channelR.status === 'fulfilled') {
      const gameName = channelR.value.data?.data?.[0]?.game_name;
      if (gameName) recentGames.push(gameName);
    }

    // Anni di attività dalla data creazione account
    const userData = userR.status === 'fulfilled' ? (userR.value.data?.data?.[0] ?? null) : null;
    let yearsActive = null;
    if (userData?.created_at) {
      const ms = Date.now() - new Date(userData.created_at).getTime();
      const y  = ms / (365.25 * 24 * 60 * 60 * 1000);
      yearsActive = y >= 1 ? Math.floor(y) : parseFloat(y.toFixed(1));
    }

    // Spettatori attuali (solo se in live)
    const liveStream = streamR.status === 'fulfilled' ? (streamR.value.data?.data?.[0] ?? null) : null;

    res.json({
      twitch_username,
      total_followers: totalFollowers,
      total_views:     userData?.view_count ?? null,
      created_at:      userData?.created_at ?? null,
      main_games:      recentGames.length > 0 ? recentGames.join(', ') : null,
      years_active:    yearsActive,
      avg_viewers:     liveStream?.viewer_count ?? null,
      is_live:         liveStream != null,
    });
  } catch (err) {
    console.error('[Analytics] twitch-data:', err.message);
    res.json({ twitch_username });
  }
});

// ── GET /api/analytics/my-analysis — analisi esistente per utente loggato ────
analyticsRoutes.get('/my-analysis', requireAuth, async (req, res) => {
  const { twitch_id } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT id, public_token, twitch_username, analysis_generated, generated_at, next_generation_at, form_data
       FROM analytics_leads WHERE twitch_id = $1`,
      [twitch_id]
    );
    if (!rows[0] || !rows[0].analysis_generated) {
      return res.json({ analysis: null });
    }
    res.json({
      id:                 rows[0].id,
      public_token:       rows[0].public_token,
      analysis:           rows[0].analysis_generated,
      generated_at:       rows[0].generated_at,
      next_generation_at: rows[0].next_generation_at,
      form_data:          rows[0].form_data,
    });
  } catch (err) {
    console.error('[Analytics] my-analysis:', err.message);
    res.status(500).json({ error: "Errore nel recupero dell'analisi." });
  }
});

// ── POST /api/analytics/generate — genera/rigenera analisi per utente loggato ─
analyticsRoutes.post('/generate', requireAuth, async (req, res) => {
  const { twitch_id, twitch_username: jwtUsername, streamer_id } = req.user;
  const formData = req.body;

  for (const key of TEXT_KEYS) {
    if (formData[key] && DANGEROUS.test(formData[key])) {
      return res.status(400).json({ error: 'Contenuto non consentito nei campi testo.' });
    }
  }

  const { rows: existing } = await pool.query(
    `SELECT id, next_generation_at, analysis_generated FROM analytics_leads WHERE twitch_id = $1`,
    [twitch_id]
  );
  if (existing[0]?.next_generation_at && new Date(existing[0].next_generation_at) > new Date()) {
    const d = new Date(existing[0].next_generation_at).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    return res.status(429).json({
      error: `Puoi rigenerare l'analisi a partire dal ${d}.`,
      next_generation_at: existing[0].next_generation_at,
    });
  }

  try {
    const usernameForPrompt = formData.twitch_username?.trim() || jwtUsername;
    const isRegen = !!(existing[0]?.analysis_generated);
    const analysis = await callGemini(buildPrompt({
      ...formData,
      twitch_username:   usernameForPrompt,
      previous_analysis: isRegen ? existing[0].analysis_generated : null,
      analysis_count:    isRegen ? 2 : 1,
    }));
    const nextGen = new Date(Date.now() + 30 * 24 * 60 * 60_000);

    let id, public_token;
    if (existing[0]) {
      const { rows } = await pool.query(
        `UPDATE analytics_leads
         SET analysis_generated=$1, generated_at=NOW(), next_generation_at=$2, form_data=$3
         WHERE twitch_id=$4 RETURNING id, public_token`,
        [analysis, nextGen, JSON.stringify(formData), twitch_id]
      );
      id = rows[0].id;
      public_token = rows[0].public_token;
    } else {
      const { rows: sRows } = await pool.query(
        `SELECT email FROM streamers WHERE id = $1`, [streamer_id]
      );
      const email = sRows[0]?.email ?? null;
      const { rows } = await pool.query(
        `INSERT INTO analytics_leads
           (twitch_id, twitch_username, email, form_data, analysis_generated, generated_at, next_generation_at)
         VALUES ($1,$2,$3,$4,$5,NOW(),$6) RETURNING id, public_token`,
        [twitch_id, usernameForPrompt, email, JSON.stringify(formData), analysis, nextGen]
      );
      id = rows[0].id;
      public_token = rows[0].public_token;
    }

    res.json({ analysis, id, public_token });
  } catch (err) {
    console.error('[Analytics] generate:', err.message);
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Servizio temporaneamente sovraccarico. Riprova tra qualche minuto.' });
    }
    res.status(500).json({ error: "Errore durante la generazione dell'analisi. Riprova." });
  }
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── GET /api/analytics/:id — recupera analisi pubblica per link condivisibile ──
// Accetta sia UUID (public_token) che ID numerico (backward compat per link esistenti)
analyticsRoutes.get('/:id', async (req, res) => {
  const param = req.params.id;
  let query, params;

  if (UUID_RE.test(param)) {
    query  = `SELECT id, twitch_username, analysis_generated, created_at FROM analytics_leads WHERE public_token = $1`;
    params = [param];
  } else {
    const id = parseInt(param, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: 'ID non valido.' });
    }
    query  = `SELECT id, twitch_username, analysis_generated, created_at FROM analytics_leads WHERE id = $1`;
    params = [id];
  }

  try {
    const { rows } = await pool.query(query, params);
    if (!rows[0] || !rows[0].analysis_generated) {
      return res.status(404).json({ error: 'Analisi non trovata.' });
    }
    res.json({
      id:              rows[0].id,
      twitch_username: rows[0].twitch_username,
      analysis:        rows[0].analysis_generated,
      created_at:      rows[0].created_at,
    });
  } catch (err) {
    console.error('[Analytics] GET /:id:', err.message);
    res.status(500).json({ error: "Errore nel recupero dell'analisi." });
  }
});

// ── POST /api/analytics/analyze — pubblico, no auth ───────────────────────────
analyticsRoutes.post('/analyze', async (req, res) => {
  const { email, ...formData } = req.body;

  const emailClean    = email?.trim().toLowerCase();
  const usernameClean = formData.twitch_username?.trim().toLowerCase();

  if (!emailClean) {
    return res.status(400).json({ error: 'L\'email è obbligatoria.' });
  }
  if (!EMAIL_RE.test(emailClean)) {
    return res.status(400).json({ error: 'Email non valida.' });
  }
  if (!usernameClean) {
    return res.status(400).json({ error: 'L\'username Twitch è obbligatorio.' });
  }
  if (!USERNAME_RE.test(usernameClean)) {
    return res.status(400).json({ error: 'Username Twitch non valido: solo lettere, numeri e underscore, max 25 caratteri.' });
  }
  for (const key of NUM_KEYS) {
    const raw = formData[key];
    if (raw !== undefined && raw !== '') {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0 || n > MAX_NUM) {
        return res.status(400).json({ error: `Valore non valido per campo numerico (max ${MAX_NUM.toLocaleString()}).` });
      }
    }
  }
  for (const key of TEXT_KEYS) {
    if (formData[key] && DANGEROUS.test(formData[key])) {
      return res.status(400).json({ error: 'Contenuto non consentito nei campi testo.' });
    }
  }

  // 1. Email già usata in precedenza
  const emailUsed = await pool.query(
    'SELECT 1 FROM analytics_leads WHERE email = $1 LIMIT 1',
    [emailClean]
  );
  if (emailUsed.rowCount > 0) {
    return res.status(409).json({ error: 'Questa email ha già ricevuto un\'analisi. Ogni email può essere usata una sola volta.' });
  }

  // 2. Username Twitch già usato in precedenza
  const usernameUsed = await pool.query(
    'SELECT 1 FROM analytics_leads WHERE LOWER(twitch_username) = $1 LIMIT 1',
    [usernameClean]
  );
  if (usernameUsed.rowCount > 0) {
    return res.status(409).json({ error: 'Questo canale Twitch ha già ricevuto un\'analisi. Ogni canale può essere analizzato una sola volta.' });
  }

  // 3. Verifica che l'username Twitch esista davvero
  const exists = await twitchUserExists(usernameClean);
  if (!exists) {
    return res.status(400).json({ error: `Il canale Twitch "@${formData.twitch_username}" non esiste. Controlla di aver scritto correttamente il tuo username.` });
  }

  try {
    const analysis = await callGemini(buildPrompt({ ...formData }));

    // 2. Salva nel DB
    const { rows } = await pool.query(
      `INSERT INTO analytics_leads (email, twitch_username, form_data, analysis_generated)
       VALUES ($1, $2, $3, $4) RETURNING id, public_token`,
      [
        email.trim().toLowerCase(),
        formData.twitch_username || null,
        JSON.stringify({ email, ...formData }),
        analysis,
      ]
    );

    // 3. Invia email con il report (best-effort, non blocca la risposta)
    sendAnalysisReportEmail({
      to:             email.trim(),
      twitchUsername: formData.twitch_username || null,
      analysis,
    }).catch(err => console.error('[Email] analysis-report:', err.message));

    res.json({ analysis, id: rows[0].id, public_token: rows[0].public_token });

  } catch (err) {
    console.error('Analytics analyze error:', err.message);
    console.error('Analytics response data:', JSON.stringify(err.response?.data));
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Servizio temporaneamente sovraccarico. Riprova tra qualche minuto.' });
    }
    res.status(500).json({ error: 'Errore durante la generazione dell\'analisi. Riprova.' });
  }
});

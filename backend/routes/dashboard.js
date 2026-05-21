import { Router } from 'express';
import axios from 'axios';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurata');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const r = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 6144 },
  }, { timeout: 60_000 });
  const text = r.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Risposta Gemini vuota');
  return text;
}

function buildMonthlyPrompt(data) {
  return `Sei un esperto di crescita per streamer Twitch italiani. Crea un'analisi mensile del canale.

## DATI DEL CANALE
- Username: @${data.twitch_username ?? 'sconosciuto'}
- Display name: ${data.display_name ?? 'sconosciuto'}
- Piano abbonamento: ${data.plan ?? 'starter'}
- Messaggi bot questo mese: ${data.messages_month ?? 0}
- Memorie salvate dal bot (totale): ${data.memories_total ?? 0}
- Utilizzo medio giornaliero (ultimi 7gg): ${data.avg_daily ?? 0} messaggi/giorno

## ISTRUZIONI
Crea una breve analisi mensile strutturata. Usa sezioni in Markdown con ###:

### 📊 Riepilogo del mese
Analisi sintetica dei dati di utilizzo: engagement, attività del bot, tendenze.

### 🎯 Obiettivi per il prossimo mese
3 obiettivi concreti e misurabili per il mese successivo.

### 💡 Consigli strategici
2-3 consigli pratici e specifici per migliorare la crescita del canale.

### 📈 Proiezione crescita
Stima realistica di miglioramento per il prossimo mese in base all'utilizzo attuale.

Rispondi esclusivamente in italiano, tono professionale ma diretto, massimo 500 parole totali.`;
}

export const dashboardRoutes = Router();

// Handler riutilizzabile — esportato per il mount su /api/stats in server.js
export async function statsHandler(req, res) {
  try {
    const sid   = req.user.streamer_id;
    const today = new Date().toISOString().slice(0, 10);
    const yest  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const week  = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

    const [
      todayRes,
      yestRes,
      memTotalRes,
      memWeekRes,
      subRes,
      usageWeekRes,
    ] = await Promise.all([
      // Messaggi oggi
      pool.query(
        `SELECT COALESCE(SUM(count), 0) AS n
         FROM bot_daily_usage WHERE streamer_id = $1 AND usage_date = $2`,
        [sid, today]
      ),
      // Messaggi ieri (per delta)
      pool.query(
        `SELECT COALESCE(SUM(count), 0) AS n
         FROM bot_daily_usage WHERE streamer_id = $1 AND usage_date = $2`,
        [sid, yest]
      ),
      // Totale memorie
      pool.query(
        'SELECT COUNT(*) AS n FROM bot_memories WHERE streamer_id = $1',
        [sid]
      ),
      // Memorie ultimi 7 giorni
      pool.query(
        `SELECT COUNT(*) AS n FROM bot_memories
         WHERE streamer_id = $1 AND created_at >= $2`,
        [sid, week]
      ),
      // Stato abbonamento
      pool.query(
        `SELECT subscription_status, subscription_plan, subscription_end
         FROM streamers WHERE id = $1`,
        [sid]
      ),
      // Utilizzo ultimi 7 giorni (per grafico) — cast a text garantisce formato YYYY-MM-DD
      pool.query(
        `SELECT usage_date::text, SUM(count) AS n
         FROM bot_daily_usage
         WHERE streamer_id = $1 AND usage_date >= $2
         GROUP BY usage_date ORDER BY usage_date ASC`,
        [sid, week]
      ),
    ]);

    const sub        = subRes.rows[0]   ?? {};
    const msgToday   = parseInt(todayRes.rows[0].n);
    const msgYest    = parseInt(yestRes.rows[0].n);
    const memTotal   = parseInt(memTotalRes.rows[0].n);
    const memWeek    = parseInt(memWeekRes.rows[0].n);
    const isActive   = sub.subscription_status === 'active' || sub.subscription_status === 'cancelling';

    // Calcola quanti giorni del piano sono rimasti
    let daysRemaining = null;
    let totalDays     = null;
    if (sub.subscription_end) {
      const end   = new Date(sub.subscription_end);
      const now   = new Date();
      daysRemaining = Math.max(0, Math.ceil((end - now) / 86_400_000));
      totalDays   = 30;
    }

    res.json({
      bot_status:            isActive ? 'online' : 'offline',
      bot_name:              null, // risolto dalla /api/config
      messages_today:        msgToday,
      messages_today_delta:  msgToday - msgYest,
      memories_count:        memTotal,
      memories_this_week:    memWeek,
      subscription: {
        status:        sub.subscription_status ?? 'inactive',
        plan:          sub.subscription_plan   ?? null,
        end:           sub.subscription_end    ?? null,
        days_remaining: daysRemaining,
        total_days:     totalDays,
      },
      usage_last_7_days: usageWeekRes.rows.map(r => ({
        date:  r.usage_date,
        count: parseInt(r.n),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
}

// ── GET /api/dashboard/stats ──────────────────────────────────────────────────
dashboardRoutes.get('/stats', requireAuth, statsHandler);

// ── GET /api/dashboard/analysis — ultima analisi mensile del canale ───────────
dashboardRoutes.get('/analysis', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT analysis, generated_at FROM dashboard_analyses
       WHERE streamer_id = $1 ORDER BY generated_at DESC LIMIT 1`,
      [req.user.streamer_id]
    );
    res.json(rows[0] ? { analysis: rows[0].analysis, generated_at: rows[0].generated_at } : { analysis: null });
  } catch (err) {
    console.error('[Dashboard] GET /analysis:', err.message);
    res.status(500).json({ error: "Errore nel recupero dell'analisi." });
  }
});

// ── POST /api/dashboard/analysis/generate — genera analisi mensile ────────────
dashboardRoutes.post('/analysis/generate', requireAuth, async (req, res) => {
  try {
    // Solo abbonati attivi
    const { rows: subs } = await pool.query(
      'SELECT subscription_status, subscription_plan FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const s = subs[0] ?? {};
    const isActive = ['active', 'cancelling', 'trialing'].includes(s.subscription_status);
    if (!isActive) {
      return res.status(403).json({ error: 'Funzione riservata agli abbonati. Attiva StreaMindAI per accedere.' });
    }

    // Limite: 1 generazione ogni 24 ore
    const { rowCount: recent } = await pool.query(
      `SELECT 1 FROM dashboard_analyses
       WHERE streamer_id = $1 AND generated_at >= NOW() - INTERVAL '24 hours'`,
      [req.user.streamer_id]
    );
    if (recent > 0) {
      return res.status(429).json({ error: 'Puoi generare una nuova analisi al massimo ogni 24 ore.' });
    }

    // Dati streamer per il prompt
    const { rows: data } = await pool.query(
      `SELECT s.twitch_username, s.display_name, s.subscription_plan AS plan,
              COALESCE((
                SELECT SUM(bdu.count) FROM bot_daily_usage bdu
                WHERE bdu.streamer_id = s.id AND bdu.usage_date >= DATE_TRUNC('month', NOW())
              ), 0) AS messages_month,
              COALESCE((
                SELECT AVG(daily_sum) FROM (
                  SELECT SUM(bdu2.count) AS daily_sum FROM bot_daily_usage bdu2
                  WHERE bdu2.streamer_id = s.id AND bdu2.usage_date >= NOW() - INTERVAL '7 days'
                  GROUP BY bdu2.usage_date
                ) t
              ), 0) AS avg_daily,
              (SELECT COUNT(*) FROM bot_memories bm WHERE bm.streamer_id = s.id) AS memories_total
       FROM streamers s WHERE s.id = $1`,
      [req.user.streamer_id]
    );

    const analysis = await callGemini(buildMonthlyPrompt(data[0] ?? {}));

    await pool.query(
      'INSERT INTO dashboard_analyses (streamer_id, analysis) VALUES ($1, $2)',
      [req.user.streamer_id, analysis]
    );

    res.json({ analysis, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[Dashboard] POST /analysis/generate:', err.message);
    if (err.response?.status === 429) {
      return res.status(503).json({ error: 'Servizio AI temporaneamente sovraccarico. Riprova tra qualche minuto.' });
    }
    res.status(500).json({ error: 'Errore durante la generazione. Riprova.' });
  }
});

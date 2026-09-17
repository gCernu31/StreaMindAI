import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { readFileSync } from 'fs';
import pool from './db.js';
import { authenticateToken } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes, statsHandler } from './routes/dashboard.js';
import { configRoutes } from './routes/config.js';
import { memoryRoutes } from './routes/memory.js';
import { subscriptionRoutes, stripeWebhook } from './routes/subscription.js';
import { contactRoutes } from './routes/contact.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { spotifyRoutes }    from './routes/spotify.js';
import { referralRoutes }  from './routes/referral.js';
import { statusRoutes }    from './routes/status.js';
import { usersRoutes }    from './routes/users.js';
import { commandsRoutes } from './routes/commands.js';
import { botManager, verifyEventSubSignature } from './bot/botManager.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Rate limiting ─────────────────────────────────────────────────────────────
const contactLimiter  = rateLimit({ windowMs: 60*60*1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: "Troppe richieste. Riprova tra un'ora." } });
const authLimiter     = rateLimit({ windowMs: 15*60*1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Troppe richieste di autenticazione.' } });

// ── CORS ──────────────────────────────────────────────────────────────────────
// Supporta CORS_ORIGINS (lista separata da virgola) o il singolo FRONTEND_URL
const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = new Set(
  rawOrigins.split(',').map(s => s.trim()).filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    // Richieste senza origin (Postman, curl, server-to-server) sono sempre ok
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error(`CORS: origine non autorizzata — ${origin}`));
  },
  credentials: true,
}));

// ── Webhook Stripe — raw body PRIMA di express.json() ─────────────────────────
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.post('/webhooks/stripe',          express.raw({ type: 'application/json' }), stripeWebhook);

// ── Webhook Twitch EventSub — raw body per verifica firma ─────────────────────
app.post('/webhooks/twitch-eventsub', express.raw({ type: 'application/json' }), (req, res) => {
  const messageId   = req.headers['twitch-eventsub-message-id']        ?? '';
  const timestamp   = req.headers['twitch-eventsub-message-timestamp'] ?? '';
  const messageType = req.headers['twitch-eventsub-message-type']      ?? '';
  const subType     = req.headers['twitch-eventsub-subscription-type'] ?? '';
  const signature   = req.headers['twitch-eventsub-message-signature'] ?? '';
  const rawBody     = req.body.toString('utf8');
  console.log('[EventSub] Webhook ricevuto:', messageType, subType);

  if (!verifyEventSubSignature(messageId, timestamp, rawBody, signature)) {
    return res.status(403).send('Firma non valida');
  }

  let body;
  try { body = JSON.parse(rawBody); } catch { return res.status(400).send('JSON non valido'); }

  // Verifica challenge (primo handshake)
  if (messageType === 'webhook_callback_verification') {
    return res.status(200).send(body.challenge);
  }

  res.status(204).send();

  // Notifica asincrona al botManager
  if (messageType === 'notification') {
    botManager.handleEventSubNotification(subType, body.event)
              .catch(e => console.error('[EventSub] handler:', e.message));
  }
});

app.use(express.json());

// ── Static files (produzione) — Express serve la SPA React ───────────────────
const distPath = join(__dirname, '..', 'frontend', 'dist');

if (isProd) {
  app.use(express.static(distPath));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'streammindai-api', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── GET /api/me ───────────────────────────────────────────────────────────────
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, twitch_username, display_name, email, avatar_url,
              subscription_status, subscription_plan, subscription_end,
              chat_messages_count, event_messages_count, monthly_reset_date,
              monthly_tokens_used, monthly_tokens_limit, tokens_reset_at,
              extra_tokens, extra_tokens_expires_at
       FROM streamers WHERE id = $1`,
      [req.user.streamer_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utente non trovato' });
    const u = rows[0];
    const now = new Date();
    const extraTokensActive = (u.extra_tokens ?? 0) > 0 &&
      u.extra_tokens_expires_at != null &&
      new Date(u.extra_tokens_expires_at) > now;
    res.json({
      id:              u.id,
      twitch_username: u.twitch_username,
      display_name:    u.display_name,
      email:           u.email,
      avatar:          u.avatar_url,
      subscription: {
        status: u.subscription_status ?? 'inactive',
        plan:   u.subscription_plan   ?? null,
        end:    u.subscription_end    ?? null,
      },
      monthly_messages: {
        count:       u.monthly_tokens_used   ?? 0,
        limit:       u.monthly_tokens_limit  ?? 0,
        event_count: u.event_messages_count  ?? 0,
        reset_date:  u.tokens_reset_at       ?? u.monthly_reset_date ?? null,
      },
      extra_tokens: {
        count:  extraTokensActive ? (u.extra_tokens ?? 0) : 0,
        expiry: extraTokensActive ? u.extra_tokens_expires_at : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero del profilo' });
  }
});

// ── Rate limiters specifici (prima del mount delle route) ────────────────────
app.use('/api/contact',           contactLimiter);
app.use('/api/auth',              authLimiter);

// ── Route pubbliche (no auth) ─────────────────────────────────────────────────
app.use('/api/contact',     contactRoutes);
app.use('/api/onboarding',  onboardingRoutes);
app.use('/api/spotify',     spotifyRoutes);

// ── Routes con prefisso ───────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/stats',        authenticateToken, statsHandler);
app.use('/api/config',       configRoutes);
app.use('/api/memories',     memoryRoutes);
app.use('/api/memory',       memoryRoutes);   // alias backward-compat
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/referral',    referralRoutes);
app.use('/api/status',      statusRoutes);
app.use('/api/users',       usersRoutes);
app.use('/api/commands',   commandsRoutes);

// ── Debug temporaneo: utilizzo zampe97ttv ────────────────────────────────────
app.get('/api/debug/zampe', async (req, res) => {
  if (req.query.key !== 'streamind-debug-2026') return res.status(401).json({ error: 'non autorizzato' });
  try {
    const streamer = await pool.query(`
      SELECT id, twitch_username, subscription_plan, subscription_status,
             subscription_started_at, subscription_current_period_end,
             monthly_tokens_used, monthly_tokens_limit, extra_tokens,
             bot_active, created_at
      FROM streamers WHERE twitch_username = 'zampe97ttv'
    `);
    console.log('===ZAMPE-DATA===', JSON.stringify(streamer.rows, null, 2));

    const usage = await pool.query(`
      SELECT usage_date, SUM(count) as responses, COUNT(DISTINCT username) as users
      FROM bot_daily_usage
      WHERE streamer_id = (SELECT id FROM streamers WHERE twitch_username = 'zampe97ttv')
      GROUP BY usage_date ORDER BY usage_date
    `);
    console.log('===ZAMPE-USAGE===', JSON.stringify(usage.rows, null, 2));

    const topUsers = await pool.query(`
      SELECT username, SUM(count) as total_responses
      FROM bot_daily_usage
      WHERE streamer_id = (SELECT id FROM streamers WHERE twitch_username = 'zampe97ttv')
      GROUP BY username ORDER BY total_responses DESC LIMIT 20
    `);

    res.json({ streamer: streamer.rows, usage: usage.rows, top_users: topUsers.rows });
  } catch (err) {
    console.error('===ZAMPE-ERROR===', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── React Router catch-all (produzione) ──────────────────────────────────────
// DEVE stare dopo tutte le route API
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // In sviluppo restituisce 404 per path non trovati
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint non trovato' });
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Errore interno del server' });
});

// ── Avvio ─────────────────────────────────────────────────────────────────────
async function runMigrations() {
  try {
    const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('   Migrazioni: applicate');
  } catch (err) {
    console.error('⚠️  Migrazione schema parzialmente fallita:', err.message);
    // Non blocca l'avvio — la maggior parte delle tabelle esiste già
  }
}

pool.query('SELECT 1')
  .then(async () => {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`🟣 StreaMindAI API avviata su http://localhost:${PORT}`);
      console.log(`   Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
      console.log(`   Database: connesso`);
      if (isProd) console.log(`   Static:   ${distPath}`);
      botManager.start();
    });
  })
  .catch((err) => {
    console.error('❌ Impossibile connettersi al database:', err.message);
    console.error('   Verifica DATABASE_URL nel file .env');
    process.exit(1);
  });

import express from 'express';
import cors from 'cors';
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
import { analyticsRoutes } from './routes/analytics.js';
import { contactRoutes } from './routes/contact.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { spotifyRoutes }    from './routes/spotify.js';
import { referralRoutes }  from './routes/referral.js';
import { statusRoutes }    from './routes/status.js';
import { usersRoutes }    from './routes/users.js';
import { botManager, verifyEventSubSignature } from './bot/botManager.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

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
              extra_messages, extra_messages_expiry
       FROM streamers WHERE id = $1`,
      [req.user.streamer_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utente non trovato' });
    const u = rows[0];
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
        count:       u.chat_messages_count  ?? 0,
        event_count: u.event_messages_count ?? 0,
        reset_date:  u.monthly_reset_date   ?? null,
      },
      extra_tokens: {
        count:  u.extra_messages        ?? 0,
        expiry: u.extra_messages_expiry ?? null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero del profilo' });
  }
});

// ── Route pubbliche (no auth) ─────────────────────────────────────────────────
app.use('/api/analytics',   analyticsRoutes);
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

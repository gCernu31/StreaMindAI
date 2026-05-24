import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { botManager } from '../bot/botManager.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export const authRoutes = Router();

// ---------------------------------------------------------------------------
// GET /api/auth/twitch — redirect a Twitch per il login OAuth
// ---------------------------------------------------------------------------
authRoutes.get('/twitch', (req, res) => {
  const raw = req.query.redirect_to || '/dashboard';
  const redirectTo = raw.startsWith('/') ? raw : '/dashboard';
  // Codice referral opzionale — codificato nello state come "{redirect}|{ref}"
  const ref = req.query.ref ? String(req.query.ref).toUpperCase().slice(0, 50) : '';
  const state = ref ? `${redirectTo}|${ref}` : redirectTo;
  const params = new URLSearchParams({
    client_id:     process.env.TWITCH_CLIENT_ID,
    redirect_uri:  process.env.TWITCH_REDIRECT_URI,
    response_type: 'code',
    scope:         'user:read:email channel:read:subscriptions bits:read moderator:read:followers channel:read:hype_train',
    state,
  });
  res.redirect(`https://id.twitch.tv/oauth2/authorize?${params}`);
});

// ---------------------------------------------------------------------------
// GET /api/auth/twitch/callback — callback OAuth: crea/aggiorna streamer nel DB
// ---------------------------------------------------------------------------
authRoutes.get('/twitch/callback', async (req, res) => {
  const { code, error, state } = req.query;
  // State può essere "{redirect}" o "{redirect}|{refCode}"
  const pipeIdx    = state ? state.indexOf('|') : -1;
  const rawRedirect = pipeIdx >= 0 ? state.slice(0, pipeIdx) : (state ?? '');
  const refCode    = pipeIdx >= 0 ? state.slice(pipeIdx + 1) : null;
  const redirectTo = rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
  }
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
  }

  try {
    // 1. Scambia il codice autorizzativo con l'access token
    const tokenRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id:     process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  process.env.TWITCH_REDIRECT_URI,
      },
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    const tokenExpiresAt = Date.now() + (expires_in || 14400) * 1000;

    // 2. Recupera i dati utente da Twitch Helix
    const userRes = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Client-Id':   process.env.TWITCH_CLIENT_ID,
      },
    });

    const tw = userRes.data.data[0];
    if (!tw) throw new Error('Nessun utente Twitch restituito');

    // 3. Upsert nella tabella streamers
    const upsertStreamer = `
      INSERT INTO streamers (twitch_id, twitch_username, display_name, email, avatar_url,
                             twitch_access_token, twitch_refresh_token, twitch_token_expires_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (twitch_id) DO UPDATE SET
        twitch_username       = EXCLUDED.twitch_username,
        display_name          = EXCLUDED.display_name,
        email                 = COALESCE(EXCLUDED.email, streamers.email),
        avatar_url            = EXCLUDED.avatar_url,
        twitch_access_token   = EXCLUDED.twitch_access_token,
        twitch_refresh_token  = COALESCE(EXCLUDED.twitch_refresh_token, streamers.twitch_refresh_token),
        twitch_token_expires_at = EXCLUDED.twitch_token_expires_at,
        needs_reauth          = FALSE,
        updated_at            = NOW()
      RETURNING id, subscription_status, subscription_end, referral_code,
                (xmax::text::bigint = 0) as is_new
    `;

    const { rows } = await pool.query(upsertStreamer, [
      tw.id,
      tw.login,
      tw.display_name,
      tw.email || null,
      tw.profile_image_url || null,
      encrypt(access_token),
      refresh_token ? encrypt(refresh_token) : null,
      tokenExpiresAt,
    ]);

    const streamer = rows[0];

    // Genera codice referral se assente (nuovi utenti o migration)
    if (!streamer.referral_code) {
      const candidate = `REF-${tw.login.toUpperCase()}`;
      await pool.query(
        `UPDATE streamers SET referral_code = $1 WHERE id = $2 AND referral_code IS NULL`,
        [candidate, streamer.id]
      );
      streamer.referral_code = candidate;
    }

    // Email di benvenuto solo alla prima registrazione
    if (streamer.is_new && tw.email) {
      sendWelcomeEmail({ to: tw.email, displayName: tw.display_name })
        .catch(e => console.error('[Email] welcome:', e.message));
    }

    // Traccia referral se nuovo utente arrivato tramite link
    if (streamer.is_new && refCode) {
      pool.query(
        `SELECT id FROM streamers WHERE referral_code = $1`,
        [refCode]
      ).then(({ rows: rr }) => {
        if (!rr[0] || rr[0].id === streamer.id) return;
        return pool.query(
          `INSERT INTO referrals (referrer_id, referred_id) VALUES ($1, $2)
           ON CONFLICT (referred_id) DO NOTHING`,
          [rr[0].id, streamer.id]
        );
      }).catch(e => console.error('[Referral] tracking error:', e.message));
    }

    // 4. Crea bot_config di default se è il primo accesso
    await pool.query(
      `INSERT INTO bot_configs (streamer_id, creator_name)
       VALUES ($1, $2)
       ON CONFLICT (streamer_id) DO NOTHING`,
      [streamer.id, tw.display_name]
    );

    // Re-registra EventSub con il token fresco (fix follow e altri eventi user-token)
    botManager.refreshEventSub(tw.login).catch(() => {});

    // 5. Genera JWT sessione con i dati essenziali
    const sessionToken = jwt.sign(
      {
        streamer_id:     streamer.id,
        twitch_id:       tw.id,
        twitch_username: tw.login,
        display_name:    tw.display_name,
        avatar:          tw.profile_image_url,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.FRONTEND_URL}${redirectTo}?token=${sessionToken}`);
  } catch (err) {
    console.error('Errore OAuth Twitch:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/status — verifica se lo streamer necessita ri-autenticazione
// ---------------------------------------------------------------------------
authRoutes.get('/status', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT needs_reauth FROM streamers WHERE id = $1`,
      [req.user.streamer_id]
    );
    res.json({ needs_reauth: rows[0]?.needs_reauth ?? false });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero dello stato' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me — dati utente autenticato (aggiornati dal DB)
// ---------------------------------------------------------------------------
authRoutes.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, twitch_id, twitch_username, display_name, email, avatar_url,
              subscription_status, subscription_end, created_at
       FROM streamers
       WHERE id = $1`,
      [req.user.streamer_id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Streamer non trovato' });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei dati utente' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout — invalida la sessione lato client
// (il JWT rimane valido fino a scadenza; il frontend deve eliminare il token)
// ---------------------------------------------------------------------------
authRoutes.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logout effettuato. Elimina il token lato client.' });
});

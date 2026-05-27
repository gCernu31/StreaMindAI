import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { invalidateBotPromptCache } from '../services/promptBuilder.js';
import { botManager } from '../bot/botManager.js';
import { encrypt } from '../utils/encryption.js';

export const configRoutes = Router();

// Helpers per serializzare/deserializzare campi JSON in colonne TEXT
function tryParse(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val; // già JSONB
  try { return JSON.parse(val); } catch { return fallback; }
}
const toJson = (v) => (typeof v === 'string' ? v : JSON.stringify(v ?? null));

// ── GET /api/config ───────────────────────────────────────────────────────────
configRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bot_name, bot_personality, creator_name, twitch_username,
              stream_schedule, social_links, custom_commands, members,
              ai_provider, event_messages,
              spotify_client_id, spotify_client_secret,
              spotify_access_token,
              bot_active,
              last_name_change, name_changes_this_month,
              user_msg_nonsub, user_msg_subvip,
              autonomous_mode_enabled, autonomous_mode_level
       FROM bot_configs WHERE streamer_id = $1`,
      [req.user.streamer_id]
    );

    const cfg = rows[0] ?? {};
    res.json({
      bot_name:           cfg.bot_name        ?? 'StreamBot',
      creator_name:       cfg.creator_name    ?? req.user.display_name ?? '',
      bot_personality:    cfg.bot_personality ?? '',
      twitch_username:    cfg.twitch_username ?? req.user.twitch_username ?? '',
      stream_schedule:    tryParse(cfg.stream_schedule, { days: [], time_start: '21:00', time_end: '00:00' }),
      social_links:       tryParse(cfg.social_links,    { linktree: '', instagram: '', youtube: '' }),
      custom_commands:    tryParse(cfg.custom_commands, []),
      members:            tryParse(cfg.members,          []),
      ai_provider:        cfg.ai_provider ?? 'gemini',
      event_messages:     tryParse(cfg.event_messages,  {}),
      spotify_client_id:  cfg.spotify_client_id ?? '',
      spotify_connected:  !!cfg.spotify_access_token,
      bot_active:                 cfg.bot_active                 ?? true,
      last_name_change:           cfg.last_name_change           ?? null,
      name_changes_this_month:    cfg.name_changes_this_month    ?? 0,
      user_msg_nonsub:            cfg.user_msg_nonsub            ?? null,
      user_msg_subvip:            cfg.user_msg_subvip            ?? null,
      autonomous_mode_enabled:    cfg.autonomous_mode_enabled    ?? false,
      autonomous_mode_level:      cfg.autonomous_mode_level      ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero della configurazione' });
  }
});

// ── PATCH /api/config/bot-active — attiva/disattiva bot ──────────────────────
configRoutes.patch('/bot-active', requireAuth, async (req, res) => {
  const { active } = req.body;
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Il campo "active" deve essere un booleano.' });
  }
  try {
    await pool.query(
      'UPDATE bot_configs SET bot_active = $1 WHERE streamer_id = $2',
      [active, req.user.streamer_id]
    );

    const twitchUsername = req.user.twitch_username;
    if (twitchUsername) {
      if (active) {
        await botManager.enableBot(twitchUsername);
      } else {
        await botManager.disableBot(twitchUsername);
      }
    }

    res.json({ success: true, bot_active: active });
  } catch (err) {
    console.error('[Config] PATCH /bot-active:', err.message);
    res.status(500).json({ error: 'Errore nel salvataggio.' });
  }
});

// ── GET /api/config/history ───────────────────────────────────────────────────
configRoutes.get('/history', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, saved_at, config_snapshot
       FROM bot_config_history
       WHERE streamer_id = $1
       ORDER BY saved_at DESC LIMIT 10`,
      [req.user.streamer_id]
    );
    res.json({ history: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero della cronologia' });
  }
});

// ── PUT /api/config ───────────────────────────────────────────────────────────
configRoutes.put('/', requireAuth, async (req, res) => {
  const {
    bot_name, creator_name, bot_personality, twitch_username,
    stream_schedule, social_links, custom_commands, members, ai_provider,
    event_messages,
    spotify_client_id, spotify_client_secret,
    user_msg_nonsub, user_msg_subvip,
    autonomous_mode_enabled, autonomous_mode_level,
  } = req.body;

  // ── Validazione lunghezza campi liberi ────────────────────────────────────────
  if (bot_personality && bot_personality.length > 2000) {
    return res.status(400).json({ error: 'Personalità bot troppo lunga (max 2000 caratteri).' });
  }
  if (custom_commands && JSON.stringify(custom_commands).length > 5000) {
    return res.status(400).json({ error: 'Comandi custom troppo lunghi (max 5000 caratteri JSON).' });
  }

  try {
    // Salva snapshot corrente nella cronologia prima di sovrascrivere
    const snapResult = await pool.query(
      `SELECT bot_name, creator_name, bot_personality, twitch_username,
              stream_schedule, social_links, custom_commands, members,
              ai_provider, event_messages,
              last_name_change, name_changes_this_month
       FROM bot_configs WHERE streamer_id = $1`,
      [req.user.streamer_id]
    );

    // ── Controllo limite cambio nome bot (max 1 volta al mese) ───────────────
    const currentCfg = snapResult.rows[0] ?? {};
    const nameChanged = bot_name != null &&
                        bot_name.trim() !== '' &&
                        bot_name.trim() !== (currentCfg.bot_name ?? '').trim();

    if (nameChanged) {
      const lastChange = currentCfg.last_name_change ? new Date(currentCfg.last_name_change) : null;
      const now        = new Date();
      const sameMonth  = lastChange &&
                         lastChange.getMonth()    === now.getMonth() &&
                         lastChange.getFullYear() === now.getFullYear();

      if (sameMonth && (currentCfg.name_changes_this_month ?? 0) >= 1) {
        const nextAvailable = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const formatted = nextAvailable.toLocaleDateString('it-IT', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        return res.status(400).json({
          error: `Puoi rinominare il tuo bot solo una volta al mese. Prossima modifica disponibile il ${formatted}.`,
          code:  'NAME_CHANGE_LIMIT',
        });
      }
    }

    if (snapResult.rows[0]) {
      await pool.query(
        `INSERT INTO bot_config_history (streamer_id, config_snapshot) VALUES ($1, $2)`,
        [req.user.streamer_id, JSON.stringify(snapResult.rows[0])]
      );
      // Mantieni solo gli ultimi 10 snapshot
      await pool.query(
        `DELETE FROM bot_config_history
         WHERE streamer_id = $1
           AND id NOT IN (
             SELECT id FROM bot_config_history
             WHERE streamer_id = $1
             ORDER BY saved_at DESC LIMIT 10
           )`,
        [req.user.streamer_id]
      );
    }

    const { rows } = await pool.query(
      `UPDATE bot_configs
       SET bot_name               = COALESCE($1,  bot_name),
           creator_name           = COALESCE($2,  creator_name),
           bot_personality        = COALESCE($3,  bot_personality),
           twitch_username        = COALESCE($4,  twitch_username),
           stream_schedule        = COALESCE($5,  stream_schedule),
           social_links           = COALESCE($6,  social_links),
           custom_commands        = COALESCE($7::jsonb,  custom_commands),
           members                = COALESCE($8::jsonb,  members),
           ai_provider            = COALESCE($9,  ai_provider),
           event_messages         = COALESCE($11::jsonb, event_messages),
           spotify_client_id      = COALESCE($12, spotify_client_id),
           spotify_client_secret  = COALESCE($13, spotify_client_secret),
           user_msg_nonsub        = COALESCE($14, user_msg_nonsub),
           user_msg_subvip        = COALESCE($15, user_msg_subvip),
           autonomous_mode_enabled = COALESCE($16, autonomous_mode_enabled),
           autonomous_mode_level   = COALESCE($17, autonomous_mode_level),
           updated_at             = NOW()
       WHERE streamer_id = $10
       RETURNING *`,
      [
        bot_name               ?? null,
        creator_name           ?? null,
        bot_personality        ?? null,
        twitch_username        ?? null,
        stream_schedule        != null ? toJson(stream_schedule) : null,
        social_links           != null ? toJson(social_links)    : null,
        custom_commands        != null ? JSON.stringify(custom_commands)    : null,
        members                != null ? JSON.stringify(members)            : null,
        ai_provider            ?? null,
        req.user.streamer_id,
        event_messages         != null ? JSON.stringify(event_messages)     : null,
        spotify_client_id || null,
        spotify_client_secret ? encrypt(spotify_client_secret) : null,
        user_msg_nonsub        != null ? Number(user_msg_nonsub) : null,
        user_msg_subvip        != null ? Number(user_msg_subvip) : null,
        autonomous_mode_enabled != null ? autonomous_mode_enabled : null,
        autonomous_mode_level   != null ? Number(autonomous_mode_level) : null,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configurazione non trovata' });
    }

    // Aggiorna tracciamento cambio nome se il nome è stato modificato
    if (nameChanged) {
      await pool.query(
        `UPDATE bot_configs
         SET last_name_change = CURRENT_DATE, name_changes_this_month = 1
         WHERE streamer_id = $1`,
        [req.user.streamer_id]
      );
    }

    invalidateBotPromptCache(req.user.streamer_id);

    const cfg = rows[0];
    res.json({
      success:          true,
      bot_name:         cfg.bot_name,
      creator_name:     cfg.creator_name,
      bot_personality:  cfg.bot_personality,
      twitch_username:  cfg.twitch_username,
      stream_schedule:  tryParse(cfg.stream_schedule, { days: [], time_start: '21:00', time_end: '00:00' }),
      social_links:     tryParse(cfg.social_links,    { linktree: '', instagram: '', youtube: '' }),
      custom_commands:  tryParse(cfg.custom_commands, []),
      members:          tryParse(cfg.members,          []),
      ai_provider:      cfg.ai_provider,
      event_messages:   tryParse(cfg.event_messages,  {}),
      spotify_client_id: cfg.spotify_client_id ?? '',
      spotify_connected: !!cfg.spotify_access_token,
      user_msg_nonsub:  cfg.user_msg_nonsub ?? null,
      user_msg_subvip:  cfg.user_msg_subvip ?? null,
      autonomous_mode_enabled: cfg.autonomous_mode_enabled ?? false,
      autonomous_mode_level:   cfg.autonomous_mode_level   ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio della configurazione' });
  }
});

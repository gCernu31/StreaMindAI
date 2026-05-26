import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCachedTwitchEmotes, fetchAndCacheTwitchEmotes } from '../bot/botManager.js';

export const commandsRoutes = express.Router();
commandsRoutes.use(authenticateToken);

// ─── TEMPLATE COMMANDS ───────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS = [
  { name: 'uptime',    description: '!uptime — durata della live corrente',                        cooldown_seconds: 30 },
  { name: 'game',      description: '!game — categoria/gioco attivo',                               cooldown_seconds: 15 },
  { name: 'title',     description: '!title — titolo dello stream',                                 cooldown_seconds: 30 },
  { name: 'followage', description: '!followage @user — da quanto segue il canale',                 cooldown_seconds: 30 },
  { name: 'social',    description: '!social — link social configurati',                             cooldown_seconds: 30 },
  { name: 'schedule',  description: '!schedule — orario delle live',                                cooldown_seconds: 60 },
  { name: 'commands',  description: '!commands — lista comandi disponibili',                         cooldown_seconds: 30 },
  { name: 'clip',      description: '!clip — crea una clip degli ultimi 30s e manda il link',       cooldown_seconds: 30, fixedCooldown: true },
];

commandsRoutes.get('/templates', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT name, enabled, cooldown_seconds FROM bot_command_templates WHERE streamer_id = $1',
      [req.user.streamer_id]
    );
    const saved = Object.fromEntries(rows.map(r => [r.name, r]));
    const result = TEMPLATE_DEFAULTS.map(t => ({
      name:             t.name,
      description:      t.description,
      enabled:          saved[t.name]?.enabled ?? true,
      cooldown_seconds: saved[t.name]?.cooldown_seconds ?? t.cooldown_seconds,
      fixedCooldown:    t.fixedCooldown ?? false,
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei template' });
  }
});

commandsRoutes.put('/templates', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const templates  = req.body;
    if (!Array.isArray(templates)) return res.status(400).json({ error: 'Array atteso' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const t of templates) {
        await client.query(
          `INSERT INTO bot_command_templates (streamer_id, name, enabled, cooldown_seconds)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (streamer_id, name) DO UPDATE
             SET enabled = $3, cooldown_seconds = $4`,
          [streamerId, t.name, t.enabled ?? true, t.cooldown_seconds ?? 30]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio dei template' });
  }
});

// ─── COUNTERS ────────────────────────────────────────────────────────────────

commandsRoutes.get('/counters', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, trigger, value, active FROM bot_counters WHERE streamer_id = $1 ORDER BY id',
      [req.user.streamer_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei contatori' });
  }
});

commandsRoutes.post('/counters', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const { name, trigger, value = 0 } = req.body;
    if (!name?.trim() || !trigger?.trim()) return res.status(400).json({ error: 'name e trigger obbligatori' });
    const t = trigger.trim().toLowerCase();
    if (!t.startsWith('!')) return res.status(400).json({ error: 'Il trigger deve iniziare con !' });
    const { rows } = await pool.query(
      'INSERT INTO bot_counters (streamer_id, name, trigger, value) VALUES ($1, $2, $3, $4) RETURNING *',
      [streamerId, name.trim(), t, Number(value) || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Trigger già esistente' });
    console.error(err);
    res.status(500).json({ error: 'Errore nella creazione del contatore' });
  }
});

commandsRoutes.put('/counters/:id', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const { name, trigger, value, active } = req.body;
    const t = trigger?.trim()?.toLowerCase() || null;
    if (t && !t.startsWith('!')) return res.status(400).json({ error: 'Il trigger deve iniziare con !' });
    const { rows } = await pool.query(
      `UPDATE bot_counters SET
         name    = COALESCE($1, name),
         trigger = COALESCE($2, trigger),
         value   = COALESCE($3, value),
         active  = COALESCE($4, active)
       WHERE id = $5 AND streamer_id = $6
       RETURNING *`,
      [name?.trim() || null, t, value != null ? Number(value) : null, active, req.params.id, streamerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Contatore non trovato' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio del contatore' });
  }
});

commandsRoutes.delete('/counters/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM bot_counters WHERE id = $1 AND streamer_id = $2',
      [req.params.id, req.user.streamer_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nell'eliminazione del contatore" });
  }
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

commandsRoutes.get('/announcements', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const { rows } = await pool.query(
      `SELECT a.id, a.name, a.interval_minutes, a.interval_offline_minutes,
              a.min_chat_lines, a.title_keywords, a.game_filter, a.active,
              COALESCE(
                json_agg(m.message ORDER BY m.sort_order) FILTER (WHERE m.id IS NOT NULL),
                '[]'::json
              ) AS messages
       FROM bot_announcements a
       LEFT JOIN bot_announcement_messages m ON m.announcement_id = a.id
       WHERE a.streamer_id = $1
       GROUP BY a.id
       ORDER BY a.id`,
      [streamerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero degli annunci' });
  }
});

commandsRoutes.post('/announcements', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const {
      name = '',
      messages = [],
      interval_minutes = 30,
      interval_offline_minutes = 30,
      min_chat_lines = 0,
      title_keywords = '',
      game_filter = '',
    } = req.body;
    if (!Array.isArray(messages) || messages.filter(m => m?.trim()).length === 0) {
      return res.status(400).json({ error: 'Almeno un messaggio obbligatorio' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO bot_announcements
           (streamer_id, name, message, interval_minutes, interval_offline_minutes, min_chat_lines, title_keywords, game_filter)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          streamerId,
          name.trim(),
          messages[0].trim(),
          Math.max(1, Number(interval_minutes) || 30),
          Math.max(1, Number(interval_offline_minutes) || 30),
          Number(min_chat_lines) || 0,
          title_keywords.trim(),
          game_filter.trim(),
        ]
      );
      const ann = rows[0];
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]?.trim();
        if (msg) {
          await client.query(
            'INSERT INTO bot_announcement_messages (announcement_id, message, sort_order) VALUES ($1, $2, $3)',
            [ann.id, msg, i]
          );
        }
      }
      await client.query('COMMIT');
      res.status(201).json({ ...ann, messages: messages.filter(m => m?.trim()) });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nella creazione dell'annuncio" });
  }
});

commandsRoutes.put('/announcements/:id', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const {
      name,
      messages,
      interval_minutes,
      interval_offline_minutes,
      min_chat_lines,
      title_keywords,
      game_filter,
      active,
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE bot_announcements SET
           name                     = COALESCE($1, name),
           interval_minutes         = COALESCE($2, interval_minutes),
           interval_offline_minutes = COALESCE($3, interval_offline_minutes),
           min_chat_lines           = COALESCE($4, min_chat_lines),
           title_keywords           = COALESCE($5, title_keywords),
           game_filter              = COALESCE($6, game_filter),
           active                   = COALESCE($7, active),
           updated_at               = NOW()
         WHERE id = $8 AND streamer_id = $9
         RETURNING *`,
        [
          name?.trim() ?? null,
          interval_minutes != null ? Math.max(1, Number(interval_minutes)) : null,
          interval_offline_minutes != null ? Math.max(1, Number(interval_offline_minutes)) : null,
          min_chat_lines != null ? Number(min_chat_lines) : null,
          title_keywords?.trim() ?? null,
          game_filter?.trim() ?? null,
          active,
          req.params.id,
          streamerId,
        ]
      );
      if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Annuncio non trovato' }); }

      if (Array.isArray(messages)) {
        await client.query('DELETE FROM bot_announcement_messages WHERE announcement_id = $1', [req.params.id]);
        // also update legacy message column
        const firstMsg = messages.find(m => m?.trim())?.trim();
        if (firstMsg) {
          await client.query('UPDATE bot_announcements SET message = $1 WHERE id = $2', [firstMsg, req.params.id]);
        }
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i]?.trim();
          if (msg) {
            await client.query(
              'INSERT INTO bot_announcement_messages (announcement_id, message, sort_order) VALUES ($1, $2, $3)',
              [req.params.id, msg, i]
            );
          }
        }
      }
      await client.query('COMMIT');
      res.json({ ...rows[0], messages: messages ?? undefined });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nel salvataggio dell'annuncio" });
  }
});

commandsRoutes.delete('/announcements/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM bot_announcements WHERE id = $1 AND streamer_id = $2',
      [req.params.id, req.user.streamer_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nell'eliminazione dell'annuncio" });
  }
});

// ─── EMOTE DESCRIPTIONS ──────────────────────────────────────────────────────

commandsRoutes.get('/emotes/twitch', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    let emotes = getCachedTwitchEmotes(streamerId);
    if (emotes.length === 0) {
      const { rows } = await pool.query('SELECT twitch_id FROM streamers WHERE id = $1', [streamerId]);
      const twitchId = rows[0]?.twitch_id;
      if (twitchId) {
        await fetchAndCacheTwitchEmotes(streamerId, twitchId);
        emotes = getCachedTwitchEmotes(streamerId);
      }
    }
    res.json(emotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero degli emote Twitch' });
  }
});

commandsRoutes.get('/emotes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, emote_name, description FROM bot_emote_descriptions WHERE streamer_id = $1 ORDER BY emote_name',
      [req.user.streamer_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero degli emote' });
  }
});

commandsRoutes.put('/emotes', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const emotes     = req.body;
    if (!Array.isArray(emotes)) return res.status(400).json({ error: 'Array atteso' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM bot_emote_descriptions WHERE streamer_id = $1', [streamerId]);
      for (const e of emotes) {
        if (e.emote_name?.trim() && e.description?.trim()) {
          await client.query(
            'INSERT INTO bot_emote_descriptions (streamer_id, emote_name, description) VALUES ($1, $2, $3)',
            [streamerId, e.emote_name.trim(), e.description.trim()]
          );
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio degli emote' });
  }
});

// ─── CUSTOM COMMANDS ─────────────────────────────────────────────────────────

commandsRoutes.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, trigger, response, active,
              global_cooldown_seconds, user_cooldown_seconds,
              access_level, response_type
       FROM bot_commands WHERE streamer_id = $1 ORDER BY id`,
      [req.user.streamer_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dei comandi' });
  }
});

commandsRoutes.post('/', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const {
      trigger,
      response,
      global_cooldown_seconds = 5,
      user_cooldown_seconds   = 15,
      access_level            = 'everyone',
      response_type           = 'say',
    } = req.body;
    if (!trigger?.trim() || !response?.trim()) return res.status(400).json({ error: 'trigger e response obbligatori' });
    const t = trigger.trim().toLowerCase();
    if (!t.startsWith('!')) return res.status(400).json({ error: 'Il trigger deve iniziare con !' });
    const { rows } = await pool.query(
      `INSERT INTO bot_commands
         (streamer_id, trigger, response, cooldown_seconds, global_cooldown_seconds, user_cooldown_seconds, access_level, response_type)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
       RETURNING *`,
      [streamerId, t, response.trim(), Number(global_cooldown_seconds) || 5, Number(user_cooldown_seconds) || 15, access_level, response_type]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Trigger già esistente' });
    console.error(err);
    res.status(500).json({ error: 'Errore nella creazione del comando' });
  }
});

commandsRoutes.put('/:id', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const { trigger, response, active, global_cooldown_seconds, user_cooldown_seconds, access_level, response_type } = req.body;
    const t = trigger?.trim()?.toLowerCase() || null;
    if (t && !t.startsWith('!')) return res.status(400).json({ error: 'Il trigger deve iniziare con !' });
    const gcd = global_cooldown_seconds != null ? Number(global_cooldown_seconds) : null;
    const { rows } = await pool.query(
      `UPDATE bot_commands SET
         trigger                 = COALESCE($1, trigger),
         response                = COALESCE($2, response),
         active                  = COALESCE($3, active),
         global_cooldown_seconds = COALESCE($4, global_cooldown_seconds),
         cooldown_seconds        = COALESCE($4, cooldown_seconds),
         user_cooldown_seconds   = COALESCE($5, user_cooldown_seconds),
         access_level            = COALESCE($6, access_level),
         response_type           = COALESCE($7, response_type),
         updated_at              = NOW()
       WHERE id = $8 AND streamer_id = $9
       RETURNING *`,
      [t, response?.trim() || null, active, gcd, user_cooldown_seconds != null ? Number(user_cooldown_seconds) : null, access_level ?? null, response_type ?? null, req.params.id, streamerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Comando non trovato' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Trigger già esistente' });
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio del comando' });
  }
});

commandsRoutes.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM bot_commands WHERE id = $1 AND streamer_id = $2',
      [req.params.id, req.user.streamer_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nell'eliminazione del comando" });
  }
});

import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCachedTwitchEmotes, fetchAndCacheTwitchEmotes } from '../bot/botManager.js';

export const commandsRoutes = express.Router();
commandsRoutes.use(authenticateToken);

// ─── TEMPLATE COMMANDS ───────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS = [
  { name: 'uptime',    description: '!uptime — durata della live corrente',        cooldown_seconds: 30 },
  { name: 'game',      description: '!game — categoria/gioco attivo',               cooldown_seconds: 15 },
  { name: 'title',     description: '!title — titolo dello stream',                 cooldown_seconds: 30 },
  { name: 'followage', description: '!followage @user — da quanto segue il canale', cooldown_seconds: 30 },
  { name: 'social',    description: '!social — link social configurati',             cooldown_seconds: 30 },
  { name: 'schedule',  description: '!schedule — orario delle live',                cooldown_seconds: 60 },
  { name: 'commands',  description: '!commands — lista comandi disponibili',         cooldown_seconds: 30 },
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
    const { rows } = await pool.query(
      'SELECT id, message, interval_minutes, active FROM bot_announcements WHERE streamer_id = $1 ORDER BY id',
      [req.user.streamer_id]
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
    const { message, interval_minutes = 30 } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message obbligatorio' });
    const { rows } = await pool.query(
      'INSERT INTO bot_announcements (streamer_id, message, interval_minutes) VALUES ($1, $2, $3) RETURNING *',
      [streamerId, message.trim(), Math.max(5, Math.min(120, Number(interval_minutes) || 30))]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore nella creazione dell'annuncio" });
  }
});

commandsRoutes.put('/announcements/:id', async (req, res) => {
  try {
    const streamerId = req.user.streamer_id;
    const { message, interval_minutes, active } = req.body;
    const mins = interval_minutes != null
      ? Math.max(5, Math.min(120, Number(interval_minutes) || 30))
      : null;
    const { rows } = await pool.query(
      `UPDATE bot_announcements SET
         message          = COALESCE($1, message),
         interval_minutes = COALESCE($2, interval_minutes),
         active           = COALESCE($3, active),
         updated_at       = NOW()
       WHERE id = $4 AND streamer_id = $5
       RETURNING *`,
      [message?.trim() || null, mins, active, req.params.id, streamerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Annuncio non trovato' });
    res.json(rows[0]);
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
      // On-demand fetch se la cache è vuota (es. utente apre la dashboard prima che il bot si avvii)
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
      'SELECT id, trigger, response, active, cooldown_seconds, mod_only FROM bot_commands WHERE streamer_id = $1 ORDER BY id',
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
    const { trigger, response, cooldown_seconds = 5, mod_only = false } = req.body;
    if (!trigger?.trim() || !response?.trim()) return res.status(400).json({ error: 'trigger e response obbligatori' });
    const t = trigger.trim().toLowerCase();
    if (!t.startsWith('!')) return res.status(400).json({ error: 'Il trigger deve iniziare con !' });
    const { rows } = await pool.query(
      'INSERT INTO bot_commands (streamer_id, trigger, response, cooldown_seconds, mod_only) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [streamerId, t, response.trim(), Number(cooldown_seconds) || 5, Boolean(mod_only)]
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
    const { trigger, response, active, cooldown_seconds, mod_only } = req.body;
    const t = trigger?.trim()?.toLowerCase() || null;
    if (t && !t.startsWith('!')) return res.status(400).json({ error: 'Il trigger deve iniziare con !' });
    const { rows } = await pool.query(
      `UPDATE bot_commands SET
         trigger          = COALESCE($1, trigger),
         response         = COALESCE($2, response),
         active           = COALESCE($3, active),
         cooldown_seconds = COALESCE($4, cooldown_seconds),
         mod_only         = COALESCE($5, mod_only),
         updated_at       = NOW()
       WHERE id = $6 AND streamer_id = $7
       RETURNING *`,
      [t, response?.trim() || null, active, cooldown_seconds != null ? Number(cooldown_seconds) : null, mod_only, req.params.id, streamerId]
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

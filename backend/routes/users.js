import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getLimits } from '../config/planLimits.js';

export const usersRoutes = Router();

// ── GET /api/users — lista utenti appresi automaticamente ─────────────────────
usersRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [countRes, dataRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM bot_users WHERE streamer_id = $1`,
        [req.user.streamer_id]
      ),
      pool.query(
        `SELECT id, username, message_count, last_seen, notes, is_manual, created_at
         FROM bot_users
         WHERE streamer_id = $1
         ORDER BY message_count DESC, last_seen DESC
         LIMIT $2 OFFSET $3`,
        [req.user.streamer_id, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      users: dataRes.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[Users] GET:', err.message);
    res.status(500).json({ error: 'Errore nel recupero degli utenti.' });
  }
});

// ── DELETE /api/users/:id — elimina utente appreso ────────────────────────────
usersRoutes.delete('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID non valido.' });

  try {
    const result = await pool.query(
      `DELETE FROM bot_users WHERE id = $1 AND streamer_id = $2 RETURNING id`,
      [id, req.user.streamer_id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Utente non trovato.' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Users] DELETE:', err.message);
    res.status(500).json({ error: "Errore nell'eliminazione." });
  }
});

// ── POST /api/users/:id/promote — promuovi a membro manuale ──────────────────
usersRoutes.post('/:id/promote', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: 'ID non valido.' });

  try {
    // Recupera utente appreso
    const { rows: userRows } = await pool.query(
      `SELECT username, notes FROM bot_users WHERE id = $1 AND streamer_id = $2`,
      [id, req.user.streamer_id]
    );
    if (!userRows[0]) return res.status(404).json({ error: 'Utente non trovato.' });
    const { username, notes } = userRows[0];

    // Recupera piano e config corrente in parallelo
    const [planRes, cfgRes] = await Promise.all([
      pool.query(
        `SELECT subscription_plan FROM streamers WHERE id = $1`,
        [req.user.streamer_id]
      ),
      pool.query(
        `SELECT members FROM bot_configs WHERE streamer_id = $1`,
        [req.user.streamer_id]
      ),
    ]);

    const plan   = planRes.rows[0]?.subscription_plan ?? 'starter';
    const limits = getLimits(plan);
    const arr    = Array.isArray(cfgRes.rows[0]?.members) ? cfgRes.rows[0].members : [];

    // Controlla limite piano
    if (limits.members !== -1 && arr.length >= limits.members) {
      return res.status(400).json({
        error: `Hai raggiunto il limite di ${limits.members} membri manuali per il piano ${plan}.`,
      });
    }

    // Controlla duplicato
    if (arr.some(m => (m.twitch_username || '').toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Questo utente è già un membro manuale.' });
    }

    const newMember = {
      twitch_username: username,
      nickname:        '',
      description:     notes ? notes.slice(0, 150) : '',
    };

    await pool.query(
      `UPDATE bot_configs
       SET members = members || $1::jsonb, updated_at = NOW()
       WHERE streamer_id = $2`,
      [JSON.stringify([newMember]), req.user.streamer_id]
    );

    res.json({ success: true, member: newMember });
  } catch (err) {
    console.error('[Users] POST /promote:', err.message);
    res.status(500).json({ error: 'Errore nella promozione.' });
  }
});

-- ============================================================
-- Hally Dashboard — Schema database multi-tenant
-- ============================================================

-- Streamer registrati tramite Twitch OAuth
CREATE TABLE IF NOT EXISTS streamers (
  id                  SERIAL PRIMARY KEY,
  twitch_id           VARCHAR(100) UNIQUE NOT NULL,
  twitch_username     VARCHAR(100) NOT NULL,
  display_name        VARCHAR(100),
  email               VARCHAR(200),
  avatar_url          VARCHAR(500),
  subscription_status VARCHAR(50)  NOT NULL DEFAULT 'inactive',  -- inactive | active | cancelled | past_due
  subscription_end    DATE,
  stripe_customer_id  VARCHAR(200),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Configurazione bot per ogni streamer (1:1 con streamers)
CREATE TABLE IF NOT EXISTS bot_configs (
  id               SERIAL PRIMARY KEY,
  streamer_id      INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  bot_name         VARCHAR(100)  NOT NULL DEFAULT 'Hally',
  bot_personality  TEXT          NOT NULL DEFAULT '',
  creator_name     VARCHAR(100),
  stream_schedule  TEXT          NOT NULL DEFAULT '',
  social_links     TEXT          NOT NULL DEFAULT '',
  custom_commands  JSONB         NOT NULL DEFAULT '[]',
  members          JSONB         NOT NULL DEFAULT '[]',
  ai_provider      VARCHAR(50)   NOT NULL DEFAULT 'gemini',
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (streamer_id)
);

-- Memorie salvate dal bot per ogni streamer
CREATE TABLE IF NOT EXISTS bot_memories (
  id           SERIAL PRIMARY KEY,
  streamer_id  INTEGER     NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  category     VARCHAR(100),          -- utente | inside_joke | evento | promessa | nome_gioco
  subject      VARCHAR(200),
  content      TEXT        NOT NULL,
  game_context VARCHAR(200),
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Utilizzi giornalieri del comando !hally per ogni streamer
CREATE TABLE IF NOT EXISTS bot_daily_usage (
  streamer_id  INTEGER     NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  username     VARCHAR(100) NOT NULL,
  usage_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  count        INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (streamer_id, username, usage_date)
);

-- ============================================================
-- Indici per performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_streamers_twitch_id
  ON streamers (twitch_id);

CREATE INDEX IF NOT EXISTS idx_bot_memories_streamer_id
  ON bot_memories (streamer_id);

CREATE INDEX IF NOT EXISTS idx_bot_memories_category
  ON bot_memories (streamer_id, category);

CREATE INDEX IF NOT EXISTS idx_bot_daily_usage_streamer_date
  ON bot_daily_usage (streamer_id, usage_date);

-- ============================================================
-- Trigger: aggiorna updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Lead magnet: analisi canale Twitch
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_leads (
  id                  SERIAL PRIMARY KEY,
  email               VARCHAR(200) NOT NULL,
  twitch_username     VARCHAR(100),
  form_data           JSONB,
  analysis_generated  TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_leads_email
  ON analytics_leads (email);

-- Rinomina characters → members (idempotente per DB esistenti)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='characters') THEN
    ALTER TABLE bot_configs RENAME COLUMN characters TO members;
  END IF;
END;
$$;

-- Aggiunge colonne mancanti se non esistono già (idempotente)
DO $$
BEGIN
  -- bot_configs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='twitch_username') THEN
    ALTER TABLE bot_configs ADD COLUMN twitch_username VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='event_messages') THEN
    ALTER TABLE bot_configs ADD COLUMN event_messages JSONB NOT NULL DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_announce_channel') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_announce_channel VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_livestream_channel') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_livestream_channel VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_video_channel') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_video_channel VARCHAR(100);
  END IF;

  -- bot_active: abilita/disabilita il bot manualmente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='bot_active') THEN
    ALTER TABLE bot_configs ADD COLUMN bot_active BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;

  -- bot_configs: limiti per utente configurabili dallo streamer (null = usa default del piano)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='user_msg_nonsub') THEN
    ALTER TABLE bot_configs ADD COLUMN user_msg_nonsub INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='user_msg_subvip') THEN
    ALTER TABLE bot_configs ADD COLUMN user_msg_subvip INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='song_req_nonsub') THEN
    ALTER TABLE bot_configs ADD COLUMN song_req_nonsub INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='song_req_subvip') THEN
    ALTER TABLE bot_configs ADD COLUMN song_req_subvip INTEGER;
  END IF;

  -- streamers: contatori messaggi mensili
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='monthly_message_count') THEN
    ALTER TABLE streamers ADD COLUMN monthly_message_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='monthly_reset_date') THEN
    ALTER TABLE streamers ADD COLUMN monthly_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  -- chat_messages_count: solo comandi !nomebot (conta nel limite mensile del piano)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='chat_messages_count') THEN
    ALTER TABLE streamers ADD COLUMN chat_messages_count INTEGER NOT NULL DEFAULT 0;
    -- Migra i dati esistenti da monthly_message_count
    UPDATE streamers SET chat_messages_count = monthly_message_count WHERE monthly_message_count > 0;
  END IF;

  -- event_messages_count: eventi automatici (follow, sub, gift, bit, raid, hype train, shoutout, song request)
  -- Non conta nel limite mensile — solo per statistiche
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='event_messages_count') THEN
    ALTER TABLE streamers ADD COLUMN event_messages_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END;
$$;

-- Aggiunge colonne Stripe se non esistono già (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='subscription_plan') THEN
    ALTER TABLE streamers ADD COLUMN subscription_plan VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE streamers ADD COLUMN stripe_subscription_id VARCHAR(200);
  END IF;
END;
$$;

-- Aggiunge colonne Spotify e Discord su bot_configs (per-streamer, idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='spotify_client_id') THEN
    ALTER TABLE bot_configs ADD COLUMN spotify_client_id VARCHAR(200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='spotify_client_secret') THEN
    ALTER TABLE bot_configs ADD COLUMN spotify_client_secret VARCHAR(200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='spotify_access_token') THEN
    ALTER TABLE bot_configs ADD COLUMN spotify_access_token TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='spotify_refresh_token') THEN
    ALTER TABLE bot_configs ADD COLUMN spotify_refresh_token TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='spotify_token_expires_at') THEN
    ALTER TABLE bot_configs ADD COLUMN spotify_token_expires_at BIGINT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_bot_token') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_bot_token TEXT;
  END IF;
END;
$$;

-- Aggiunge colonne onboarding wizard (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='onboarding_completed') THEN
    ALTER TABLE streamers ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='onboarding_step') THEN
    ALTER TABLE streamers ADD COLUMN onboarding_step SMALLINT NOT NULL DEFAULT 0;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_streamers_updated_at'
  ) THEN
    CREATE TRIGGER trg_streamers_updated_at
      BEFORE UPDATE ON streamers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bot_configs_updated_at'
  ) THEN
    CREATE TRIGGER trg_bot_configs_updated_at
      BEFORE UPDATE ON bot_configs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

-- ============================================================
-- Cronologia configurazioni bot (ultimi 10 per streamer)
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_config_history (
  id              SERIAL PRIMARY KEY,
  streamer_id     INTEGER   NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  saved_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  config_snapshot JSONB     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_config_history_streamer
  ON bot_config_history (streamer_id, saved_at DESC);

-- ============================================================
-- Sistema Referral
-- ============================================================

-- Codice referral univoco per streamer (es. REF-GCERNU)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='referral_code') THEN
    ALTER TABLE streamers ADD COLUMN referral_code VARCHAR(100) UNIQUE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_streamers_referral_code ON streamers (referral_code);

-- Genera codice per utenti esistenti senza codice (idempotente)
UPDATE streamers
SET referral_code = 'REF-' || UPPER(twitch_username)
WHERE referral_code IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM streamers s2
    WHERE s2.referral_code = 'REF-' || UPPER(streamers.twitch_username)
      AND s2.id <> streamers.id
  );

-- Tabella referral: chi ha invitato chi
CREATE TABLE IF NOT EXISTS referrals (
  id           SERIAL PRIMARY KEY,
  referrer_id  INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  referred_id  INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | active | rewarded
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMP,
  UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id, status);

-- ============================================================
-- Analisi mensile canale (per abbonati, generata da Gemini)
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_analyses (
  id           SERIAL PRIMARY KEY,
  streamer_id  INTEGER   NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  analysis     TEXT      NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_analyses_streamer
  ON dashboard_analyses (streamer_id, generated_at DESC);

-- ============================================================
-- Pagina /status — monitoraggio servizi
-- ============================================================

-- Stato corrente di ogni servizio (upsert dal bot manager)
CREATE TABLE IF NOT EXISTS service_status (
  service     VARCHAR(50) PRIMARY KEY,
  status      VARCHAR(20) NOT NULL DEFAULT 'operational', -- operational | degraded | outage
  message     TEXT,
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Log incidenti per storico uptime 30 giorni
CREATE TABLE IF NOT EXISTS status_incidents (
  id           SERIAL PRIMARY KEY,
  service      VARCHAR(50) NOT NULL,
  started_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMP,
  description  TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_incidents_service ON status_incidents (service, started_at DESC);

-- Limite cambio nome bot: max 1 volta al mese per account (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='last_name_change') THEN
    ALTER TABLE bot_configs ADD COLUMN last_name_change DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='name_changes_this_month') THEN
    ALTER TABLE bot_configs ADD COLUMN name_changes_this_month INTEGER NOT NULL DEFAULT 0;
  END IF;
END;
$$;

-- Token extra acquistabili (pacchetti one-time Stripe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='extra_messages') THEN
    ALTER TABLE streamers ADD COLUMN extra_messages INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='extra_messages_expiry') THEN
    ALTER TABLE streamers ADD COLUMN extra_messages_expiry DATE;
  END IF;
END;
$$;

-- Token OAuth streamer (necessari per EventSub user-scoped)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='twitch_access_token') THEN
    ALTER TABLE streamers ADD COLUMN twitch_access_token TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='twitch_refresh_token') THEN
    ALTER TABLE streamers ADD COLUMN twitch_refresh_token TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='twitch_token_expires_at') THEN
    ALTER TABLE streamers ADD COLUMN twitch_token_expires_at BIGINT;
  END IF;
END;
$$;

-- Finestre di manutenzione programmata
CREATE TABLE IF NOT EXISTS maintenance_windows (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  starts_at   TIMESTAMP NOT NULL,
  ends_at     TIMESTAMP NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- Profili utenti appresi automaticamente dal bot
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_users (
  id            SERIAL PRIMARY KEY,
  streamer_id   INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  notes         TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_seen     TIMESTAMP NOT NULL DEFAULT NOW(),
  is_manual     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (streamer_id, username)
);

CREATE INDEX IF NOT EXISTS idx_bot_users_streamer
  ON bot_users (streamer_id, message_count DESC);

-- Analisi autenticate: collega analytics_leads a un utente Twitch loggato
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_leads' AND column_name='twitch_id') THEN
    ALTER TABLE analytics_leads ADD COLUMN twitch_id VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_leads' AND column_name='generated_at') THEN
    ALTER TABLE analytics_leads ADD COLUMN generated_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='analytics_leads' AND column_name='next_generation_at') THEN
    ALTER TABLE analytics_leads ADD COLUMN next_generation_at TIMESTAMP;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_leads_twitch_id
  ON analytics_leads (twitch_id)
  WHERE twitch_id IS NOT NULL;

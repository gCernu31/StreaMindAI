/**
 * Limiti e funzionalità per ogni piano StreaMindAI.
 * Importare questo file ovunque servano controlli sul piano.
 *
 * Convenzione: -1 = illimitato, false = non disponibile, null = funzione non inclusa nel piano
 *
 * channelMessagesPerSession = limite hard totale messaggi sul canale per sessione live
 * userLimits                = range configurabile dallo streamer dal pannello
 *                             (null = funzione non disponibile nel piano)
 */

export const PLAN_LIMITS = {

  free: {
    channelMessagesPerSession: 0,   // nessuna risposta AI
    monthlyMessages:           0,

    members:             0,
    songRequest:         false,
    memory:              false,
    analytics:           false,
    customEventMessages: false,
    trial:               false,
    autonomousMaxLevel:  0,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'raid', 'hype_train'],

    userLimits: null,
  },

  starter: {
    // Limiti hard
    channelMessagesPerSession: 200,
    monthlyMessages:           4_000,

    // Funzionalità
    members:             10,
    songRequest:         false,
    memory:              false,
    analytics:           false,
    customEventMessages: false,
    trial:               7, // giorni
    autonomousMaxLevel:  2,

    // Risposte automatiche eventi Twitch
    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],

    // Range configurabile dallo streamer (default usato se non personalizzato)
    userLimits: {
      nonSub:     { default: 3,  max: 10 },
      subVip:     { default: 10, max: 10 },
      songNonSub: null,
      songSubVip: null,
    },
  },

  creator: {
    channelMessagesPerSession: 600,
    monthlyMessages:           12_000,

    members:             20,
    songRequest:         true,
    memory:              true,    // memoria base
    analytics:           false,
    customEventMessages: false,
    trial:               7,
    autonomousMaxLevel:  3,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],

    userLimits: {
      nonSub:     { default: 3,  max: 50 },
      subVip:     { default: -1, max: 50 },   // -1 = illimitati di default
      songNonSub: { default: 1,  max: 50 },
      songSubVip: { default: 3,  max: 50 },
    },
  },

  elite: {
    channelMessagesPerSession: 1_200,
    monthlyMessages:           24_000,

    members:             30,
    songRequest:         true,
    memory:              true,    // avanzata con game_context
    analytics:           true,
    customEventMessages: true,
    trial:               7,
    autonomousMaxLevel:  4,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],

    userLimits: {
      nonSub:     { default: 5,  max: 100 },
      subVip:     { default: -1, max: 100 },
      songNonSub: { default: 2,  max: 100 },
      songSubVip: { default: 5,  max: 100 },
    },
  },

  signature: {
    channelMessagesPerSession: 3_000,
    monthlyMessages:           60_000,

    members:             50,
    songRequest:         true,
    memory:              true,
    analytics:           true,
    customEventMessages: true,
    trial:               false, // nessun trial — contatto diretto
    autonomousMaxLevel:  5,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],

    userLimits: {
      nonSub:     { default: 10, max: -1 },
      subVip:     { default: -1, max: -1 },
      songNonSub: { default: 5,  max: -1 },
      songSubVip: { default: -1, max: -1 },
    },
  },

};

/** Restituisce i limiti per un piano, con fallback a starter se non trovato. */
export function getLimits(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
}

/** Nomi leggibili dei piani */
export const PLAN_LABELS = {
  free:      'Free',
  starter:   'Starter',
  creator:   'Creator',
  elite:     'Elite',
  signature: 'Signature',
};

/** Prezzi mensili in euro */
export const PLAN_PRICES = {
  free:      0,
  starter:   12,
  creator:   24,
  elite:     44,
  signature: 99,
};

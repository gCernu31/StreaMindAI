/**
 * Limiti e funzionalità per ogni piano StreaMindAI.
 * Importare questo file ovunque servano controlli sul piano.
 *
 * Convenzione: -1 = illimitato, false = non disponibile, null = funzione non inclusa nel piano
 *
 * channelMessagesPerSession = limite hard totale messaggi sul canale per sessione live
 * monthlyTokens             = token Gemini mensili inclusi nel piano (0 = AI non disponibile)
 * userLimits                = range configurabile dallo streamer dal pannello
 *                             (null = funzione non disponibile nel piano)
 */

export const PLAN_LIMITS = {

  free: {
    channelMessagesPerSession: 0,   // nessuna risposta AI
    monthlyTokens:             0,
    monthlyMessages:           0,   // compat legacy

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
    channelMessagesPerSession: 200,
    monthlyTokens:             1_500_000,
    monthlyMessages:           1_500_000, // compat legacy

    members:             10,
    songRequest:         false,
    memory:              false,
    analytics:           false,
    customEventMessages: false,
    trial:               7,
    autonomousMaxLevel:  2,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],

    userLimits: {
      nonSub:     { default: 3,  max: 10 },
      subVip:     { default: 10, max: 10 },
      songNonSub: null,
      songSubVip: null,
    },
  },

  creator: {
    channelMessagesPerSession: 600,
    monthlyTokens:             8_000_000,
    monthlyMessages:           8_000_000, // compat legacy

    members:             20,
    songRequest:         true,
    memory:              true,
    analytics:           false,
    customEventMessages: false,
    trial:               7,
    autonomousMaxLevel:  3,

    events: ['follow', 'subscribe', 'gift_sub', 'cheer', 'hype_train', 'raid'],

    userLimits: {
      nonSub:     { default: 3,  max: 50 },
      subVip:     { default: -1, max: 50 },
      songNonSub: { default: 1,  max: 50 },
      songSubVip: { default: 3,  max: 50 },
    },
  },

  elite: {
    channelMessagesPerSession: 1_200,
    monthlyTokens:             25_000_000,
    monthlyMessages:           25_000_000, // compat legacy

    members:             30,
    songRequest:         true,
    memory:              true,
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
    monthlyTokens:             60_000_000,
    monthlyMessages:           60_000_000, // compat legacy

    members:             50,
    songRequest:         true,
    memory:              true,
    analytics:           true,
    customEventMessages: true,
    trial:               false,
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
  starter:   4.99,
  creator:   9.99,
  elite:     19.99,
  signature: 39.99,
};

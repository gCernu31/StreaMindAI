import { Router } from 'express';
import Stripe from 'stripe';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { botManager } from '../bot/botManager.js';
import {
  sendTrialReminderEmail,
  sendTrialActivatedEmail,
  sendSubscriptionActivatedEmail,
  sendRenewalConfirmationEmail,
} from '../services/emailService.js';

// Piani con trial di 7 giorni
const PLANS_WITH_TRIAL = new Set(['starter', 'creator', 'elite']);

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const PRICE_IDS = {
  starter:   process.env.STRIPE_PRICE_STARTER,
  creator:   process.env.STRIPE_PRICE_CREATOR,
  elite:     process.env.STRIPE_PRICE_ELITE,
  signature: process.env.STRIPE_PRICE_SIGNATURE,
};

const PERIOD_PRICE_IDS = {
  starter:   { '3m': process.env.STRIPE_PRICE_STARTER_3M,   '6m': process.env.STRIPE_PRICE_STARTER_6M,   '12m': process.env.STRIPE_PRICE_STARTER_12M   },
  creator:   { '3m': process.env.STRIPE_PRICE_CREATOR_3M,   '6m': process.env.STRIPE_PRICE_CREATOR_6M,   '12m': process.env.STRIPE_PRICE_CREATOR_12M   },
  elite:     { '3m': process.env.STRIPE_PRICE_ELITE_3M,     '6m': process.env.STRIPE_PRICE_ELITE_6M,     '12m': process.env.STRIPE_PRICE_ELITE_12M     },
  signature: { '3m': process.env.STRIPE_PRICE_SIGNATURE_3M, '6m': process.env.STRIPE_PRICE_SIGNATURE_6M, '12m': process.env.STRIPE_PRICE_SIGNATURE_12M },
};

const TOKEN_PACK = {
  priceId:  process.env.STRIPE_PRICE_TOKEN_PACK, // prodotto one-time 6€ su Stripe
  messages: 5_000,
  days:     30,
};

function stripeRequired(res) {
  if (!stripe) {
    res.status(503).json({ error: 'Stripe non configurato. Aggiungi STRIPE_SECRET_KEY al .env.' });
    return true;
  }
  return false;
}

export const subscriptionRoutes = Router();

// ── GET /api/subscription ─────────────────────────────────────────────────────
subscriptionRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT subscription_status, subscription_plan, subscription_end,
              stripe_customer_id, stripe_subscription_id,
              extra_messages, extra_messages_expiry
       FROM streamers WHERE id = $1`,
      [req.user.streamer_id]
    );
    const s = rows[0] ?? {};
    const today = new Date().toISOString().slice(0, 10);
    const extraActive = (s.extra_messages ?? 0) > 0 &&
                        s.extra_messages_expiry != null &&
                        s.extra_messages_expiry >= today;
    res.json({
      status:             s.subscription_status  ?? 'inactive',
      plan:               s.subscription_plan    ?? null,
      subscription_end:   s.subscription_end     ?? null,
      stripe_customer_id: s.stripe_customer_id   ?? null,
      extra_tokens: {
        count:  extraActive ? (s.extra_messages ?? 0) : 0,
        expiry: extraActive ? s.extra_messages_expiry : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dell\'abbonamento' });
  }
});

// ── GET /api/subscription/invoices ────────────────────────────────────────────
subscriptionRoutes.get('/invoices', requireAuth, async (req, res) => {
  if (stripeRequired(res)) return;
  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) return res.json({ invoices: [] });

    const list = await stripe.invoices.list({ customer: customerId, limit: 24 });
    res.json({
      invoices: list.data.map(inv => ({
        id:         inv.id,
        number:     inv.number,
        amount:     inv.amount_paid / 100,
        currency:   inv.currency,
        status:     inv.status,
        created:    new Date(inv.created * 1000).toISOString(),
        pdf_url:    inv.invoice_pdf,
        hosted_url: inv.hosted_invoice_url,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero delle fatture' });
  }
});

// ── Logica Checkout condivisa tra /checkout e /create ─────────────────────────
async function handleCheckout(req, res) {
  if (stripeRequired(res)) return;
  try {
    const plan      = req.body.plan ?? req.body.planId;
    const usePayPal = req.body.paypal === true;
    const period    = req.body.period ?? 'monthly'; // 'monthly' | '3m' | '6m' | '12m'

    let priceId;
    if (period === 'monthly') {
      if (!plan || !PRICE_IDS[plan]) {
        return res.status(400).json({
          error: `Piano non valido o STRIPE_PRICE_${(plan ?? '').toUpperCase()} non configurato.`,
        });
      }
      priceId = PRICE_IDS[plan];
    } else {
      const periodId = PERIOD_PRICE_IDS[plan]?.[period];
      if (!periodId) {
        return res.status(400).json({
          error: `Price ID non configurato per ${plan} ${period}.`,
        });
      }
      priceId = periodId;
    }

    const { rows } = await pool.query(
      'SELECT stripe_customer_id, email, display_name FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const streamer = rows[0] ?? {};

    let customerId = streamer.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    streamer.email        ?? undefined,
        name:     streamer.display_name ?? undefined,
        metadata: { streamer_id: String(req.user.streamer_id) },
      });
      customerId = customer.id;
      await pool.query(
        'UPDATE streamers SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.user.streamer_id]
      );
    }

    // Trial solo per piano mensile senza PayPal e se non già utilizzato
    let trialDays;
    if (PLANS_WITH_TRIAL.has(plan) && !usePayPal && period === 'monthly') {
      const { rows: trialRow } = await pool.query(
        'SELECT trial_used FROM streamers WHERE id = $1',
        [req.user.streamer_id]
      );
      if (!trialRow[0]?.trial_used) {
        trialDays = 7;
        const { rows: refRows } = await pool.query(
          `SELECT id FROM referrals WHERE referred_id = $1 AND status = 'pending' LIMIT 1`,
          [req.user.streamer_id]
        );
        if (refRows[0]) trialDays = 14;
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'subscription',
      payment_method_types: usePayPal ? ['paypal'] : ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      success_url:          `${frontendUrl}/success?plan=${plan}`,
      cancel_url:           `${frontendUrl}/subscription?cancelled=1`,
      metadata:          { streamer_id: String(req.user.streamer_id), plan },
      subscription_data: {
        metadata:            { streamer_id: String(req.user.streamer_id), plan },
        ...(trialDays != null ? { trial_period_days: trialDays } : {}),
      },
    });

    res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[Checkout] errore:', err.message, err.code ?? '');
    res.status(500).json({ error: 'Errore nella creazione del checkout' });
  }
}

// ── POST /api/subscription/checkout ──────────────────────────────────────────
subscriptionRoutes.post('/checkout', requireAuth, handleCheckout);

// ── POST /api/subscription/create (alias di /checkout) ───────────────────────
subscriptionRoutes.post('/create', requireAuth, handleCheckout);

// ── POST /api/subscription/portal ────────────────────────────────────────────
subscriptionRoutes.post('/portal', requireAuth, async (req, res) => {
  if (stripeRequired(res)) return;
  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ error: 'Nessun cliente Stripe associato a questo account.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const portal = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${frontendUrl}/subscription`,
    });
    res.json({ portal_url: portal.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nell\'apertura del portale' });
  }
});

// ── POST /api/subscription/cancel ────────────────────────────────────────────
subscriptionRoutes.post('/cancel', requireAuth, async (req, res) => {
  if (stripeRequired(res)) return;
  try {
    const { rows } = await pool.query(
      'SELECT stripe_subscription_id FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const subId = rows[0]?.stripe_subscription_id;
    if (!subId) return res.status(400).json({ error: 'Nessun abbonamento attivo.' });

    await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    await pool.query(
      "UPDATE streamers SET subscription_status = 'cancelling' WHERE id = $1",
      [req.user.streamer_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella cancellazione' });
  }
});

// ── POST /api/subscription/token-pack ────────────────────────────────────────
subscriptionRoutes.post('/token-pack', requireAuth, async (req, res) => {
  if (stripeRequired(res)) return;
  if (!TOKEN_PACK.priceId) {
    return res.status(503).json({ error: 'Token Pack non ancora configurato. Aggiungi STRIPE_PRICE_TOKEN_PACK al .env.' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id, email, display_name FROM streamers WHERE id = $1',
      [req.user.streamer_id]
    );
    const streamer = rows[0] ?? {};

    let customerId = streamer.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    streamer.email        ?? undefined,
        name:     streamer.display_name ?? undefined,
        metadata: { streamer_id: String(req.user.streamer_id) },
      });
      customerId = customer.id;
      await pool.query(
        'UPDATE streamers SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.user.streamer_id]
      );
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      mode:                 'payment',
      payment_method_types: ['card'],
      line_items:           [{ price: TOKEN_PACK.priceId, quantity: 1 }],
      success_url:          `${frontendUrl}/subscription?token_pack=success`,
      cancel_url:           `${frontendUrl}/subscription?token_pack=cancelled`,
      metadata:             { streamer_id: String(req.user.streamer_id), type: 'token_pack' },
    });

    res.json({ checkout_url: session.url });
  } catch (err) {
    console.error('[TokenPack] checkout:', err.message);
    res.status(500).json({ error: 'Errore nella creazione del checkout.' });
  }
});

// ── POST /api/subscription/webhook e POST /webhooks/stripe ───────────────────
// Registrato in server.js con express.raw() PRIMA di express.json()
export async function stripeWebhook(req, res) {
  if (!stripe) return res.status(503).send('Stripe non configurato');

  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;

        // ── Acquisto Token Pack (one-time) ───────────────────────────────────
        if (session.mode === 'payment' && session.metadata?.type === 'token_pack') {
          const streamerId = session.metadata?.streamer_id;
          if (streamerId) {
            await pool.query(
              `UPDATE streamers
               SET extra_messages = CASE
                     WHEN extra_messages_expiry >= CURRENT_DATE THEN extra_messages + $2
                     ELSE $2
                   END,
                   extra_messages_expiry = CURRENT_DATE + INTERVAL '${TOKEN_PACK.days} days'
               WHERE id = $1`,
              [streamerId, TOKEN_PACK.messages]
            );
            console.log(`[TokenPack] +${TOKEN_PACK.messages} messaggi extra per streamer_id=${streamerId}`);
          }
          break;
        }

        if (session.mode !== 'subscription') break;
        const streamerId = session.metadata?.streamer_id;
        const plan       = session.metadata?.plan;
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        // Durante il trial lo status è 'trialing', altrimenti 'active'
        const checkoutStatus = sub.status === 'trialing' ? 'trialing' : 'active';
        await pool.query(
          `UPDATE streamers
           SET subscription_status    = $1,
               subscription_plan      = $2,
               stripe_subscription_id = $3,
               stripe_customer_id     = $4,
               subscription_end       = to_timestamp($5),
               trial_used             = (trial_used OR $6)
           WHERE id = $7`,
          [checkoutStatus, plan, sub.id, sub.customer, sub.current_period_end, checkoutStatus === 'trialing', streamerId]
        );
        // Connette immediatamente il bot al canale senza attendere il sync periodico
        const { rows: newUser } = await pool.query(
          'SELECT twitch_username, email, display_name FROM streamers WHERE id = $1', [streamerId]
        );
        if (newUser[0]?.twitch_username) {
          botManager.joinChannel(newUser[0].twitch_username).catch(() => {});
        }
        // Email conferma attivazione abbonamento
        if (newUser[0]?.email) {
          const labels = { starter: 'Starter', creator: 'Creator', elite: 'Elite', signature: 'Signature' };
          sendSubscriptionActivatedEmail({
            to:          newUser[0].email,
            displayName: newUser[0].display_name ?? 'Streamer',
            planName:    labels[plan] ?? plan,
            trialEnd:    sub.status === 'trialing' ? sub.trial_end * 1000 : null,
          }).catch(e => console.error('[Email] subscription-activated:', e.message));
        }

        // Processa referral: attiva + premia referrer con coupon Stripe 15% sconto prossimo rinnovo
        if (streamerId) {
          const { rows: refActivated } = await pool.query(
            `UPDATE referrals SET status = 'active', activated_at = NOW()
             WHERE referred_id = $1 AND status = 'pending'
             RETURNING referrer_id`,
            [streamerId]
          );
          if (refActivated[0] && stripe) {
            const { rows: referrerRows } = await pool.query(
              `SELECT stripe_subscription_id, email, display_name FROM streamers WHERE id = $1`,
              [refActivated[0].referrer_id]
            );
            if (referrerRows[0]?.stripe_subscription_id) {
              stripe.coupons.create({
                percent_off: 15,
                duration:    'once',
                name:        'Referral — 15% sconto prossimo rinnovo',
              }).then(coupon =>
                stripe.subscriptions.update(referrerRows[0].stripe_subscription_id, { coupon: coupon.id })
              ).then(() =>
                pool.query(
                  `UPDATE referrals SET status = 'rewarded' WHERE referred_id = $1`,
                  [streamerId]
                )
              ).catch(e => console.error('[Referral] coupon error:', e.message));
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub      = event.data.object;
        const plan     = sub.metadata?.plan ?? null;
        const prevAttr = event.data.previous_attributes ?? {};
        const status   = sub.cancel_at_period_end ? 'cancelling'
          : sub.status === 'trialing'             ? 'trialing'
          : sub.status === 'active'               ? 'active'
          : sub.status === 'past_due'             ? 'past_due'
          : sub.status;
        await pool.query(
          `UPDATE streamers
           SET subscription_status = $1,
               subscription_plan   = COALESCE($2, subscription_plan),
               subscription_end    = to_timestamp($3)
           WHERE stripe_subscription_id = $4`,
          [status, plan, sub.current_period_end, sub.id]
        );
        // Trial → attivo: invia email di conferma
        if (prevAttr.status === 'trialing' && sub.status === 'active') {
          const { rows } = await pool.query(
            'SELECT email, display_name, subscription_plan FROM streamers WHERE stripe_subscription_id = $1',
            [sub.id]
          );
          if (rows[0]?.email) {
            const labels = { starter: 'Starter', creator: 'Creator', elite: 'Elite', signature: 'Signature' };
            sendTrialActivatedEmail({
              to:              rows[0].email,
              displayName:     rows[0].display_name ?? 'Streamer',
              planName:        labels[rows[0].subscription_plan] ?? rows[0].subscription_plan,
              nextBillingDate: sub.current_period_end * 1000,
            }).catch(e => console.error('[Email] trial-activated:', e.message));
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await pool.query(
          `UPDATE streamers
           SET subscription_status    = 'inactive',
               subscription_plan      = NULL,
               stripe_subscription_id = NULL,
               subscription_end       = NULL
           WHERE stripe_subscription_id = $1`,
          [sub.id]
        );
        break;
      }

      // Reminder trial: Stripe lo invia 3 giorni prima della scadenza di default.
      // Per inviarlo esattamente a 2 giorni: Stripe Dashboard → Settings → Subscriptions → Trial reminders.
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object;
        const { rows } = await pool.query(
          'SELECT email, display_name, subscription_plan FROM streamers WHERE stripe_subscription_id = $1',
          [sub.id]
        );
        if (rows[0]?.email) {
          const labels = { starter: 'Starter', creator: 'Creator', elite: 'Elite' };
          sendTrialReminderEmail({
            to:          rows[0].email,
            displayName: rows[0].display_name ?? 'Streamer',
            planName:    labels[rows[0].subscription_plan] ?? 'StreaMindAI',
            trialEnd:    sub.trial_end * 1000,
          }).catch(e => console.error('[Email] trial-reminder:', e.message));
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        // Solo per rinnovi ricorrenti, non per il primo addebito post-trial (già coperto da trial-activated)
        if (inv.billing_reason === 'subscription_cycle') {
          const { rows } = await pool.query(
            'SELECT email, display_name, subscription_plan FROM streamers WHERE stripe_customer_id = $1',
            [inv.customer]
          );
          if (rows[0]?.email) {
            const labels = { starter: 'Starter', creator: 'Creator', elite: 'Elite', signature: 'Signature' };
            sendRenewalConfirmationEmail({
              to:              rows[0].email,
              displayName:     rows[0].display_name ?? 'Streamer',
              planName:        labels[rows[0].subscription_plan] ?? rows[0].subscription_plan,
              amount:          inv.amount_paid,
              nextBillingDate: inv.lines?.data?.[0]?.period?.end
                ? inv.lines.data[0].period.end * 1000
                : Date.now() + 30 * 24 * 60 * 60 * 1000,
            }).catch(e => console.error('[Email] renewal:', e.message));
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object;
        await pool.query(
          "UPDATE streamers SET subscription_status = 'past_due' WHERE stripe_customer_id = $1",
          [inv.customer]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Errore nel webhook' });
  }
}

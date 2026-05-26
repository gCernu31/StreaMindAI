/**
 * Servizio email StreaMindAI — usa Nodemailer con SMTP configurabile.
 *
 * Variabili d'ambiente richieste:
 *   SMTP_HOST    — es. smtp.sendgrid.net / mail.privateemail.com
 *   SMTP_PORT    — default 587 (465 per SSL)
 *   SMTP_USER    — username SMTP
 *   SMTP_PASS    — password SMTP
 *   FROM_EMAIL   — mittente, default noreply@streamindai.com
 *   FRONTEND_URL — base URL del frontend per i link nelle email
 */

import nodemailer from 'nodemailer';

const FRONTEND = process.env.FRONTEND_URL ?? 'https://streamindai.com';
const FROM     = process.env.FROM_EMAIL   ?? 'noreply@streamindai.com';
const REPLY_TO = 'support@streamindai.com';

function makeTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const transporter = makeTransporter();

export async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn('[Email] SMTP non configurato — email non inviata:', subject, '→', to);
    return;
  }
  await transporter.sendMail({
    from:    `StreaMindAI <${FROM}>`,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
  });
}

// ── Layout HTML comune ────────────────────────────────────────────────────────
function wrapHtml(bodyContent) {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>StreaMindAI</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#151515;border:1px solid #262626;border-radius:16px;padding:44px 40px;max-width:560px">
<tr><td>
  <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">StreaMindAI</p>
  <p style="margin:0 0 36px;font-size:12px;color:#8B5CF6;letter-spacing:0.5px;text-transform:uppercase">Il tuo bot Twitch intelligente</p>
  ${bodyContent}
  <p style="margin:36px 0 0;font-size:11px;color:#444;border-top:1px solid #262626;padding-top:20px">
    StreaMindAI · <a href="${FRONTEND}" style="color:#6b6b6b;text-decoration:none">${FRONTEND.replace('https://', '')}</a><br>
    Domande? Rispondi a questa email o scrivi a <a href="mailto:${REPLY_TO}" style="color:#6b6b6b">${REPLY_TO}</a><br>
    Non affiliato con Twitch Interactive, Inc.
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function ctaButton(label, href) {
  return `<table cellpadding="0" cellspacing="0" style="margin-top:28px"><tr><td>
    <a href="${href}"
       style="display:inline-block;background:#8B5CF6;color:#ffffff;font-weight:700;
              font-size:14px;text-decoration:none;padding:14px 28px;border-radius:10px;
              letter-spacing:0.2px">
      ${label}
    </a>
  </td></tr></table>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:10px 14px;background:#1a1a1a;font-size:13px;color:#6b6b6b;font-weight:600;width:160px;vertical-align:top">${label}</td>
    <td style="padding:10px 14px;background:#1e1e1e;font-size:13px;color:#e0e0e0">${value}</td>
  </tr>`;
}

// ── 1. Email: benvenuto dopo registrazione ────────────────────────────────────
export async function sendWelcomeEmail({ to, displayName, hasPlan = false }) {
  await sendEmail({
    to,
    subject: `Benvenuto su StreaMindAI, ${displayName}!`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        Benvenuto su StreaMindAI 🎮
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il tuo account è stato creato con successo. Ora puoi configurare il tuo bot AI e farlo
        lavorare per te in chat Twitch.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:10px;overflow:hidden">
        <tbody>
          ${infoRow('Personalità custom', 'Il bot parla esattamente come vuoi tu')}
          ${infoRow('Comandi custom', 'Crea risposte personalizzate per la tua chat')}
          ${infoRow('Memoria AI', 'Ricorda eventi, inside joke e momenti speciali')}
        </tbody>
      </table>
      <p style="margin:0;font-size:14px;color:#6b6b6b">
        ${hasPlan
          ? 'Inizia subito — hai 7 giorni di prova gratuita. Annulla quando vuoi.'
          : 'Il tuo bot è attivo e pronto — accedi alla dashboard per configurarlo.'
        }
      </p>
      ${ctaButton(hasPlan ? 'Scopri i piani →' : 'Vai alla Dashboard →', hasPlan ? `${FRONTEND}/subscription` : `${FRONTEND}/dashboard`)}
    `),
  });
}

// ── 2. Email: conferma attivazione abbonamento ────────────────────────────────
export async function sendSubscriptionActivatedEmail({ to, displayName, planName, trialEnd }) {
  const hasTrial = trialEnd != null;
  const dateStr  = hasTrial
    ? new Date(trialEnd).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  await sendEmail({
    to,
    subject: `Piano ${planName} attivato — benvenuto a bordo!`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        Piano <span style="color:#8B5CF6">${planName}</span> attivato ✓
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        ${hasTrial
          ? `l'abbonamento è attivo. Hai <strong style="color:#ffffff">7 giorni di prova gratuita</strong> fino al <strong style="color:#ffffff">${dateStr}</strong>. Se non disdici prima, si rinnova automaticamente.`
          : `l'abbonamento è stato attivato con successo. Il bot è già al lavoro sul tuo canale.`
        }
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:10px;overflow:hidden">
        <tbody>
          ${infoRow('Piano attivato', planName)}
          ${hasTrial ? infoRow('Prova gratuita fino al', dateStr) : ''}
          ${infoRow('Prossimo passo', 'Configura personalità, orari e comandi')}
        </tbody>
      </table>
      <p style="margin:0;font-size:14px;color:#6b6b6b">
        Puoi gestire o cancellare l'abbonamento in qualsiasi momento dal pannello — nessuna penale.
      </p>
      ${ctaButton('Configura il tuo bot →', `${FRONTEND}/config`)}
    `),
  });
}

// ── 3. Email: promemoria trial — giorno 5 (2 giorni alla scadenza) ────────────
export async function sendTrialReminderEmail({ to, displayName, planName, trialEnd }) {
  const daysLeft = Math.max(1, Math.round((trialEnd - Date.now()) / 86_400_000));
  const endStr   = new Date(trialEnd).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });

  await sendEmail({
    to,
    subject: `⏰ Mancano ${daysLeft} giorni — hai già configurato il tuo bot?`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        ⏰ Il tuo trial scade tra ${daysLeft} ${daysLeft === 1 ? 'giorno' : 'giorni'}
      </h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il tuo trial <strong style="color:#8B5CF6">${planName}</strong> scade il
        <strong style="color:#ffffff">${endStr}</strong>.
      </p>
      <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Hai già completato la configurazione?
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;color:#a0a0a0;font-size:14px;line-height:2">
        <li>Personalità del bot</li>
        <li>Membri della community</li>
        <li>Orari e link social</li>
        <li>Comandi personalizzati</li>
      </ul>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        Se non vuoi continuare, cancella prima della scadenza dal pannello — non verrà addebitato nulla.
      </p>
      ${ctaButton('Configura il tuo bot →', `${FRONTEND}/config`)}
    `),
  });
}

// ── 4. Email: fine trial — conferma primo addebito ────────────────────────────
export async function sendTrialActivatedEmail({ to, displayName, planName, nextBillingDate }) {
  const dateStr = new Date(nextBillingDate).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  await sendEmail({
    to,
    subject: `Trial terminato — piano ${planName} attivo e addebitato`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        Trial concluso — abbonamento attivo
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il tuo periodo di prova è terminato e il piano
        <strong style="color:#8B5CF6">${planName}</strong> è ora <strong style="color:#ffffff">attivo e a pagamento</strong>.
        Il primo addebito è stato effettuato.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:10px;overflow:hidden">
        <tbody>
          ${infoRow('Piano attivo', planName)}
          ${infoRow('Prossimo rinnovo', dateStr)}
          ${infoRow('Gestisci piano', 'Dashboard → Abbonamento')}
        </tbody>
      </table>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        Puoi cancellare in qualsiasi momento — il piano rimane attivo fino alla fine del periodo pagato.
      </p>
      ${ctaButton('Vai alla Dashboard →', `${FRONTEND}/dashboard`)}
    `),
  });
}

// ── 5. Email: analisi gratuita — report completo ──────────────────────────────
export async function sendAnalysisReportEmail({ to, twitchUsername, analysis }) {
  const escapedAnalysis = analysis
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="color:#8B5CF6;margin:20px 0 8px;font-size:14px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#e0e0e0;margin:24px 0 10px;font-size:16px">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e0e0e0">$1</strong>')
    .replace(/\n- (.+)/g, '<br>• $1')
    .replace(/\n/g, '<br>');

  await sendEmail({
    to,
    subject: `La tua analisi StreaMindAI${twitchUsername ? ` — @${twitchUsername}` : ''}`,
    html: wrapHtml(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff">
        La tua analisi è pronta${twitchUsername ? `, @${twitchUsername}` : ''}! 🎯
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b6b6b">
        Ecco cosa abbiamo trovato analizzando il tuo canale Twitch.
      </p>
      <div style="font-size:15px;line-height:1.7;color:#a0a0a0">
        ${escapedAnalysis}
      </div>
      <div style="margin-top:32px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:24px;text-align:center">
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#ffffff">Vuoi raggiungere questi obiettivi?</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b6b6b">L'AI che ti aiuta attivamente ogni sera sul tuo canale Twitch.</p>
        ${ctaButton('Inizia gratis con StreaMindAI →', `${FRONTEND}/login`)}
      </div>
    `),
  });
}

// ── 5b. Email: cancellazione abbonamento ──────────────────────────────────────
export async function sendCancellationEmail({ to, displayName, planName, activeUntil }) {
  const dateStr = activeUntil
    ? new Date(activeUntil).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  await sendEmail({
    to,
    subject: 'Abbonamento StreaMindAI cancellato',
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        Abbonamento cancellato
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        abbiamo ricevuto la tua richiesta di cancellazione del piano
        <strong style="color:#8B5CF6">${planName}</strong>. La cancellazione è confermata.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:10px;overflow:hidden">
        <tbody>
          ${infoRow('Piano cancellato', planName)}
          ${dateStr ? infoRow('Attivo fino al', dateStr) : ''}
          ${infoRow('Addebiti futuri', 'Nessuno — cancellazione immediata')}
        </tbody>
      </table>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#6b6b6b">
        ${dateStr
          ? `Il tuo bot rimarrà attivo fino al <strong style="color:#e0e0e0">${dateStr}</strong>, poi verrà disattivato automaticamente.`
          : 'Il tuo bot è stato disattivato.'
        }
      </p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        Ci dispiace vederti andare. Se vuoi tornare, puoi riattivarti in qualsiasi momento — tutta la tua configurazione è salvata.
      </p>
      ${ctaButton('Riattiva StreaMindAI →', `${FRONTEND}/subscription`)}
    `),
  });
}

// ── 6. Email: notifica bot offline ────────────────────────────────────────────
export async function sendBotOfflineEmail({ to, displayName, botName = 'il tuo bot' }) {
  await sendEmail({
    to,
    subject: `⚠️ Il tuo bot è offline — stiamo risolvendo`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        ⚠️ Il tuo bot è temporaneamente offline
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        abbiamo rilevato che il tuo bot <strong style="color:#ffffff">${botName}</strong> non è attualmente connesso alla tua chat Twitch.
        Il nostro team è già al lavoro per ripristinare il servizio.
      </p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:0 0 20px">
        <p style="margin:0;font-size:14px;color:#a0a0a0;line-height:1.6">
          <strong style="color:#f59e0b">Cosa sta succedendo:</strong><br>
          Abbiamo rilevato un'interruzione del servizio e stiamo lavorando attivamente per
          risolvere il problema nel minor tempo possibile.
        </p>
      </div>
      <p style="margin:0 0 12px;font-size:14px;color:#6b6b6b">
        Non è necessaria nessuna azione da parte tua. Riceverai una notifica appena il bot sarà di nuovo online.
      </p>
      <p style="margin:0;font-size:14px;color:#6b6b6b">
        Per aggiornamenti urgenti scrivi a
        <a href="mailto:${REPLY_TO}" style="color:#8B5CF6;text-decoration:none">${REPLY_TO}</a>.
      </p>
    `),
  });
}

// ── 7. Email: rinnovo mensile — conferma pagamento ────────────────────────────
export async function sendRenewalConfirmationEmail({ to, displayName, planName, amount, nextBillingDate }) {
  const dateStr = new Date(nextBillingDate).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const amountStr = amount != null
    ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount / 100)
    : null;

  await sendEmail({
    to,
    subject: `Rinnovo confermato — piano ${planName}`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        Rinnovo mensile confermato ✓
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il pagamento per il piano <strong style="color:#8B5CF6">${planName}</strong> è andato a buon fine. Grazie!
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:10px;overflow:hidden">
        <tbody>
          ${infoRow('Piano', planName)}
          ${amountStr ? infoRow('Importo addebitato', amountStr) : ''}
          ${infoRow('Prossimo rinnovo', dateStr)}
        </tbody>
      </table>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        Puoi gestire o cancellare il tuo abbonamento in qualsiasi momento dal pannello.
      </p>
      ${ctaButton('Vai alla Dashboard →', `${FRONTEND}/dashboard`)}
    `),
  });
}

// ── 8. Email: bot tornato online ──────────────────────────────────────────────
export async function sendBotOnlineEmail({ to, displayName }) {
  await sendEmail({
    to,
    subject: `✅ Il tuo bot è di nuovo online`,
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        ✅ Il tuo bot è di nuovo attivo
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        buone notizie! Il tuo bot è stato ripristinato ed è nuovamente connesso alla tua chat Twitch.
      </p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid #22c55e;border-radius:8px;padding:16px 20px;margin:0 0 20px">
        <p style="margin:0;font-size:14px;color:#a0a0a0;line-height:1.6">
          <strong style="color:#22c55e">Servizio ripristinato:</strong><br>
          Il bot è ora operativo e pronto a rispondere nella tua chat come sempre.
        </p>
      </div>
      <p style="margin:0;font-size:14px;color:#6b6b6b">
        Ci scusiamo per l'interruzione. Per qualsiasi domanda scrivi a
        <a href="mailto:${REPLY_TO}" style="color:#8B5CF6;text-decoration:none">${REPLY_TO}</a>.
      </p>
      ${ctaButton('Vai alla Dashboard →', `${FRONTEND}/dashboard`)}
    `),
  });
}

// ── Email: acquisto token pack ────────────────────────────────────────────────
export async function sendTokenPackEmail({ to, displayName, expiryDate, totalMessages }) {
  const dateStr = new Date(expiryDate).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  await sendEmail({
    to,
    subject: 'Token pack attivato — 5.000 messaggi aggiunti',
    html: wrapHtml(`
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#ffffff">
        Token pack attivato ✓
      </h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#a0a0a0">
        Ciao <strong style="color:#ffffff">${displayName}</strong>,<br>
        il tuo acquisto è andato a buon fine. I messaggi extra sono già attivi sul tuo canale.
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;border-radius:10px;overflow:hidden">
        <tbody>
          ${infoRow('Messaggi aggiunti', '5.000')}
          ${infoRow('Scadenza', dateStr)}
          ${totalMessages != null ? infoRow('Totale ora disponibili', Number(totalMessages).toLocaleString('it-IT')) : ''}
        </tbody>
      </table>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#6b6b6b">
        I token extra vengono usati automaticamente quando il piano mensile è esaurito.
        Puoi monitorare i tuoi utilizzi dalla Dashboard.
      </p>
      ${ctaButton('Vai alla Dashboard →', `${FRONTEND}/dashboard`)}
    `),
  });
}

// ── Email: form contatto Signature ────────────────────────────────────────────
export async function sendContactFormEmail({ nome, twitchUsername, piano, motivo }) {
  await sendEmail({
    to:      REPLY_TO,
    subject: `[${piano}] Nuova richiesta da ${nome} (@${twitchUsername})`,
    html: `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;color:#1a1a1a;padding:32px;max-width:600px">
  <h2 style="margin:0 0 6px;color:#8B5CF6">Nuova richiesta ${piano}</h2>
  <p style="margin:0 0 24px;font-size:13px;color:#888">Ricevuta tramite streamindai.com</p>
  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:11px 16px;background:#f5f5f5;width:130px;color:#666;font-weight:600">Nome</td>
      <td style="padding:11px 16px;background:#fafafa">${nome}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f0f0f0;color:#666;font-weight:600">Twitch</td>
      <td style="padding:11px 16px;background:#f7f7f7">@${twitchUsername}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f5f5f5;color:#666;font-weight:600">Piano</td>
      <td style="padding:11px 16px;background:#fafafa">${piano}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f0f0f0;color:#666;font-weight:600;vertical-align:top">Motivo</td>
      <td style="padding:11px 16px;background:#f7f7f7;line-height:1.6">${motivo.replace(/\n/g, '<br>')}</td>
    </tr>
  </table>
</body>
</html>`,
  });
}

// ── Email: form contatto generale (/contatti) ─────────────────────────────────
export async function sendGeneralContactEmail({ nome, email, messaggio }) {
  // Email a noi
  await sendEmail({
    to:      REPLY_TO,
    subject: `[Contatto] Messaggio da ${nome} <${email}>`,
    html: `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:system-ui,sans-serif;color:#1a1a1a;padding:32px;max-width:600px">
  <h2 style="margin:0 0 6px;color:#8B5CF6">Nuovo messaggio dal form contatti</h2>
  <p style="margin:0 0 24px;font-size:13px;color:#888">Ricevuto tramite streamindai.com/contatti</p>
  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:11px 16px;background:#f5f5f5;width:100px;color:#666;font-weight:600">Nome</td>
      <td style="padding:11px 16px;background:#fafafa">${nome}</td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f0f0f0;color:#666;font-weight:600">Email</td>
      <td style="padding:11px 16px;background:#f7f7f7"><a href="mailto:${email}">${email}</a></td>
    </tr>
    <tr>
      <td style="padding:11px 16px;background:#f5f5f5;color:#666;font-weight:600;vertical-align:top">Messaggio</td>
      <td style="padding:11px 16px;background:#fafafa;line-height:1.7">${messaggio.replace(/\n/g, '<br>')}</td>
    </tr>
  </table>
</body>
</html>`,
  });

  // Conferma all'utente
  await sendEmail({
    to:      email,
    subject: `Abbiamo ricevuto il tuo messaggio — StreaMindAI`,
    html: wrapHtml(`
      <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#ffffff">
        Ciao ${nome}, grazie per averci contattato!
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#a0a0a0;line-height:1.7">
        Abbiamo ricevuto il tuo messaggio e ti risponderemo all'indirizzo <strong style="color:#e0e0e0">${email}</strong> entro poche ore.
      </p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-left:3px solid #8B5CF6;border-radius:8px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 8px;font-size:12px;color:#6b6b6b;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Il tuo messaggio</p>
        <p style="margin:0;font-size:14px;color:#c0c0c0;line-height:1.7">${messaggio.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#6b6b6b">
        Nel frattempo puoi consultare le nostre <a href="${FRONTEND}/faq" style="color:#8B5CF6;text-decoration:none">FAQ</a>
        o scriverci direttamente su <a href="https://twitch.tv/StreaMindAI" style="color:#8B5CF6;text-decoration:none">Twitch</a>.
      </p>
      ${ctaButton('Visita StreaMindAI →', FRONTEND)}
    `),
  });
}

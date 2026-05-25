export default function GuidePage() {
  return (
    <div className="max-w-3xl space-y-10">

      {/* Hero */}
      <div
        className="rounded-2xl p-8 border"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%)', borderColor: 'rgba(139,92,246,0.2)' }}
      >
        <h1 className="text-2xl font-bold text-hally-text mb-2">Guida a StreaMindAI</h1>
        <p className="text-hally-text-muted leading-relaxed">
          StreaMindAI è la tua intelligenza artificiale personale per Twitch. In pochi minuti puoi configurarla con la tua personalità, i tuoi spettatori abituali e il tuo stile — poi pensa a tutto lei.
        </p>
      </div>

      {/* 1. Prima configurazione */}
      <Section number="1" title="Prima configurazione">
        <p className="text-hally-text-muted mb-5">
          Dopo aver attivato il tuo abbonamento, vai su <Strong>Il Mio Bot</Strong> e completa questi campi:
        </p>
        <div className="space-y-4">
          <Field label="Nome della tua AI">
            Scegli come vuoi chiamare la tua AI. Questo è il nome che useranno i tuoi spettatori in chat per interagire con lei. Esempio: Hally, Luna, Max, Aria.
          </Field>
          <Field label="Come chiama il tuo creatore">
            Decidi come la tua AI si rivolge a te in chat. Puoi usare il tuo username, un titolo ironico o un soprannome. Esempio: "Signor gCernu", "Boss", "Capo".
          </Field>
          <Field label="Personalità">
            Descrivi il carattere della tua AI in modo libero. Più sei specifico, più sarà precisa nelle risposte. Esempio: "Ironica e diretta, parla come una ragazza della Gen Z, difende sempre lo streamer ma non è servile. Usa un tono leggero e mai formale."
          </Field>
          <Field label="Orari di streaming">
            Inserisci i giorni e gli orari in cui stai solitamente in live. La tua AI li conosce e può rispondere correttamente se qualcuno chiede quando sei online.
          </Field>
          <Field label="Link social">
            Aggiungi i tuoi link (Linktree, Instagram, YouTube). La tua AI li condivide automaticamente quando qualcuno li chiede in chat.
          </Field>
        </div>
      </Section>

      {/* 2. Membri */}
      <Section number="2" title="Aggiungi i tuoi Membri">
        <p className="text-hally-text-muted mb-4">
          Nella sezione <Strong>Membri</Strong> puoi inserire le persone della tua community che hanno un ruolo o una storia con il tuo canale. Per ognuno puoi specificare:
        </p>
        <ul className="space-y-2 mb-4">
          <BulletItem><Strong>Username Twitch</Strong> — per riconoscerli quando scrivono in chat</BulletItem>
          <BulletItem><Strong>Soprannome</Strong> — come la tua AI li chiama</BulletItem>
          <BulletItem><Strong>Comportamento</Strong> — come deve interagire con loro</BulletItem>
        </ul>
        <Callout>
          Esempio: "Gino è il moderatore dittatore, la mia AI lo prende in giro bonariamente ogni volta che appare."
        </Callout>
        <p className="text-hally-text-muted mt-4">
          Più membri aggiungi, più la tua AI sembrerà parte vera della tua community.
        </p>
      </Section>

      {/* 3. Comandi */}
      <Section number="3" title="Comandi personalizzati">
        <p className="text-hally-text-muted mb-4">
          Puoi creare comandi rapidi che la tua AI esegue in chat. Ogni comando ha:
        </p>
        <ul className="space-y-2 mb-4">
          <BulletItem><Strong>Trigger</Strong> — la parola che lo attiva (es. !social, !orari, !spotify)</BulletItem>
          <BulletItem><Strong>Risposta</Strong> — quello che la tua AI risponde</BulletItem>
        </ul>
        <Callout>
          Esempio: trigger "!social" → risposta "Seguimi su Instagram: instagram.com/tuohandle"
        </Callout>
      </Section>

      {/* 4. Interagire in chat */}
      <Section number="4" title="Come interagire con la tua AI in chat">
        <p className="text-hally-text-muted mb-3">
          I tuoi spettatori possono parlare con la tua AI scrivendo:
        </p>
        <CodeBlock>!nomebot [domanda]</CodeBlock>
        <p className="text-hally-text-muted mt-4 mb-3">
          Esempio: se hai chiamato la tua AI "Luna":
        </p>
        <div className="space-y-1 mb-5">
          {['!luna come stai?', '!luna chi è il moderatore più fastidioso?', '!luna che gioco stiamo giocando?'].map(cmd => (
            <CodeBlock key={cmd}>{cmd}</CodeBlock>
          ))}
        </div>
        <p className="text-sm font-semibold text-hally-text mb-3">Limiti per piano:</p>
        <div className="rounded-xl border border-hally-border overflow-hidden">
          {[
            { plan: 'Starter',   msgs: '200 msg/sera sul canale · 4.000/mese' },
            { plan: 'Creator',   msgs: '600 msg/sera sul canale · 12.000/mese' },
            { plan: 'Elite',     msgs: '1.200 msg/sera sul canale · 24.000/mese' },
            { plan: 'Signature', msgs: '3.000 msg/sera sul canale · 60.000/mese' },
          ].map(({ plan, msgs }, i, arr) => (
            <div
              key={plan}
              className={`flex items-center justify-between px-4 py-2.5 text-sm ${i < arr.length - 1 ? 'border-b border-hally-border' : ''}`}
            >
              <span className="font-medium text-hally-text">{plan}</span>
              <span className="text-hally-text-muted">{msgs}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-hally-text-muted mt-3">
          Il conteggio è sul totale del canale per sessione, non per singolo utente. I limiti per utente sono configurabili dallo streamer dal pannello entro i massimi del piano.
        </p>
      </Section>

      {/* 5. Song Request */}
      <Section number="5" title="Song Request">
        <p className="text-hally-text-muted mb-3">
          Se hai il piano Creator o superiore, i tuoi spettatori possono richiedere canzoni con:
        </p>
        <CodeBlock>!sr nome canzone - artista</CodeBlock>
        <p className="text-hally-text-muted mt-3 mb-3">
          Esempio: <span className="font-mono text-xs" style={{ color: '#8B5CF6' }}>!sr Blinding Lights - The Weeknd</span>
        </p>
        <p className="text-hally-text-muted mb-4">
          La canzone viene aggiunta automaticamente alla coda del tuo Spotify. Per attivare questa funzione collega il tuo account Spotify nella sezione <Strong>Il Mio Bot</Strong>.
        </p>
        <p className="text-sm font-semibold text-hally-text mb-2">Per attivare o disattivare le song request durante la live:</p>
        <ul className="space-y-2">
          <BulletItem><Strong>!sr on</Strong> — attiva le richieste</BulletItem>
          <BulletItem><Strong>!sr off</Strong> — disattiva le richieste</BulletItem>
        </ul>
      </Section>

      {/* 6. Risposte automatiche */}
      <Section number="6" title="Risposte automatiche agli eventi">
        <p className="text-hally-text-muted mb-4">
          La tua AI reagisce automaticamente agli eventi del tuo canale:
        </p>
        <div className="space-y-2">
          {[
            { emoji: '🎉', event: 'Nuovo follower',  desc: 'ringrazia chi ti segue' },
            { emoji: '⭐', event: 'Nuovo sub',        desc: "celebra l'abbonamento" },
            { emoji: '🎁', event: 'Gift sub',         desc: 'ringrazia chi regala sub' },
            { emoji: '💎', event: 'Bit',              desc: 'ringrazia la donazione' },
            { emoji: '🚂', event: 'Hype Train',       desc: 'incita la chat' },
            { emoji: '🎮', event: 'Raid',             desc: 'presenta lo streamer in arrivo e fa lo shoutout automatico' },
          ].map(({ emoji, event, desc }) => (
            <div key={event} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-hally-border bg-hally-bg-card">
              <span className="text-lg leading-none mt-0.5">{emoji}</span>
              <div>
                <span className="text-sm font-semibold text-hally-text">{event}</span>
                <span className="text-sm text-hally-text-muted"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-hally-text-muted mt-3">
          Puoi personalizzare il tono di questi messaggi nella sezione <Strong>Il Mio Bot</Strong> se hai il piano Elite o Signature.
        </p>
      </Section>

      {/* 7. Memoria */}
      <Section number="7" title="La Memoria">
        <p className="text-hally-text-muted mb-4">
          La tua AI impara dalla tua chat in automatico. Ogni 20 messaggi analizza la conversazione e salva le informazioni importanti: vittorie, inside joke, caratteristiche degli spettatori, eventi della live.
        </p>
        <p className="text-sm font-semibold text-hally-text mb-2">
          Puoi visualizzare e gestire tutto quello che ha imparato nella sezione <Strong>Memoria</Strong>:
        </p>
        <ul className="space-y-2">
          <BulletItem>Filtra per categoria</BulletItem>
          <BulletItem>Elimina informazioni non accurate</BulletItem>
          <BulletItem>Aggiungi manualmente ricordi importanti</BulletItem>
        </ul>
      </Section>

      {/* 8. FAQ */}
      <Section number="8" title="Domande frequenti">
        <div className="space-y-4">
          {[
            {
              q: 'La mia AI risponde sempre in italiano?',
              a: 'Sì, risponde sempre in italiano indipendentemente dalla lingua di chi scrive.',
            },
            {
              q: 'Posso cambiare il nome della mia AI dopo averla configurata?',
              a: 'Sì, puoi modificare tutti i parametri in qualsiasi momento dalla sezione Il Mio Bot.',
            },
            {
              q: 'Cosa succede se esaurisco i messaggi mensili del mio piano?',
              a: 'La tua AI smette di rispondere fino al rinnovo mensile. Ti consigliamo di monitorare gli utilizzi dalla Dashboard.',
            },
            {
              q: 'Posso usare StreaMindAI su più canali Twitch?',
              a: 'Ogni account StreaMindAI è collegato a un singolo canale Twitch.',
            },
            {
              q: 'Come faccio a disdire l\'abbonamento?',
              a: 'Vai su Abbonamento → Gestisci piano → Cancella abbonamento. Il bot rimane attivo fino alla fine del periodo pagato.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group rounded-xl border border-hally-border bg-hally-bg-card overflow-hidden">
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none list-none text-sm font-semibold text-hally-text">
                {q}
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4 shrink-0 text-hally-text-muted transition-transform group-open:rotate-180">
                  <path d="M3 6l5 5 5-5" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-hally-text-muted">{a}</div>
            </details>
          ))}
        </div>
      </Section>

      {/* Contatti */}
      <div
        className="rounded-2xl p-6 border text-center"
        style={{ backgroundColor: '#111111', borderColor: '#262626' }}
      >
        <p className="text-sm font-semibold text-hally-text mb-1">Hai bisogno di aiuto?</p>
        <p className="text-sm text-hally-text-muted">
          Contattaci su Twitch:{' '}
          <a href="https://twitch.tv/StreaMindAI" target="_blank" rel="noreferrer" style={{ color: '#8B5CF6' }} className="hover:underline font-medium">
            twitch.tv/StreaMindAI
          </a>
        </p>
        <p className="text-sm text-hally-text-muted mt-1">
          Oppure scrivi a:{' '}
          <a href="mailto:support@streamindai.com" style={{ color: '#8B5CF6' }} className="hover:underline font-medium">
            support@streamindai.com
          </a>
        </p>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Componenti helper locali
// ---------------------------------------------------------------------------

function Section({ number, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}
        >
          {number}
        </span>
        <h2 className="text-base font-bold text-hally-text">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="rounded-xl border border-hally-border bg-hally-bg-card px-4 py-3">
      <p className="text-xs font-semibold mb-1" style={{ color: '#8B5CF6' }}>{label}</p>
      <p className="text-sm text-hally-text-muted leading-relaxed">{children}</p>
    </div>
  );
}

function BulletItem({ children }) {
  return (
    <li className="flex items-start gap-2 text-sm text-hally-text-muted list-none">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#8B5CF6' }} />
      <span>{children}</span>
    </li>
  );
}

function Callout({ children }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm text-hally-text-muted italic"
      style={{ backgroundColor: 'rgba(139,92,246,0.07)', borderLeft: '3px solid rgba(139,92,246,0.4)' }}
    >
      {children}
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <div
      className="rounded-lg px-4 py-2.5 text-sm font-mono"
      style={{ backgroundColor: '#0d0d0d', color: '#8B5CF6', border: '1px solid #1e1e1e' }}
    >
      {children}
    </div>
  );
}

function Strong({ children }) {
  return <span className="font-semibold text-hally-text">{children}</span>;
}

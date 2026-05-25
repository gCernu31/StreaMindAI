import LegalLayout, { LegalContent } from '../components/LegalLayout.jsx';

const CONTENT = `
# Termini di Servizio di StreaMindAI

## 1. Accettazione dei Termini

Utilizzando StreaMindAI accetti integralmente questi Termini di Servizio. Se non li accetti, ti preghiamo di non utilizzare il servizio.

## 2. Descrizione del Servizio

StreaMindAI è una piattaforma SaaS che permette agli streamer Twitch di creare e gestire bot AI personalizzati per la propria chat, con funzionalità di risposta automatica, song request Spotify e gestione eventi.

## 3. Registrazione e Account

- Devi avere un account Twitch valido e attivo
- Devi avere almeno 16 anni per utilizzare il servizio
- Sei responsabile della sicurezza delle tue credenziali di accesso
- Un account StreaMindAI corrisponde a un singolo canale Twitch
- Non puoi cedere il tuo account a terzi senza autorizzazione scritta

## 4. Abbonamenti e Pagamenti

- I piani Starter, Creator ed Elite includono 7 giorni di prova gratuita
- La carta di credito viene richiesta al momento dell'attivazione del trial
- Il primo addebito avviene automaticamente dopo 7 giorni se non cancelli prima
- I pagamenti sono ricorrenti mensili, addebitati automaticamente
- Non sono previsti rimborsi per periodi già fatturati salvo obblighi di legge
- Puoi cancellare l'abbonamento in qualsiasi momento dalla sezione Abbonamento della dashboard
- La cancellazione è efficace alla fine del periodo già pagato

## 5. Uso Accettabile

È vietato utilizzare StreaMindAI per:
- Violare le Linee Guida della Comunità di Twitch
- Inviare spam, contenuti inappropriati o offensivi in chat
- Raccogliere dati degli utenti della chat senza consenso esplicito
- Attività illegali, fraudolente o che ledano diritti di terzi
- Aggirare i limiti del piano sottoscritto (es. condividere account)
- Reverse engineering o tentativi di accesso non autorizzato al servizio

## 6. Proprietà Intellettuale

- StreaMindAI, il suo codice sorgente e il brand sono di proprietà di Giuseppe Cernuto
- I contenuti da te inseriti (nome bot, personalità, configurazioni) rimangono di tua proprietà
- Ci concedi una licenza non esclusiva di utilizzare tali contenuti esclusivamente per erogare il servizio
- Le risposte generate dall'AI appartengono al dominio pubblico e non sono soggette a copyright

## 7. Limitazione di Responsabilità

StreaMindAI non è responsabile per:
- Interruzioni del servizio Twitch, Spotify o altri servizi terzi
- Contenuti generati dall'AI che potrebbero essere imprecisi, inappropriati o non pertinenti
- Danni indiretti, consequenziali o perdita di profitti derivanti dall'uso del servizio
- Violazioni delle linee guida Twitch causate da configurazioni errate del bot da parte dell'utente
- Perdita di dati causata da eventi fuori dal nostro controllo (forza maggiore)

La responsabilità massima di StreaMindAI è limitata all'importo pagato negli ultimi 3 mesi di abbonamento.

## 8. Disponibilità del Servizio

Ci impegniamo a garantire la massima disponibilità del servizio (obiettivo: 99,5% uptime mensile) ma non garantiamo il 100% di uptime. Interruzioni pianiferate per manutenzione saranno comunicate via email con almeno 24 ore di preavviso. Puoi monitorare lo stato del servizio su streamindai.com/status.

## 9. Cancellazione dell'Account

- Puoi richiedere la cancellazione del tuo account in qualsiasi momento dalla dashboard o scrivendo a support@streamindai.com
- Alla cancellazione i tuoi dati personali saranno eliminati entro 30 giorni
- Gli abbonamenti attivi rimangono attivi fino alla fine del periodo già pagato
- Alcune informazioni potrebbero essere conservate per obblighi di legge (es. dati fiscali: 10 anni)

## 10. Modifica dei Termini

Ci riserviamo il diritto di modificare questi Termini con preavviso di almeno 30 giorni via email. In caso di modifiche sostanziali, l'uso continuato del servizio dopo la data di entrata in vigore costituisce accettazione. Se non accetti le modifiche, puoi cancellare il tuo account prima della data di entrata in vigore.

## 11. Legge Applicabile e Foro Competente

Questi Termini di Servizio sono regolati dalla legge italiana e dal diritto dell'Unione Europea applicabile. Per qualsiasi controversia è competente il Foro di Palermo.

## 12. Contatti

Per qualsiasi domanda sui Termini di Servizio: **support@streamindai.com**
`;

export default function TerminiPage() {
  return (
    <LegalLayout
      title="Termini di Servizio"
      description="Termini di Servizio di StreaMindAI — condizioni d'uso, abbonamenti, pagamenti e diritti degli utenti."
      canonical="/termini"
      lastUpdate="Maggio 2026"
    >
      <LegalContent text={CONTENT} />
    </LegalLayout>
  );
}

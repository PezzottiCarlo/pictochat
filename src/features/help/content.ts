import type { PictoKey } from '@/features/onboarding/components/picto';

export interface GuideSection {
  id: string;
  picto: PictoKey;
  title: string;
  text: string;
}

export const GUIDE: GuideSection[] = [
  {
    id: 'leggere',
    picto: 'leggere',
    title: 'Leggere i messaggi',
    text: 'Sotto ogni messaggio vedi i pittogrammi. Tocca un pittogramma per sentire la parola. Tocca l’altoparlante per sentire tutto il messaggio.',
  },
  {
    id: 'scrivere',
    picto: 'scrivere',
    title: 'Scrivere con i pittogrammi',
    text: 'Nella chat apri le immagini. Scegli un gruppo, come Cibo o Persone, poi tocca i pittogrammi uno dopo l’altro. La frase si scrive da sola. Poi tocca Invia.',
  },
  {
    id: 'rispondere',
    picto: 'rispondere',
    title: 'Risposte pronte',
    text: 'Quando ti fanno una domanda, compaiono delle risposte pronte. Toccane una per mandarla subito.',
  },
  {
    id: 'ascoltare',
    picto: 'ascoltare',
    title: 'Ascoltare',
    text: 'PictoChat può leggere i messaggi ad alta voce. In Impostazioni scegli la voce, la velocità e se leggere da solo i messaggi nuovi.',
  },
  {
    id: 'foto',
    picto: 'fotocamera',
    title: 'I tuoi pittogrammi',
    text: 'In Pittogrammi puoi creare immagini nuove con le tue foto: il cane, la nonna, la tua scuola. Il tuo pittogramma prende il posto di quello normale.',
  },
  {
    id: 'personalizza',
    picto: 'occhiali',
    title: 'Come piace a te',
    text: 'In Impostazioni cambi la grandezza del testo, i colori, i pittogrammi, la voce e i pulsanti. Ogni cosa si vede subito.',
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQ: Faq[] = [
  {
    q: 'Il codice di Telegram non arriva. Cosa faccio?',
    a: 'Il codice arriva prima nell’app Telegram, nella chat che si chiama “Telegram”. Se non hai l’app, aspetta un minuto e tocca “Invia di nuovo il codice”: arriverà per SMS.',
  },
  {
    q: 'Chi può leggere i miei messaggi?',
    a: 'Le stesse persone di Telegram: tu e chi è nella chat. PictoChat non ha un server: i messaggi passano solo tra questo telefono e Telegram.',
  },
  {
    q: 'Un pittogramma è sbagliato o manca. Posso cambiarlo?',
    a: 'Sì. In Pittogrammi crea un pittogramma tuo con una foto e la parola giusta. Da quel momento PictoChat usa il tuo.',
  },
  {
    q: 'Il telefono non legge ad alta voce.',
    a: 'Controlla il volume e che il telefono non sia in silenzioso. Poi in Impostazioni prova un’altra voce. Alcuni browser non hanno voci italiane: prova con Chrome, Edge o Safari.',
  },
  {
    q: 'Posso usare PictoChat su più telefoni?',
    a: 'Sì, come Telegram: su ogni telefono entri con il tuo numero. Le impostazioni e i pittogrammi personali restano sul telefono dove li hai creati.',
  },
  {
    q: 'Funziona senza internet?',
    a: 'Puoi aprire l’app e rileggere i messaggi già scaricati. Per mandare e ricevere messaggi serve internet.',
  },
  {
    q: 'Come metto PictoChat nella schermata Home?',
    a: 'Apri PictoChat nel browser, tocca il menu e scegli “Aggiungi a schermata Home” (su iPhone: Condividi, poi “Aggiungi alla schermata Home”). Si apre come un’app.',
  },
  {
    q: 'Come esco dal mio account?',
    a: 'In Impostazioni, in fondo, trovi “Esci”. Se c’è un PIN, serve il PIN. Uscendo, PictoChat cancella i messaggi salvati su questo telefono.',
  },
];

export const PARENT_TIPS: string[] = [
  'Usa frasi corte: una sola idea per messaggio.',
  'Fai domande con due scelte, come “Vuoi pizza o pasta?”. Le risposte pronte diventano facilissime.',
  'Scegli parole concrete, che hanno un pittogramma: persone, azioni, cose, luoghi. Evita i modi di dire.',
  'Crea pittogrammi con foto vere delle persone e dei posti di casa.',
  'Se serve, attiva la modalità semplice e un PIN per le impostazioni.',
  'Rispondi sempre, anche con un solo pittogramma: ogni risposta fa venire voglia di scrivere ancora.',
];

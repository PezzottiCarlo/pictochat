import type { StepDefinition } from './types';
import { WelcomeStep } from './WelcomeStep';
import { RoleStep } from './RoleStep';
import { ReadingStep } from './ReadingStep';
import { ThemeStep } from './ThemeStep';
import { PictogramsStep } from './PictogramsStep';
import { VoiceStep } from './VoiceStep';
import { TryStep } from './TryStep';
import { ParentsStep } from './ParentsStep';
import { TelegramStep } from './TelegramStep';
import { DoneStep } from './DoneStep';

export type { StepContext, StepDefinition } from './types';

const read = (title: string, lead: string, extra = '') => `${title}. ${lead} ${extra}`.trim();

export const STEPS: StepDefinition[] = [
  {
    id: 'benvenuto',
    name: 'Benvenuto',
    title: 'Ciao! Questo è PictoChat',
    lead: 'Una chat con le immagini. Le parole diventano pittogrammi, così capirsi è più facile.',
    speech: () =>
      read(
        'Ciao! Questo è PictoChat',
        'Una chat con le immagini. Le parole diventano pittogrammi, così capirsi è più facile.',
        'Insieme sistemiamo il telefono come piace a te. Tocca Iniziamo.',
      ),
    Component: WelcomeStep,
    nextLabel: () => 'Iniziamo',
  },
  {
    id: 'chi',
    name: 'Chi sei',
    title: 'Chi usa questo telefono?',
    lead: 'Scegli una risposta. Prepariamo l’app nel modo giusto per te.',
    speech: () =>
      read(
        'Chi usa questo telefono?',
        'Scegli una risposta.',
        'Sono un ragazzo o una ragazza. Oppure: sono un genitore o un educatore.',
      ),
    Component: RoleStep,
    canNext: (ctx) => ctx.roleChosen,
    blockedHint: 'Scegli una risposta per andare avanti.',
  },
  {
    id: 'lettura',
    name: 'Leggere',
    title: 'Leggere meglio',
    lead: 'Cambia il testo finché leggi senza fatica. La chat qui sotto cambia subito.',
    speech: () =>
      read(
        'Leggere meglio',
        'Cambia il testo finché leggi senza fatica.',
        'Puoi fare il testo più grande, usare lettere per la dislessia, lo stampatello, più spazio e pulsanti più grandi.',
      ),
    Component: ReadingStep,
  },
  {
    id: 'colori',
    name: 'Colori',
    title: 'Colori e tema',
    lead: 'Scegli i colori che ti piacciono e che ti fanno stare tranquillo.',
    speech: () =>
      read(
        'Colori e tema',
        'Scegli i colori che ti piacciono.',
        'Puoi scegliere chiaro, scuro, vetro, calmo o ad alto contrasto. E anche meno animazioni.',
      ),
    Component: ThemeStep,
  },
  {
    id: 'pittogrammi',
    name: 'Pittogrammi',
    title: 'I tuoi pittogrammi',
    lead: 'Fai le persone dei pittogrammi simili a te. Poi scegli quanto grandi le vuoi.',
    speech: () =>
      read(
        'I tuoi pittogrammi',
        'Scegli il colore della pelle e dei capelli delle persone nei pittogrammi.',
        'Poi scegli la grandezza. Il bordo colorato dice che tipo di parola è.',
      ),
    Component: PictogramsStep,
  },
  {
    id: 'voce',
    name: 'Voce',
    title: 'La voce',
    lead: 'PictoChat può leggere ad alta voce. Scegli la voce che capisci meglio.',
    speech: () =>
      read(
        'La voce',
        'PictoChat può leggere ad alta voce.',
        'Scegli la voce, la velocità e il tono. Poi decidi se vuoi suoni e vibrazione.',
      ),
    Component: VoiceStep,
  },
  {
    id: 'prova',
    name: 'Prova',
    title: 'Prova tu!',
    lead: 'Scrivi un messaggio con le immagini e rispondi a una domanda. È solo una prova: non parte niente.',
    speech: () =>
      read(
        'Prova tu!',
        'È solo una prova: non parte niente.',
        'Scrivi io voglio la pizza toccando le immagini. Poi tocca Invia e rispondi alla domanda.',
      ),
    Component: TryStep,
    nextLabel: (ctx) => (ctx.tryDone ? 'Avanti' : 'Salta la prova'),
  },
  {
    id: 'genitori',
    name: 'Genitori',
    title: 'Per i genitori',
    lead: 'Alcune cose utili per chi aiuta: sicurezza, semplicità e pittogrammi personali.',
    speech: (ctx) =>
      read(
        'Per i genitori',
        ctx.role === 'teen' ? 'Questa parte è per chi ti aiuta. Puoi toccare Avanti.' : 'Alcune cose utili per chi aiuta.',
        'Puoi attivare la modalità semplice, mettere un PIN alle impostazioni e creare pittogrammi con le vostre foto.',
      ),
    Component: ParentsStep,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    title: 'Collega Telegram',
    lead: 'PictoChat usa il tuo account Telegram per mandare e ricevere i messaggi.',
    speech: (ctx) =>
      ctx.loggedIn
        ? 'Collega Telegram. Sei già collegato. Tocca Avanti.'
        : read(
            'Collega Telegram',
            'PictoChat usa il tuo account Telegram.',
            'Scrivi il tuo numero di telefono. Ti arriva un codice nell’app Telegram: scrivilo qui. Tutto resta su questo telefono.',
          ),
    Component: TelegramStep,
    canNext: (ctx) => ctx.loggedIn,
    blockedHint: 'Per continuare entra con il tuo account Telegram.',
  },
  {
    id: 'fatto',
    name: 'Fatto',
    title: 'Fatto! Tutto pronto',
    lead: 'Bravissimo. Ora puoi scrivere alla tua famiglia e ai tuoi amici.',
    speech: () => read('Fatto! Tutto pronto', 'Bravissimo. Ora puoi scrivere alla tua famiglia e ai tuoi amici.', 'Tocca Inizia a chattare.'),
    Component: DoneStep,
    nextLabel: () => 'Inizia a chattare',
  },
];

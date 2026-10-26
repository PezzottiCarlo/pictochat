/** Settings sections (URL slugs under /impostazioni/:section) and the settings search index. */
import type { Settings } from '@/core/types';
import type { CategoryColor } from '@/theme';
import { foldText } from '@/features/chats/chatListModel';

export type SectionId =
  | 'profilo'
  | 'aspetto'
  | 'lettura'
  | 'pittogrammi'
  | 'chat'
  | 'voce'
  | 'genitori'
  | 'backup'
  | 'informazioni';

export interface SectionMeta {
  id: SectionId;
  title: string;
  description: string;
  /** Fitzgerald-key tint of the section chip (decorative). */
  tone: CategoryColor;
}

export const SECTIONS: readonly SectionMeta[] = [
  { id: 'profilo', title: 'Profilo', description: 'Chi usa il telefono, uscire', tone: 'person' },
  { id: 'aspetto', title: 'Aspetto', description: 'Tema, colori, trasparenza', tone: 'adjective' },
  { id: 'lettura', title: 'Lettura', description: 'Grandezza del testo, stampatello, pulsanti', tone: 'noun' },
  { id: 'pittogrammi', title: 'Pittogrammi', description: 'Pelle e capelli, grandezza, colori', tone: 'social' },
  { id: 'chat', title: 'Chat', description: 'Tastiera, suggerimenti, frasi veloci', tone: 'verb' },
  { id: 'voce', title: 'Voce e suoni', description: 'Voce che legge, velocità, vibrazione', tone: 'time' },
  { id: 'genitori', title: 'Controllo genitori', description: 'Modalità semplice, chat permesse, PIN', tone: 'place' },
  { id: 'backup', title: 'Backup', description: 'Salva e ripristina impostazioni e foto', tone: 'misc' },
  { id: 'informazioni', title: 'Informazioni', description: 'Versione, guida, tutorial', tone: 'misc' },
];

/** Groups of the section list, in order. Profilo is the card on top. */
export const SECTION_GROUPS: ReadonlyArray<{ title: string; ids: SectionId[] }> = [
  { title: 'Come appare', ids: ['aspetto', 'lettura', 'pittogrammi'] },
  { title: 'Come si usa', ids: ['chat', 'voce'] },
  { title: 'Sicurezza', ids: ['genitori', 'backup'] },
  { title: 'Altro', ids: ['informazioni'] },
];

export const getSection = (id: string | undefined): SectionMeta | undefined => SECTIONS.find((s) => s.id === id);

export interface SearchEntry {
  label: string;
  section: SectionId;
  keywords?: string;
}

/** Every setting, findable by its name or common synonyms. */
export const SEARCH_INDEX: readonly SearchEntry[] = [
  { label: 'Chi usa questo telefono', section: 'profilo', keywords: 'ruolo ragazzo ragazza genitore figlio' },
  { label: 'Esci da Telegram', section: 'profilo', keywords: 'logout disconnetti account' },
  { label: 'Tema', section: 'aspetto', keywords: 'chiaro scuro vetro liquid glass calmo contrasto colori notte' },
  { label: 'Intensità del vetro', section: 'aspetto', keywords: 'trasparenza glass sfocatura' },
  { label: 'Colore principale', section: 'aspetto', keywords: 'accento colore personalizzato' },
  { label: 'Riduci il movimento', section: 'aspetto', keywords: 'animazioni movimento' },
  { label: 'Riduci la trasparenza', section: 'aspetto', keywords: 'vetro opaco' },
  { label: 'Grandezza del testo', section: 'lettura', keywords: 'carattere font dimensione ingrandisci zoom' },
  { label: 'Carattere per dislessia', section: 'lettura', keywords: 'font dislessia opendyslexic' },
  { label: 'Stampatello', section: 'lettura', keywords: 'maiuscolo maiuscole' },
  { label: 'Spazio tra le lettere', section: 'lettura', keywords: 'spaziatura' },
  { label: 'Spazio tra le righe', section: 'lettura', keywords: 'interlinea' },
  { label: 'Testo in grassetto', section: 'lettura', keywords: 'grassetto spesso' },
  { label: 'Grandezza dei pulsanti', section: 'lettura', keywords: 'tocco pulsanti dita motricità' },
  { label: 'Colore della pelle', section: 'pittogrammi', keywords: 'aspetto persona' },
  { label: 'Colore dei capelli', section: 'pittogrammi', keywords: 'aspetto persona' },
  { label: 'Grandezza dei pittogrammi', section: 'pittogrammi', keywords: 'immagini dimensione' },
  { label: 'Posizione della parola', section: 'pittogrammi', keywords: 'etichetta scritta sopra sotto' },
  { label: 'Colori delle categorie', section: 'pittogrammi', keywords: 'fitzgerald bordo' },
  { label: 'Pittogrammi sotto i messaggi', section: 'pittogrammi', keywords: 'traduzione immagini' },
  { label: 'Leggi la parola quando tocchi', section: 'pittogrammi', keywords: 'voce pronuncia' },
  { label: 'Come scrivere', section: 'chat', keywords: 'tastiera pittogrammi composer' },
  { label: 'Risposte suggerite', section: 'chat', keywords: 'suggerimenti' },
  { label: 'Chiedi prima di inviare', section: 'chat', keywords: 'conferma invio' },
  { label: 'Ora dei messaggi', section: 'chat', keywords: 'orario timestamp' },
  { label: 'Frasi veloci', section: 'chat', keywords: 'frasi pronte rapide emoji' },
  { label: 'Voce', section: 'voce', keywords: 'sintesi vocale lettura' },
  { label: 'Velocità della voce', section: 'voce', keywords: 'lenta veloce' },
  { label: 'Tono della voce', section: 'voce', keywords: 'acuta grave' },
  { label: 'Leggi i messaggi ad alta voce', section: 'voce', keywords: 'lettura automatica' },
  { label: 'Suoni', section: 'voce', keywords: 'audio effetti' },
  { label: 'Vibrazione', section: 'voce', keywords: 'vibra aptico' },
  { label: 'Modalità semplice', section: 'genitori', keywords: 'semplificata bambino' },
  { label: 'Chat permesse', section: 'genitori', keywords: 'contatti consentiti filtro' },
  { label: 'PIN del genitore', section: 'genitori', keywords: 'blocco password codice protezione' },
  { label: 'Salva un backup', section: 'backup', keywords: 'esporta copia file' },
  { label: 'Ripristina un backup', section: 'backup', keywords: 'importa carica file' },
  { label: 'Torna alle impostazioni iniziali', section: 'backup', keywords: 'reset ripristina predefinite' },
  { label: 'Versione dell’app', section: 'informazioni', keywords: 'info crediti arasaac' },
  { label: 'Rifai il tutorial', section: 'informazioni', keywords: 'benvenuto guida introduzione' },
  { label: 'Guida', section: 'informazioni', keywords: 'aiuto help' },
];

/** Settings whose label, synonyms or section title contain every word of the query. */
export function searchSettings(query: string, index: readonly SearchEntry[] = SEARCH_INDEX): SearchEntry[] {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return index.filter((e) => {
    const hay = foldText(`${e.label} ${e.keywords ?? ''} ${getSection(e.section)?.title ?? ''}`);
    return words.every((w) => hay.includes(w));
  });
}

/**
 * Where each Settings field is edited. Typed as a full Record so a new field added to
 * Settings fails the typecheck until it gets a place in the UI.
 */
export const SETTING_SECTION: Record<keyof Settings, SectionId> = {
  role: 'profilo',
  onboardingDone: 'informazioni',
  themeId: 'aspetto',
  accentColor: 'aspetto',
  glassIntensity: 'aspetto',
  reduceMotion: 'aspetto',
  reduceTransparency: 'aspetto',
  fontScale: 'lettura',
  dyslexicFont: 'lettura',
  uppercase: 'lettura',
  letterSpacing: 'lettura',
  lineHeight: 'lettura',
  touchSize: 'lettura',
  boldText: 'lettura',
  appearance: 'pittogrammi',
  showPictograms: 'pittogrammi',
  pictogramSize: 'pittogrammi',
  pictogramLabel: 'pittogrammi',
  categoryColors: 'pittogrammi',
  speakOnTap: 'pittogrammi',
  composerMode: 'chat',
  showSuggestions: 'chat',
  confirmBeforeSend: 'chat',
  showTimestamps: 'chat',
  quickPhrases: 'chat',
  autoSpeak: 'voce',
  speechRate: 'voce',
  speechPitch: 'voce',
  voiceURI: 'voce',
  sounds: 'voce',
  haptics: 'voce',
  simpleMode: 'genitori',
  settingsPinHash: 'genitori',
  allowedChatIds: 'genitori',
};

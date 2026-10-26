/**
 * Shared domain contracts. Every layer (telegram, aac, stores, UI) speaks these
 * plain, serializable types; GramJS classes never leak outside services/telegram.
 */

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Telegram peer id as a decimal string (bigInt-safe, JSON/IndexedDB friendly). */
export type PeerId = string;

export type ChatKind = 'user' | 'bot' | 'group' | 'channel' | 'self';

export type Presence =
  | { state: 'online' }
  | { state: 'offline'; lastSeen?: number }
  | { state: 'recently' | 'lastWeek' | 'lastMonth' | 'unknown' };

export type MediaKind =
  | 'photo'
  | 'video'
  | 'gif'
  | 'sticker'
  | 'voice'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'poll'
  | 'webpage'
  | 'unknown';

export interface MediaInfo {
  kind: MediaKind;
  mimeType?: string;
  fileName?: string;
  size?: number;
  width?: number;
  height?: number;
  /** Seconds, for audio/video/voice. */
  duration?: number;
  /** Tiny inline preview (data: URL) usable before the real media is downloaded. */
  thumbDataUrl?: string;
  /** Location / contact / poll / webpage extras, already human readable. */
  title?: string;
  description?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
}

export type MessageStatus = 'sending' | 'sent' | 'read' | 'failed';

export interface ChatMessage {
  /** Telegram message id (unique per chat). Negative for optimistic local messages. */
  id: number;
  chatId: PeerId;
  senderId?: PeerId;
  senderName?: string;
  out: boolean;
  /** Unix epoch in milliseconds. */
  date: number;
  editDate?: number;
  text: string;
  media?: MediaInfo;
  replyToId?: number;
  status?: MessageStatus;
  /** Service messages (joined group, pinned, …) rendered as centered notes. */
  service?: boolean;
}

export interface ChatSummary {
  id: PeerId;
  kind: ChatKind;
  title: string;
  username?: string;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
  lastMessage?: ChatMessage;
  presence?: Presence;
  hasPhoto: boolean;
  /** Highest message id the other side has read (for read ticks). */
  readOutboxMaxId?: number;
}

export interface Me {
  id: PeerId;
  firstName: string;
  lastName?: string;
  username?: string;
  phone?: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export type MessagingEvent =
  | { type: 'message:new'; message: ChatMessage }
  | { type: 'message:edited'; message: ChatMessage }
  | { type: 'message:deleted'; chatId?: PeerId; ids: number[] }
  | {
      type: 'chat:read';
      chatId: PeerId;
      maxId: number;
      outbox: boolean;
      /** Inbox only: messages still unread after this read (e.g. read on another device). */
      unreadCount?: number;
    }
  | { type: 'presence'; userId: PeerId; presence: Presence }
  | { type: 'typing'; chatId: PeerId; userId: PeerId }
  | { type: 'connection'; state: ConnectionState };

// ---------------------------------------------------------------------------
// Pictograms (AAC)
// ---------------------------------------------------------------------------

export type SkinColor = 'white' | 'black' | 'asian' | 'mulatto' | 'aztec';
export type HairColor = 'blonde' | 'brown' | 'darkBrown' | 'gray' | 'darkGray' | 'red' | 'black';

export interface Appearance {
  skin: SkinColor;
  hair: HairColor;
}

export interface Pictogram {
  /** ARASAAC numeric id, or `p:<uuid>` for personal pictograms. */
  id: string;
  /** Label shown under the image (Italian). */
  word: string;
  /** Ready-to-use image URL (appearance already applied for ARASAAC). */
  url: string;
  source: 'arasaac' | 'personal';
  /** Composer category id this pictogram belongs to, when known. */
  category?: string;
}

export interface PersonalPictogram {
  id: string;
  /** Word or short phrase (lowercase, trimmed) the pictogram stands for. */
  word: string;
  /** Composer category id (see Category.id). */
  category: string;
  /** Image as a Blob stored in IndexedDB. */
  image: Blob;
  createdAt: number;
  /** Who added it: the user themselves or imported from a chat message. */
  origin: 'manual' | 'chat';
}

/** One token of a text→pictogram translation, in sentence order. */
export interface PictogramToken {
  /** Original surface text covered by this token (may be several words). */
  text: string;
  /** Normalized lemma used for the lookup (e.g. infinitive for verbs). */
  lemma: string;
  pictogram?: Pictogram;
  /** True for articles/prepositions etc. that are intentionally not illustrated. */
  skipped?: boolean;
}

export interface ReplySuggestion {
  /** Text that will be sent if the user picks this suggestion. */
  text: string;
  pictograms: Pictogram[];
  /** Why it was suggested — useful for debugging and for the thesis evaluation. */
  reason: 'choice' | 'yes-no' | 'predefined' | 'wh-question' | 'greeting' | 'fallback';
}

export interface Category {
  id: string;
  label: string;
  /** Emoji or pictogram URL used as the tab icon. */
  icon: string;
  /** Semantic color hint for the composer (Fitzgerald-key inspired). */
  color: 'person' | 'verb' | 'noun' | 'adjective' | 'social' | 'place' | 'time' | 'misc';
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface QuickPhrase {
  id: string;
  text: string;
  /** Emoji or pictogram URL. */
  icon: string;
}

/** 'system' follows prefers-color-scheme; the rest are ids from src/theme/themes.ts. */
export type ThemeId = string;

/** Who mainly uses this device; picks sensible presets during onboarding. */
export type UserRole = 'teen' | 'parent';

export type SizeStep = 'sm' | 'md' | 'lg' | 'xl';

export interface Settings {
  // --- profile -------------------------------------------------------------
  role: UserRole;
  /** v2 onboarding completed (everyone redoes it after upgrading from v1). */
  onboardingDone: boolean;

  // --- look ----------------------------------------------------------------
  themeId: ThemeId;
  /** Overrides the theme accent (hex) — null keeps the theme's own. */
  accentColor: string | null;
  /** 0–1, only for glass themes: how translucent/refractive surfaces are. */
  glassIntensity: number;
  /** 'system' follows prefers-reduced-motion. */
  reduceMotion: 'system' | 'on' | 'off';
  /** 'system' follows prefers-reduced-transparency; 'on' disables glass/blur. */
  reduceTransparency: 'system' | 'on' | 'off';

  // --- text & reading ------------------------------------------------------
  /** 1 = default; range 0.85–1.8. Scales the whole type ramp. */
  fontScale: number;
  dyslexicFont: boolean;
  /** STAMPATELLO: many AAC users read uppercase more easily. */
  uppercase: boolean;
  letterSpacing: 'normal' | 'wide' | 'wider';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  /** Touch target scale for buttons/tiles (accessibility for motor difficulties). */
  touchSize: 'comfortable' | 'large' | 'xl';
  boldText: boolean;

  // --- pictograms ----------------------------------------------------------
  appearance: Appearance;
  /** Show pictogram translation under every text message. */
  showPictograms: boolean;
  pictogramSize: SizeStep;
  pictogramLabel: 'below' | 'above' | 'hidden';
  /** Colored category border on tiles (Fitzgerald key). */
  categoryColors: boolean;
  /** Speak a pictogram's word when tapped in the composer. */
  speakOnTap: boolean;

  // --- chat ----------------------------------------------------------------
  /** Which input opens first in a chat. */
  composerMode: 'pictograms' | 'keyboard';
  /** Show reply suggestions above the composer. */
  showSuggestions: boolean;
  /** Ask confirmation before sending (avoids accidental sends). */
  confirmBeforeSend: boolean;
  showTimestamps: boolean;
  quickPhrases: QuickPhrase[];

  // --- voice & feedback ----------------------------------------------------
  /** Read incoming messages aloud automatically. */
  autoSpeak: boolean;
  /** Speech rate for text-to-speech, 0.6–1.4. */
  speechRate: number;
  speechPitch: number;
  /** SpeechSynthesisVoice.voiceURI, null = best Italian voice. */
  voiceURI: string | null;
  /** Sound effects for send/receive. */
  sounds: boolean;
  haptics: boolean;

  // --- safety / simplicity -------------------------------------------------
  /** Simple mode: hides advanced features (media, groups, editing settings) for the teen. */
  simpleMode: boolean;
  /** Parent PIN protecting settings & logout; null = no lock. Stored as SHA-256 hex. */
  settingsPinHash: string | null;
  /** Only show these chats in simple mode (empty = all private chats). */
  allowedChatIds: string[];
}

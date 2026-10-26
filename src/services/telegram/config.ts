// Telegram api id/hash are not secrets: every client app ships them (no backend exists to hide them).
const DEFAULT_API_ID = 27988472;
const DEFAULT_API_HASH = 'aac13796c816fee0e9557169aecbc071';

const envId = Number(import.meta.env?.VITE_TG_API_ID);
const envHash = import.meta.env?.VITE_TG_API_HASH;

export const TG_API_ID: number = Number.isFinite(envId) && envId > 0 ? envId : DEFAULT_API_ID;
export const TG_API_HASH: string = envHash ? envHash : DEFAULT_API_HASH;

/** localStorage key of the GramJS StringSession (same as v1, so existing logins survive). */
export const SESSION_KEY = 'stringSession';
/** localStorage key of the cached plain `Me`. */
export const ME_KEY = 'pictochat:me';

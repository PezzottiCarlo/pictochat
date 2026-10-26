export type TelegramAuthErrorCode =
  | 'PHONE_NUMBER_INVALID'
  | 'PHONE_NUMBER_BANNED'
  | 'PHONE_CODE_INVALID'
  | 'PHONE_CODE_EXPIRED'
  | 'PHONE_CODE_EMPTY'
  | 'PASSWORD_INVALID'
  | 'FLOOD_WAIT'
  | 'NETWORK'
  | 'UNKNOWN';

/** Typed auth error; `message` is Italian and safe to show to the user. */
export class TelegramAuthError extends Error {
  readonly code: TelegramAuthErrorCode;
  /** Seconds to wait, for FLOOD_WAIT. */
  readonly seconds?: number;

  constructor(code: TelegramAuthErrorCode, message: string, seconds?: number) {
    super(message);
    this.name = 'TelegramAuthError';
    this.code = code;
    this.seconds = seconds;
  }
}

/** Raw RPC error text (e.g. "PHONE_CODE_INVALID") from any GramJS error, if present. */
export function rpcErrorMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object') {
    const e = err as { errorMessage?: unknown; message?: unknown };
    if (typeof e.errorMessage === 'string') return e.errorMessage;
    if (typeof e.message === 'string') return e.message;
  }
  return undefined;
}

function floodSeconds(err: unknown): number | undefined {
  const s = (err as { seconds?: unknown } | null)?.seconds;
  if (typeof s === 'number') return s;
  const m = /FLOOD_WAIT_(\d+)|wait of (\d+) seconds/i.exec(rpcErrorMessage(err) ?? '');
  return m ? Number(m[1] ?? m[2]) : undefined;
}

function formatWait(seconds: number): string {
  if (seconds < 90) return `${seconds} secondi`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minuti`;
  return `${Math.ceil(minutes / 60)} ore`;
}

/** Errors that mean the stored session is no longer valid. */
export function isSessionRevoked(err: unknown): boolean {
  const m = rpcErrorMessage(err) ?? '';
  return /AUTH_KEY_UNREGISTERED|SESSION_REVOKED|SESSION_EXPIRED|USER_DEACTIVATED|AUTH_KEY_INVALID/.test(m);
}

export function toAuthError(err: unknown): TelegramAuthError {
  if (err instanceof TelegramAuthError) return err;
  const m = rpcErrorMessage(err) ?? '';
  const flood = floodSeconds(err);
  if (flood !== undefined || m === 'FLOOD' || m.startsWith('PHONE_NUMBER_FLOOD')) {
    return new TelegramAuthError(
      'FLOOD_WAIT',
      flood
        ? `Troppi tentativi. Riprova tra ${formatWait(flood)}.`
        : 'Troppi tentativi. Riprova più tardi.',
      flood,
    );
  }
  if (m.includes('PHONE_NUMBER_INVALID'))
    return new TelegramAuthError('PHONE_NUMBER_INVALID', 'Il numero di telefono non è valido. Controlla il prefisso (es. +39).');
  if (m.includes('PHONE_NUMBER_BANNED'))
    return new TelegramAuthError('PHONE_NUMBER_BANNED', 'Questo numero è stato bloccato da Telegram.');
  if (m.includes('PHONE_CODE_INVALID'))
    return new TelegramAuthError('PHONE_CODE_INVALID', 'Il codice non è corretto. Riprova.');
  if (m.includes('PHONE_CODE_EXPIRED'))
    return new TelegramAuthError('PHONE_CODE_EXPIRED', 'Il codice è scaduto. Richiedine uno nuovo.');
  if (m.includes('PHONE_CODE_EMPTY'))
    return new TelegramAuthError('PHONE_CODE_EMPTY', 'Inserisci il codice che hai ricevuto.');
  if (m.includes('PASSWORD_HASH_INVALID') || m.includes('Password is empty'))
    return new TelegramAuthError('PASSWORD_INVALID', 'La password non è corretta.');
  if (/timeout|disconnected|network|websocket|connect/i.test(m))
    return new TelegramAuthError('NETWORK', 'Impossibile collegarsi a Telegram. Controlla la connessione.');
  return new TelegramAuthError('UNKNOWN', 'Si è verificato un errore. Riprova.');
}

import { LockOutlined } from '@ant-design/icons';

/** Short privacy promise shown wherever the user is asked for their number. */
export function PrivacyNote() {
  return (
    <p className="au-privacy">
      <LockOutlined aria-hidden="true" />
      <span>
        Tutto resta su questo telefono. PictoChat non ha un suo server: parla direttamente con Telegram, come l’app
        ufficiale.
      </span>
    </p>
  );
}

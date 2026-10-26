import { Button } from 'antd';
import { EditOutlined, SendOutlined } from '@ant-design/icons';
import type { Pictogram, PictogramToken } from '@/core/types';
import { usePictogramTokens, categoryColorOf } from '@/services/aac';
import { PictoStrip, Sheet } from '@/components/ui';

export interface PendingSend {
  text: string;
  /** The exact pictograms chosen in the composer (otherwise the text is translated). */
  pictograms?: Pictogram[];
  onSent?: () => void;
}

export interface ConfirmSendSheetProps {
  pending: PendingSend | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const colorOf = (t: PictogramToken) => categoryColorOf(t.pictogram?.category);

/** "Inviare questo messaggio?" with the message as pictograms and text. */
export function ConfirmSendSheet({ pending, onConfirm, onCancel }: ConfirmSendSheetProps) {
  const translated = usePictogramTokens(pending && !pending.pictograms ? pending.text : undefined);
  const tokens: PictogramToken[] | undefined = pending?.pictograms
    ? pending.pictograms.map((p) => ({
        text: p.word,
        lemma: p.word,
        pictogram: p,
      }))
    : translated;

  return (
    <Sheet
      open={!!pending}
      onClose={onCancel}
      title="Inviare questo messaggio?"
      footer={
        <div className="ch-confirm__actions">
          <Button size="large" icon={<EditOutlined />} onClick={onCancel}>
            Modifica
          </Button>
          <Button type="primary" size="large" icon={<SendOutlined />} onClick={onConfirm} autoFocus>
            Invia
          </Button>
        </div>
      }
    >
      {pending && (
        <div className="ch-confirm">
          {tokens && tokens.some((t) => t.pictogram) && (
            <PictoStrip tokens={tokens} wrap colorOf={colorOf} aria-label="Il messaggio in pittogrammi" />
          )}
          <p className="ch-confirm__text">{pending.text}</p>
        </div>
      )}
    </Sheet>
  );
}

import { useState } from 'react';
import { Button } from 'antd';
import { CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import type { ChatMessage } from '@/core/types';
import { usePersonalPictograms, categoryColorOf, categoryById } from '@/services/aac';
import { feedback } from '@/lib/feedback';
import { PictoTile } from '@/components/ui';
import { useChatUi } from '../context';

interface Props {
  message: ChatMessage;
  share: { category: string; word: string };
}

type SaveState = 'idle' | 'saving' | 'done' | 'error';

/**
 * A personal pictogram shared over chat (photo + `#picto categoria: parola`). Never imported
 * silently: the receiver decides with one explicit tap.
 */
export function PictogramShareCard({ message, share }: Props) {
  const { useMediaUrl } = useChatUi();
  const { url } = useMediaUrl(message.chatId, message.id, message.id > 0);
  const { items, add } = usePersonalPictograms();
  const [state, setState] = useState<SaveState>('idle');
  const existing = items.some((p) => p.word === share.word);
  const src = url ?? message.media?.thumbDataUrl ?? '';

  const save = async () => {
    if (!url) return;
    setState('saving');
    try {
      const image = await (await fetch(url)).blob();
      await add({
        word: share.word,
        category: share.category,
        image,
        origin: 'chat',
      });
      setState('done');
      feedback('success');
    } catch {
      setState('error');
      feedback('error');
    }
  };

  return (
    <div className="ch-share">
      <PictoTile
        pictogram={{
          id: `share:${message.id}`,
          word: share.word,
          url: src,
          source: 'personal',
          category: share.category,
        }}
        size="md"
        color={categoryColorOf(share.category)}
      />
      <div className="ch-share__text">
        <p className="ch-share__title">{message.out ? 'Hai condiviso un pittogramma' : 'Nuovo pittogramma'}</p>
        <p className="ch-share__word">{share.word}</p>
        {categoryById(share.category)?.label && <p className="ch-share__detail">{categoryById(share.category)?.label}</p>}
        {!message.out &&
          (state === 'done' ? (
            <p className="ch-share__done" role="status">
              <CheckCircleFilled aria-hidden="true" /> Aggiunto ai tuoi pittogrammi
            </p>
          ) : (
            <>
              {existing && <p className="ch-share__detail">Hai già un pittogramma per questa parola.</p>}
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                loading={state === 'saving'}
                disabled={!url}
                onClick={() => void save()}
              >
                {existing ? 'Usa questa immagine' : 'Aggiungi ai miei pittogrammi'}
              </Button>
              {state === 'error' && (
                <p className="ch-share__detail" role="alert">
                  Non è stato possibile salvarlo. Riprova.
                </p>
              )}
            </>
          ))}
      </div>
    </div>
  );
}

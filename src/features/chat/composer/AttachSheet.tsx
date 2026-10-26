import { useEffect, useState } from 'react';
import { Button, Input } from 'antd';
import { FileOutlined, SendOutlined } from '@ant-design/icons';
import { Sheet } from '@/components/ui';
import { formatBytes } from '../lib/format';

export interface AttachSheetProps {
  file: File | null;
  onClose: () => void;
  onSend: (file: File, caption?: string) => void;
}

/** Preview of the chosen file with an optional caption. */
export function AttachSheet({ file, onClose, onSend }: AttachSheetProps) {
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string>();
  const image = !!file?.type.startsWith('image/');

  useEffect(() => {
    setCaption('');
    if (!file || !file.type.startsWith('image/')) return setPreview(undefined);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <Sheet
      open={!!file}
      onClose={onClose}
      title={image ? 'Invia la foto' : 'Invia il file'}
      footer={
        <Button
          type="primary"
          size="large"
          block
          icon={<SendOutlined />}
          onClick={() => file && onSend(file, caption.trim() || undefined)}
        >
          Invia
        </Button>
      }
    >
      {file && (
        <div className="ch-attach">
          {preview ? (
            <img className="ch-attach__img" src={preview} alt="" />
          ) : (
            <p className="ch-attach__file">
              <FileOutlined aria-hidden="true" />
              <span className="pc-keep-case">{file.name}</span>
              <span>{formatBytes(file.size)}</span>
            </p>
          )}
          <Input.TextArea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Aggiungi un messaggio (facoltativo)"
            aria-label="Messaggio con il file"
            autoSize={{ minRows: 1, maxRows: 4 }}
            size="large"
          />
        </div>
      )}
    </Sheet>
  );
}

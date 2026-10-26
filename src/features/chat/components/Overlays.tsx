/** Screen-level overlays opened from bubbles: enlarged pictogram and fullscreen photo. */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from 'antd';
import { CloseOutlined, DownloadOutlined, SoundOutlined } from '@ant-design/icons';
import type { Pictogram } from '@/core/types';
import { speak, categoryColorOf } from '@/services/aac';
import { IconButton, PictoTile, Sheet } from '@/components/ui';
import type { PhotoView } from '../context';

export function PictogramSheet({ pictogram, onClose }: { pictogram: Pictogram | null; onClose: () => void }) {
  return (
    <Sheet
      open={!!pictogram}
      onClose={onClose}
      title={pictogram?.word}
      footer={
        <Button
          type="primary"
          size="large"
          block
          icon={<SoundOutlined />}
          onClick={() => pictogram && void speak(pictogram.word)}
        >
          Ascolta
        </Button>
      }
    >
      {pictogram && (
        <div className="ch-picto-sheet">
          <PictoTile
            pictogram={pictogram}
            size="xl"
            labelPosition="hidden"
            color={categoryColorOf(pictogram.category)}
          />
        </div>
      )}
    </Sheet>
  );
}

export function PhotoViewer({ photo, onClose }: { photo: PhotoView | null; onClose: () => void }) {
  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [photo, onClose]);

  return createPortal(
    <AnimatePresence>
      {photo && (
        <motion.div
          className="ch-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Foto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="ch-viewer__bar">
            <a
              className="ch-viewer__save"
              href={photo.url}
              download={photo.fileName || 'foto.jpg'}
              aria-label="Salva la foto"
            >
              <DownloadOutlined />
            </a>
            <IconButton icon={<CloseOutlined />} aria-label="Chiudi" variant="glass" onClick={onClose} autoFocus />
          </div>
          <motion.img
            className="ch-viewer__img"
            src={photo.url}
            alt={photo.caption || 'Foto'}
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            onClick={onClose}
          />
          {photo.caption && <p className="ch-viewer__caption">{photo.caption}</p>}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

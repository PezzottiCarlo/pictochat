import { useState, type ReactNode } from 'react';
import {
  BarChartOutlined,
  CustomerServiceOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  FileOutlined,
  FilePdfOutlined,
  LinkOutlined,
  LoadingOutlined,
  PhoneOutlined,
  PictureOutlined,
  PlayCircleFilled,
  SmileOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ChatMessage, MediaInfo } from '@/core/types';
import { useReducedMotion } from '@/theme';
import { cx, type StyleWithVars } from '@/components/ui';
import { useChatUi, type MediaState } from '../context';
import { formatBytes, formatDuration, isPdf, mediaLabel } from '../lib/format';
import './media.css';

interface MediaProps {
  message: ChatMessage;
  media: MediaInfo;
}

/** Downloads the message media (only for messages already on the server). */
function useMedia(message: ChatMessage, enabled: boolean): MediaState {
  const { useMediaUrl } = useChatUi();
  return useMediaUrl(message.chatId, message.id, enabled && message.id > 0);
}

const ratioOf = (m: MediaInfo): number => {
  const r = m.width && m.height ? m.width / m.height : 4 / 3;
  return Math.min(1.8, Math.max(0.6, r));
};

function Spinner() {
  return <LoadingOutlined className="ch-media__spin" aria-label="Caricamento" />;
}

/** A row with an icon, a title, a detail line and an action (documents, audio, places…). */
function MediaCard({
  icon,
  title,
  detail,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ch-card">
      <span className="ch-card__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ch-card__text">
        <span className="ch-card__title">{title}</span>
        {detail && <span className="ch-card__detail">{detail}</span>}
      </span>
      {action && <span className="ch-card__action">{action}</span>}
    </div>
  );
}

function Photo({ message, media }: MediaProps) {
  const { openPhoto } = useChatUi();
  const { url, loading, error } = useMedia(message, true);
  const [loaded, setLoaded] = useState<string | null>(null);
  // Optimistic local photos carry their preview (object URL) in thumbDataUrl.
  const src = url ?? (message.id < 0 ? media.thumbDataUrl : undefined);
  const style: StyleWithVars = { '--ratio': ratioOf(media) };
  return (
    <button
      type="button"
      className="ch-photo"
      style={style}
      disabled={!src}
      aria-label={src ? 'Foto. Tocca per ingrandire' : 'Foto'}
      onClick={() => src && openPhoto({ url: src, caption: message.text, fileName: media.fileName })}
    >
      {media.thumbDataUrl && <img className="ch-photo__thumb" src={media.thumbDataUrl} alt="" aria-hidden="true" />}
      {src && (
        <img
          className={cx('ch-photo__img', loaded === src && 'is-loaded')}
          src={src}
          alt=""
          decoding="async"
          onLoad={() => setLoaded(src)}
        />
      )}
      {loading && !src && <Spinner />}
      {error && !src && (
        <span className="ch-media__note">
          <PictureOutlined aria-hidden="true" /> Foto non disponibile
        </span>
      )}
    </button>
  );
}

/** Video / voice / audio: downloaded only when the user asks to play it. */
function Playable({ message, media }: MediaProps) {
  const [wanted, setWanted] = useState(false);
  const { url, loading, error } = useMedia(message, wanted);
  const duration = formatDuration(media.duration);
  const isVideo = media.kind === 'video';

  if (url && isVideo) {
    return (
      <video className="ch-video" src={url} controls autoPlay playsInline poster={media.thumbDataUrl}>
        <track kind="captions" />
      </video>
    );
  }
  if (url) return <audio className="ch-audio" src={url} controls autoPlay />;

  if (isVideo) {
    const style: StyleWithVars = { '--ratio': ratioOf(media) };
    return (
      <button
        type="button"
        className="ch-photo ch-photo--video"
        style={style}
        disabled={message.id < 0}
        aria-label={`Guarda il video${duration ? `, ${duration}` : ''}`}
        onClick={() => setWanted(true)}
      >
        {media.thumbDataUrl && <img className="ch-photo__thumb" src={media.thumbDataUrl} alt="" aria-hidden="true" />}
        <span className="ch-play" aria-hidden="true">
          {loading ? <LoadingOutlined /> : <PlayCircleFilled />}
        </span>
        {duration && <span className="ch-photo__badge">{duration}</span>}
        {error && <span className="ch-media__note">Video non disponibile</span>}
      </button>
    );
  }
  return (
    <MediaCard
      icon={<CustomerServiceOutlined />}
      title={mediaLabel(media)}
      detail={error ? 'Non disponibile' : [duration, media.description].filter(Boolean).join(', ') || undefined}
      action={
        <button
          type="button"
          className="ch-media__button"
          disabled={message.id < 0 || loading}
          onClick={() => setWanted(true)}
          aria-label={`Ascolta ${mediaLabel(media).toLowerCase()}`}
        >
          {loading ? <LoadingOutlined /> : <PlayCircleFilled />}
        </button>
      }
    />
  );
}

/** GIFs and video stickers are short silent loops (still with reduced motion). */
function Loop({ message, media }: MediaProps) {
  const reduced = useReducedMotion();
  const { url, loading } = useMedia(message, true);
  const style: StyleWithVars = { '--ratio': ratioOf(media) };
  if (!url) {
    return (
      <span className="ch-photo" style={style} role="img" aria-label={mediaLabel(media)}>
        {media.thumbDataUrl && <img className="ch-photo__thumb" src={media.thumbDataUrl} alt="" />}
        {loading && <Spinner />}
      </span>
    );
  }
  return (
    <video
      className={cx('ch-video', media.kind === 'sticker' && 'ch-sticker')}
      src={url}
      autoPlay={!reduced}
      controls={reduced}
      loop
      muted
      playsInline
      aria-label={mediaLabel(media)}
    />
  );
}

function Sticker({ message, media }: MediaProps) {
  const mime = media.mimeType ?? '';
  const animated = mime === 'application/x-tgsticker';
  const { url } = useMedia(message, !animated && !mime.startsWith('video/'));
  if (mime.startsWith('video/')) return <Loop message={message} media={media} />;
  if (!url || animated) {
    return (
      <span className="ch-sticker ch-sticker--placeholder" role="img" aria-label="Adesivo">
        {media.thumbDataUrl ? <img src={media.thumbDataUrl} alt="" /> : <SmileOutlined />}
      </span>
    );
  }
  return <img className="ch-sticker" src={url} alt="Adesivo" decoding="async" />;
}

function Document({ message, media }: MediaProps) {
  const [wanted, setWanted] = useState(false);
  const { url, loading, error } = useMedia(message, wanted);
  const pdf = isPdf(media);
  const name = media.fileName || (pdf ? 'Documento PDF' : 'Documento');
  const detail = error ? 'Download non riuscito' : formatBytes(media.size) || undefined;
  const action = url ? (
    <a
      className="ch-media__button"
      href={url}
      {...(pdf ? { target: '_blank', rel: 'noopener noreferrer' } : { download: name })}
      aria-label={pdf ? `Apri ${name}` : `Salva ${name}`}
    >
      {pdf ? <ExportOutlined /> : <DownloadOutlined />}
    </a>
  ) : (
    <button
      type="button"
      className="ch-media__button"
      disabled={message.id < 0 || loading}
      onClick={() => setWanted(true)}
      aria-label={`Scarica ${name}`}
    >
      {loading ? <LoadingOutlined /> : <DownloadOutlined />}
    </button>
  );
  return (
    <MediaCard
      icon={pdf ? <FilePdfOutlined /> : <FileOutlined />}
      title={<span className="pc-keep-case">{name}</span>}
      detail={url ? (pdf ? 'Pronto: tocca per aprire' : 'Pronto: tocca per salvare') : detail}
      action={action}
    />
  );
}

function Location({ media }: { media: MediaInfo }) {
  const { latitude: lat, longitude: lon } = media;
  const href =
    lat !== undefined && lon !== undefined
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
      : undefined;
  return (
    <MediaCard
      icon={<EnvironmentOutlined />}
      title={media.title || 'Posizione'}
      detail={media.description}
      action={
        href && (
          <a
            className="ch-media__button"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Apri la mappa"
          >
            <ExportOutlined />
          </a>
        )
      }
    />
  );
}

function Contact({ media }: { media: MediaInfo }) {
  const phone = media.description?.replace(/[^\d+]/g, '');
  return (
    <MediaCard
      icon={<UserOutlined />}
      title={media.title || 'Contatto'}
      detail={media.description}
      action={
        phone && (
          <a className="ch-media__button" href={`tel:${phone}`} aria-label={`Chiama ${media.title ?? ''}`.trim()}>
            <PhoneOutlined />
          </a>
        )
      }
    />
  );
}

function Webpage({ media }: { media: MediaInfo }) {
  return (
    <a className="ch-link-card" href={media.url} target="_blank" rel="noopener noreferrer">
      <span className="ch-card__icon" aria-hidden="true">
        <LinkOutlined />
      </span>
      <span className="ch-card__text">
        <span className="ch-card__title">{media.title || media.url || 'Link'}</span>
        {media.description && <span className="ch-card__detail">{media.description}</span>}
      </span>
    </a>
  );
}

/** Message attachment by kind. */
export function MessageMedia({ message, media }: MediaProps) {
  switch (media.kind) {
    case 'photo':
      return <Photo message={message} media={media} />;
    case 'video':
    case 'voice':
    case 'audio':
      return <Playable message={message} media={media} />;
    case 'gif':
      return <Loop message={message} media={media} />;
    case 'sticker':
      return <Sticker message={message} media={media} />;
    case 'document':
      return <Document message={message} media={media} />;
    case 'location':
      return <Location media={media} />;
    case 'contact':
      return <Contact media={media} />;
    case 'poll':
      return <MediaCard icon={<BarChartOutlined />} title={media.title || 'Sondaggio'} detail={media.description} />;
    case 'webpage':
      return media.url ? <Webpage media={media} /> : null;
    default:
      return <MediaCard icon={<FileOutlined />} title="Allegato" detail="Aprilo su Telegram per vederlo" />;
  }
}

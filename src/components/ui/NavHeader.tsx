import { useId, type ReactNode } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { GlassBar } from './GlassBar';
import { IconButton } from './IconButton';
import { cx, type StyleWithVars } from './utils';
import './NavHeader.css';

export interface NavHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Shows a back button when set. */
  onBack?: () => void;
  /** Spoken name of the back button (default "Indietro"). */
  backLabel?: string;
  /** Between the back button and the title, e.g. an <Avatar/>. */
  leading?: ReactNode;
  /** Right side actions, e.g. <IconButton/>s. */
  trailing?: ReactNode;
  /** Large title for top-level screens (Chat, Impostazioni). */
  large?: boolean;
  /** Makes the title area a button (e.g. open the contact's profile). */
  onTitlePress?: () => void;
  className?: string;
}

export function NavHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Indietro',
  leading,
  trailing,
  large = false,
  onTitlePress,
  className,
}: NavHeaderProps) {
  const titleId = useId();
  // Longest word of a plain-text title, so a large title shrinks instead of breaking mid-word.
  const titleStyle: StyleWithVars | undefined =
    typeof title === 'string' ? { '--title-word': Math.max(1, ...title.split(/\s+/).map((w) => [...w].length)) } : undefined;
  const text = (
    <span className="pc-nav__text">
      <h1 id={titleId} className="pc-nav__title" style={titleStyle}>
        {title}
      </h1>
      {subtitle && <span className="pc-nav__subtitle">{subtitle}</span>}
    </span>
  );
  return (
    <GlassBar
      position="top"
      className={cx('pc-nav', large && 'pc-nav--large', className)}
      aria-labelledby={titleId}
    >
      {onBack && <IconButton icon={<ArrowLeftOutlined />} aria-label={backLabel} onClick={onBack} />}
      {onTitlePress ? (
        <button type="button" className="pc-nav__main pc-nav__main--button" onClick={onTitlePress}>
          {leading}
          {text}
        </button>
      ) : (
        <div className="pc-nav__main">
          {leading}
          {text}
        </div>
      )}
      {trailing && <div className="pc-nav__trailing">{trailing}</div>}
    </GlassBar>
  );
}

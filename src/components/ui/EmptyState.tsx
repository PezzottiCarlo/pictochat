import { useId, type ReactNode } from 'react';
import { cx } from './utils';
import './EmptyState.css';

export interface EmptyStateProps {
  /** An icon, emoji or <img> of a pictogram. */
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Usually one antd <Button type="primary" size="large">: what to do next. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const titleId = useId();
  return (
    <section className={cx('pc-empty', className)} aria-labelledby={titleId}>
      <div className="pc-empty__icon" aria-hidden="true">
        {icon}
      </div>
      <h2 id={titleId} className="pc-empty__title">
        {title}
      </h2>
      {description && <p className="pc-empty__desc">{description}</p>}
      {action && <div className="pc-empty__action">{action}</div>}
    </section>
  );
}

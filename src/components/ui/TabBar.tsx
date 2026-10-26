import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useInRouterContext, useNavigate } from 'react-router';
import { GlassBar } from './GlassBar';
import { cx, type StyleWithVars } from './utils';
import './TabBar.css';

export interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
  /** Route to navigate to (inside a router). */
  to?: string;
  /** Unread count (≥1) or true for a dot. */
  badge?: number | boolean;
}

export interface TabBarProps {
  items: TabItem[];
  activeKey: string;
  /** Called on selection; when omitted inside a router, navigates to `item.to`. */
  onChange?: (key: string, item: TabItem) => void;
  'aria-label'?: string;
  className?: string;
}

/** Bottom navigation: floating glass capsule, icons always paired with visible labels. */
export function TabBar(props: TabBarProps) {
  return useInRouterContext() ? <RouterTabBar {...props} /> : <TabBarView {...props} />;
}

function RouterTabBar(props: TabBarProps) {
  const navigate = useNavigate();
  return (
    <TabBarView
      {...props}
      onChange={(key, item) => {
        if (props.onChange) props.onChange(key, item);
        else if (item.to) navigate(item.to);
      }}
    />
  );
}

function TabBarView({ items, activeKey, onChange, className, 'aria-label': ariaLabel = 'Navigazione principale' }: TabBarProps) {
  const indicatorId = useId();
  return (
    <GlassBar position="bottom" floating as="nav" aria-label={ariaLabel} className={cx('pc-tabbar', className)}>
      <ul
        className="pc-tabbar__list"
        style={{ '--tab-count': items.length, '--tab-chars': items.reduce((n, i) => n + [...i.label].length, 0) } as StyleWithVars}
      >
        {items.map((item) => {
          const active = item.key === activeKey;
          const count = typeof item.badge === 'number' && item.badge > 0 ? item.badge : 0;
          return (
            <li key={item.key} className="pc-tabbar__cell">
              <button
                type="button"
                className={cx('pc-tabbar__item', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
                aria-label={count ? `${item.label}, ${count} da leggere` : undefined}
                onClick={() => onChange?.(item.key, item)}
              >
                {active && (
                  <motion.span
                    layoutId={indicatorId}
                    className="pc-tabbar__indicator pc-glass-accent"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
                <span className="pc-tabbar__icon" aria-hidden="true">
                  {item.icon}
                  {(count > 0 || item.badge === true) && (
                    <span className={cx('pc-tabbar__badge', !count && 'pc-tabbar__badge--dot')}>
                      {count ? (count > 99 ? '99+' : count) : null}
                    </span>
                  )}
                </span>
                <span className="pc-tabbar__label">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </GlassBar>
  );
}

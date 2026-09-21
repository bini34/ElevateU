import type { HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export type SurfaceTone = 'default' | 'muted' | 'mint' | 'blue' | 'yellow' | 'peach' | 'lavender' | 'pink';

export function Card({ tone = 'default', className, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: SurfaceTone }) {
  return <div {...props} className={cx('ui-card', `ui-surface-${tone}`, className)} />;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={cx('ui-panel', className)} />;
}

export function Badge({ tone = 'neutral', className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return <span {...props} className={cx('ui-badge', `ui-badge-${tone}`, className)} />;
}

export function Chip({ selected = false, className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return <button {...props} type={type} aria-pressed={selected} className={cx('ui-chip', selected && 'ui-chip-selected', className)} />;
}

export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr {...props} className={cx('ui-divider', className)} />;
}

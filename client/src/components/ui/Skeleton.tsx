import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={cx('ui-skeleton', className)} />;
}

export function ContentSkeleton({ variant = 'card', label = 'Loading content' }: {
  variant?: 'post' | 'conversation' | 'profile' | 'card' | 'list'; label?: string;
}) {
  const compact = variant === 'conversation' || variant === 'list';
  return <div role="status" aria-label={label} className="space-y-4 rounded-card border border-border p-5">
    <span className="sr-only">{label}</span>
    <div className="flex items-center gap-3">
      <Skeleton className={variant === 'profile' ? 'h-16 w-16 shrink-0 rounded-full' : 'h-10 w-10 shrink-0 rounded-full'} />
      <div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/3" /></div>
    </div>
    {!compact && <><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></>}
    {variant === 'post' && <Skeleton className="h-28 w-full" />}
  </div>;
}

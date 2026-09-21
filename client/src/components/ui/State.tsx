import type { ReactNode } from 'react';
import { AlertCircle, Sprout } from 'lucide-react';
import { Button } from './Button';
import { cx } from './cx';

type StateProps = { title: string; description: string; action?: ReactNode; className?: string };

export function EmptyState({ title, description, action, className }: StateProps) {
  return <div className={cx('ui-state', className)}>
    <span className="ui-state-icon" aria-hidden="true"><Sprout size={24} /></span>
    <h3 className="text-h3">{title}</h3><p className="max-w-sm text-body-small text-text-muted">{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>;
}

export function ErrorState({ title = 'Something needs another try', description = 'We couldn’t load this content. Please try again.', onRetry, className }: {
  title?: string; description?: string; onRetry?: () => void; className?: string;
}) {
  return <div role="alert" className={cx('ui-state', className)}>
    <span className="ui-state-icon !bg-danger-soft !text-danger" aria-hidden="true"><AlertCircle size={24} /></span>
    <h3 className="text-h3">{title}</h3><p className="max-w-sm text-body-small text-text-muted">{description}</p>
    {onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
  </div>;
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return <div role="status" className={cx('flex min-h-24 items-center justify-center gap-3 text-body-small text-text-muted', className)}>
    <span className="ui-spinner" aria-hidden="true" />{label}
  </div>;
}

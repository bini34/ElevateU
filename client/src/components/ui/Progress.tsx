import { cx } from './cx';

export type ProgressProps = { value: number; max?: number; label: string; status?: string; className?: string };

export function progressPercentage(value: number, max = 100) {
  return Number.isFinite(value) && Number.isFinite(max) && max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0;
}

export function Progress({ value, max = 100, label, status, className }: ProgressProps) {
  const percent = progressPercentage(value, max);
  return <div className={cx('ui-progress', className)}>
    <div className="flex items-baseline justify-between gap-3 text-body-small"><span>{label}</span><span className="font-semibold tabular-nums">{Math.round(percent)}%</span></div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
      aria-valuetext={status ? `${Math.round(percent)}%, ${status}` : undefined} className="ui-progress-track">
      <span style={{ width: `${percent}%` }} />
    </div>
    {status && <p className="text-caption text-text-muted">{status}</p>}
  </div>;
}

export function ProgressRing({ value, max = 100, label, status, className }: ProgressProps) {
  const percent = progressPercentage(value, max);
  return <figure className={cx('ui-progress-ring', className)}>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}
      aria-valuetext={status ? `${Math.round(percent)}%, ${status}` : undefined} className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--border))" strokeWidth="7" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(var(--focus))" strokeWidth="7" strokeLinecap="round"
          pathLength="100" strokeDasharray="100" strokeDashoffset={100 - percent} className="ui-ring-value" />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-h3 tabular-nums">{Math.round(percent)}%</span>
    </div>
    <figcaption><span className="block text-label">{label}</span>{status && <span className="text-caption text-text-muted">{status}</span>}</figcaption>
  </figure>;
}

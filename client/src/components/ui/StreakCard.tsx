import { Check, Flame, Minus } from 'lucide-react';
import { Card } from './Surface';
import { ContentSkeleton } from './Skeleton';

export type StreakDay = { date: string; label: string; status: 'completed' | 'missed' | 'upcoming'; today?: boolean };
type StreakCardProps = { currentStreak: number; days: readonly StreakDay[]; message: string; loading?: boolean; title?: string };

/** Presentation only: callers supply calendar dates, completion and encouragement. */
export function StreakCard({ currentStreak, days, message, loading = false, title = 'Keep showing up' }: StreakCardProps) {
  if (loading) return <ContentSkeleton label="Loading streak" />;
  const count = Number.isFinite(currentStreak) ? Math.max(0, Math.floor(currentStreak)) : 0;
  return <Card tone="yellow" className="space-y-5 !p-5" aria-label="Streak summary">
    <div className="flex items-center justify-between gap-3"><h3 className="text-label">{title}</h3><Flame size={22} aria-hidden="true" /></div>
    <div><p className="flex flex-wrap items-baseline gap-2"><span className="text-display tabular-nums">{count}</span><span className="text-body-small">{count === 1 ? 'day in a row' : 'days in a row'}</span></p>
      {count === 0 && <p className="mt-1 text-caption text-text-muted">A fresh start is a step forward.</p>}</div>
    <ol className="ui-streak-days" aria-label="Seven-day activity">
      {days.slice(0, 7).map((day) => <li key={day.date} className="ui-streak-day">
        <span aria-hidden="true">{day.label}</span>
        <span className={`ui-streak-day-mark ui-streak-day-${day.status}${day.today ? ' ui-streak-day-today' : ''}`} aria-hidden="true">
          {day.status === 'completed' ? <Check size={15} strokeWidth={2.5} /> : day.status === 'missed' ? <Minus size={13} /> : <span className="h-1 w-1 rounded-full bg-text-muted" />}
        </span>
        <span className="sr-only">{day.date}: {day.status}{day.today ? ', today' : ''}</span>
      </li>)}
    </ol>
    <p className="text-caption">{message}</p>
  </Card>;
}

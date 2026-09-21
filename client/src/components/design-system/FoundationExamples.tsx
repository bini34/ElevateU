'use client';

import { ArrowUpRight, Sprout } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Card, Badge, Panel } from '../ui/Surface';
import { Progress, ProgressRing } from '../ui/Progress';
import { StreakCard } from '../ui/StreakCard';
import { ContentSkeleton } from '../ui/Skeleton';
import { EmptyState, ErrorState, LoadingState } from '../ui/State';
import { Button } from '../ui/Button';
import { sampleDays } from './samples';

export function FoundationExamples() {
  return <div className="space-y-10">
    <section aria-labelledby="surfaces-title"><div className="preview-section-heading"><div><p className="preview-eyebrow">01 / Visual language</p><h2 id="surfaces-title" className="text-h2">Room to grow.</h2></div><span className="text-caption text-text-muted">Color supports the content.</span></div>
      <div className="grid gap-4 sm:grid-cols-2"><Card tone="mint"><Sprout size={28} aria-hidden="true" /><h3 className="mt-6 text-h3">A calm place to begin</h3><p className="mt-2 text-body-small text-text-muted">Warm surfaces. Clear words. One useful next step.</p></Card>
        <Card tone="lavender"><ArrowUpRight size={28} aria-hidden="true" /><h3 className="mt-6 text-h3">Make progress visible</h3><p className="mt-2 text-body-small text-text-muted">Encouragement without pressure. Structure without noise.</p></Card></div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{(['mint', 'blue', 'yellow', 'peach', 'lavender', 'pink'] as const).map((tone) => <Card key={tone} tone={tone} className="!p-4"><p className="text-label capitalize">{tone}</p><p className="mt-1 text-metadata">Decorative surface</p></Card>)}</div>
      <div className="mt-4 flex flex-wrap gap-2"><Badge tone="success">Success</Badge><Badge tone="warning">Needs attention</Badge><Badge tone="danger">Error</Badge><Badge tone="info">Information</Badge><Badge>Neutral</Badge></div>
    </section>
    <section aria-labelledby="type-title"><p className="preview-eyebrow">02 / Typography</p><h2 id="type-title" className="text-h2">Clarity, at every size.</h2>
      <div className="mt-6 divide-y divide-border">{[
        ['Display', 'text-display', 'Your next chapter.'], ['Heading 1', 'text-h1', 'Keep moving forward.'], ['Heading 2', 'text-h2', 'Small wins add up.'], ['Heading 3', 'text-h3', 'Find your rhythm'], ['Heading 4', 'text-h4', 'One step at a time'], ['Body', 'text-body', 'Progress has a different pace for everyone.'], ['Body small', 'text-body-small', 'A little encouragement goes a long way.'], ['Label', 'text-label', 'Your daily reflection'], ['Caption', 'text-caption', 'Shared with your community'], ['Metadata', 'text-metadata', 'Updated a moment ago'],
      ].map(([label, style, copy]) => <div className="preview-type-row" key={label}><span className="text-caption text-text-muted">{label}</span><p className={style}>{copy}</p></div>)}</div>
    </section>
    <section aria-labelledby="progress-title"><p className="preview-eyebrow">03 / Progress & consistency</p><h2 id="progress-title" className="text-h2">Celebrate showing up.</h2><p className="mt-2 text-body-small text-text-muted">Presentation samples only. No goals or streaks are stored or calculated.</p>
      <Panel className="mt-6 space-y-6"><Progress value={3} max={4} label="Sample milestone progress" status="3 of 4 steps complete" /><ProgressRing value={60} label="Sample weekly rhythm" status="3 of 5 check-ins" /></Panel>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><StreakCard currentStreak={0} days={sampleDays.map((day) => ({ ...day, status: 'upcoming' }))} message="Begin with one small step." />
        <StreakCard currentStreak={5} days={sampleDays} message="Every return is a little more progress." />
        <StreakCard currentStreak={128} days={sampleDays.map((day) => ({ ...day, status: 'completed' }))} message="A rhythm built one day at a time." />
        <StreakCard currentStreak={0} days={[]} message="" loading /></div>
    </section>
    <section aria-labelledby="states-title"><p className="preview-eyebrow">04 / People & states</p><h2 id="states-title" className="text-h2">Care in the details.</h2>
      <div className="mt-6 flex flex-wrap items-center gap-4" aria-label="Avatar size examples">{(['sm', 'md', 'lg', 'xl'] as const).map((size) => <Avatar key={size} name="Avery James" size={size} online={size === 'lg' ? true : undefined} />)}<Avatar name="Sample avatar" src="/images/avator.png" /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><Card><EmptyState title="Space for something good" description="A helpful empty state explains what comes next." action={<Button variant="outline" onClick={() => document.getElementById('preview-top')?.scrollIntoView({ behavior: 'instant' })}>Back to the preview</Button>} /></Card>
        <Card><ErrorState onRetry={() => window.dispatchEvent(new Event('preview-retry'))} /></Card></div>
      <LoadingState label="Loading sample content" />
      <div className="grid gap-4 sm:grid-cols-2">{(['post', 'conversation', 'profile', 'card', 'list'] as const).map((variant) => <div key={variant}><p className="mb-2 text-caption capitalize">{variant} skeleton</p><ContentSkeleton variant={variant} label={`Loading ${variant} example`} /></div>)}</div>
    </section>
  </div>;
}


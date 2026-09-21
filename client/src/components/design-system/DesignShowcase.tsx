'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '../layout/AppShell';
import { AuthLayout } from '../layout/AuthLayout';
import { NavigationList } from '../layout/NavigationList';
import { appNavigation, mobileNavigation } from '../layout/navigation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { Switch } from '../ui/Choice';
import { Badge, Card } from '../ui/Surface';
import { StreakCard } from '../ui/StreakCard';
import { Progress } from '../ui/Progress';
import { Tabs } from '../ui/Tabs';
import { FoundationExamples } from './FoundationExamples';
import { InteractionExamples } from './InteractionExamples';
import { sampleDays } from './samples';

export function DesignShowcase() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const retry = () => toast('Retry example only. No request was sent.');
    window.addEventListener('preview-retry', retry);
    return () => window.removeEventListener('preview-retry', retry);
  }, []);
  return <div data-theme={dark ? 'dark' : 'light'} className="preview-root">
    <AppShell navigation={<NavigationList items={appNavigation()} pathname="/design-system" />} mobileNavigation={<NavigationList items={mobileNavigation()} pathname="/design-system" mobile />}
      footer={<span className="text-caption text-text-muted app-preview-label">Design studio<br />Development only</span>}
      account={<Badge>Preview</Badge>}
      rightRail={<><div><p className="preview-eyebrow">In context</p><h2 className="text-h3">Consistency, softly.</h2><p className="mt-2 text-caption text-text-muted">Sample data only. These components are not connected to a streak or goal service.</p></div>
        <StreakCard currentStreak={5} days={sampleDays} message="Small efforts make a meaningful week." />
        <Card tone="blue"><Sparkles size={22} aria-hidden="true" /><h3 className="mt-4 text-label">Progress has many forms.</h3><p className="mt-2 text-caption">Sometimes it’s a milestone. Sometimes it’s simply coming back.</p><div className="mt-6"><Progress value={3} max={4} label="Sample progress" status="3 of 4 steps" /></div></Card>
        <p className="text-caption text-text-muted">Designed to encourage.<br />Built to stay out of your way.</p></>}>
      <main className="preview-main" id="preview-top">
        <div className="flex flex-wrap items-center justify-between gap-4"><p className="preview-eyebrow !mb-0">ElevateU / Design foundations</p><Switch label="Dark preview" checked={dark} onChange={(event) => setDark(event.target.checked)} /></div>
        <header className="preview-hero"><span className="preview-hero-symbol" aria-hidden="true"><ArrowUpRight size={32} /></span><Badge>Day 06 · UI foundation</Badge><h1 className="mt-5 text-display">A little progress.<br />A clearer path.</h1><p className="mt-4 max-w-md text-body-small text-text-muted">A calm, connected space for personal growth. This is the visual foundation for what comes next.</p><p className="mt-6 text-caption font-medium">Development preview · All example data is illustrative.</p></header>
        <Tabs label="Design system sections" items={[
          { id: 'foundations', label: 'Foundations', content: <FoundationExamples /> },
          { id: 'interactions', label: 'Interactions', content: <InteractionExamples /> },
          { id: 'auth', label: 'Auth layout', content: <div><p className="mb-6 text-body-small text-text-muted">Layout foundation only. Existing sign-in and registration pages are unchanged. This sample does not authenticate.</p><AuthLayout title="Welcome back" description="Make a little space for your next step." footer="Visual example · no account will be created."><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); toast('Auth layout preview only. No sign-in request was sent.'); }}><Input label="Sample email" type="email" placeholder="you@example.com" required /><Input label="Sample password" type="password" autoComplete="new-password" required /><Button type="submit" variant="secondary" className="w-full">Preview sign-in feedback</Button></form></AuthLayout></div> },
        ]} />
        <footer className="mt-12 border-t border-border pt-6 text-caption text-text-muted">ElevateU design system · Grow with intention.</footer>
      </main>
    </AppShell>
  </div>;
}

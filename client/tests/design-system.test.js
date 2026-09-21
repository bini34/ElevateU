import { register } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
register('./tsx-loader.mjs', import.meta.url);
const { Button, IconButton } = await import('../src/components/ui/Button.tsx');
const { Input } = await import('../src/components/ui/Field.tsx');
const { Checkbox, Radio, Switch } = await import('../src/components/ui/Choice.tsx');
const { Progress, ProgressRing, progressPercentage } = await import('../src/components/ui/Progress.tsx');
const { StreakCard } = await import('../src/components/ui/StreakCard.tsx');
const { Tabs } = await import('../src/components/ui/Tabs.tsx');
const { isActiveRoute, appNavigation, mobileNavigation } = await import('../src/components/layout/navigation.ts');

test('buttons default to non-submit; disabled/loading cannot submit accidentally', () => {
  assert.match(render(h(Button, null, 'Continue')), /type="button"/);
  const loading = render(h(Button, { loading: true, loadingLabel: 'Saving' }, 'Save'));
  assert.match(loading, /disabled=""/); assert.match(loading, /aria-busy="true"/); assert.match(loading, /Saving/);
  assert.match(render(h(Button, { disabled: true }, 'Save')), /disabled=""/);
  assert.match(render(h(IconButton, { label: 'Close' }, '×')), /aria-label="Close"/);
});

test('field validation connects visible label, hint, caller description and error', () => {
  const html = render(h(Input, { id: 'email', label: 'Email', description: 'Use your address', error: 'Invalid address', required: true, 'aria-describedby': 'extra' }));
  assert.match(html, /for="email"/); assert.match(html, /required=""/);
  assert.match(html, /aria-invalid="true"/); assert.match(html, /aria-describedby="extra email-hint email-error"/);
  assert.match(html, /id="email-error" role="alert"/);
  assert.doesNotMatch(render(h(Input, { label: 'Optional' })), /aria-invalid/);
});

test('choices preserve native inputs and expose switch semantics', () => {
  assert.match(render(h(Checkbox, { label: 'Agree', defaultChecked: true })), /type="checkbox"/);
  assert.match(render(h(Radio, { label: 'Daily', name: 'rhythm' })), /type="radio"/);
  assert.match(render(h(Switch, { label: 'Reminders', disabled: true })), /role="switch"/);
});

test('progress clamps invalid/negative/over-max values and describes meaningful status', () => {
  for (const [value, max, expected] of [[3, 4, 75], [-1, 100, 0], [150, 100, 100], [1, 0, 0], [NaN, 100, 0], [2, Infinity, 0]]) assert.equal(progressPercentage(value, max), expected);
  for (const Component of [Progress, ProgressRing]) {
    const html = render(h(Component, { value: 3, max: 4, label: 'Milestones', status: '3 of 4 steps' }));
    assert.match(html, /role="progressbar"/); assert.match(html, /aria-label="Milestones"/);
    assert.match(html, /aria-valuenow="75"/); assert.match(html, /aria-valuetext="75%, 3 of 4 steps"/);
  }
});

test('streaks render supplied zero, active, long and loading states without domain inference', () => {
  const days = [{ date: '2026-09-20', label: 'S', status: 'missed', today: true }];
  assert.match(render(h(StreakCard, { currentStreak: 0, days, message: 'Begin again' })), /A fresh start/);
  const active = render(h(StreakCard, { currentStreak: 5, days, message: 'Keep going' }));
  assert.match(active, />5<\/span>/); assert.match(active, /2026-09-20: missed, today/); assert.match(active, /Keep going/);
  assert.match(render(h(StreakCard, { currentStreak: 128, days, message: 'Steady' })), />128<\/span>/);
  const loading = render(h(StreakCard, { currentStreak: 128, days, message: 'Steady', loading: true }));
  assert.match(loading, /role="status"/); assert.doesNotMatch(loading, /128|Steady/);
});

test('tabs expose only one selected tab and fall back from unavailable selection', () => {
  const html = render(h(Tabs, { label: 'Activity', defaultValue: 'disabled', items: [
    { id: 'disabled', label: 'Unavailable', disabled: true, content: 'Hidden' },
    { id: 'active', label: 'Today', content: 'Current panel' },
  ] }));
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.match(html, /role="tablist" aria-label="Activity"/); assert.match(html, /role="tabpanel"/);
});

test('navigation selects nested routes accurately and only links implemented destinations', () => {
  assert.equal(isActiveRoute('/chat/42', '/chat'), true);
  assert.equal(isActiveRoute('/chatty', '/chat'), false);
  assert.equal(isActiveRoute('/chat', '/'), false);
  assert.equal(isActiveRoute('/', '/'), true);
  const items = appNavigation('avery', 3);
  assert.equal(items.find((item) => item.href === '/notifications').badge, 3);
  assert.ok(items.some((item) => item.href === '/avery'));
  assert.ok(mobileNavigation().some((item) => item.href === '/create-post'));
  assert.ok(items.every((item) => !['/goals', '/challenges', '/explore'].includes(item.href)));
});

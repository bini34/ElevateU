// Real UI smoke tests against an explicitly disposable API. Never use production.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { mkdir } from 'node:fs/promises';

if (process.env.ELEVATEU_DISPOSABLE_UI_TEST !== 'true') throw new Error('Set ELEVATEU_DISPOSABLE_UI_TEST=true only after pointing the frontend at the disposable API.');
if (!process.env.ELEVATEU_PLAYWRIGHT_MODULE) throw new Error('Set ELEVATEU_PLAYWRIGHT_MODULE; see docs/DESIGN_SYSTEM.md.');
const { chromium } = await import(pathToFileURL(process.env.ELEVATEU_PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, ...(process.env.ELEVATEU_BROWSER_CHANNEL ? { channel: process.env.ELEVATEU_BROWSER_CHANNEL } : {}) });
const base = process.env.ELEVATEU_TEST_CLIENT_URL || 'http://127.0.0.1:18600';
const suffix = Date.now().toString(36);
const password = `Ui-only-${suffix}-Passphrase!`;
const screenshots = path.join(os.tmpdir(), 'elevateu-day6-browser');
await mkdir(screenshots, { recursive: true });
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; console.log(`PASS ${message}`); };
const errors = [];
async function newPage() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(); page.setDefaultTimeout(45000);
  page.on('pageerror', (error) => errors.push(error.message));
  return page;
}
async function signup(page, first, username) {
  await page.goto(`${base}/signup`, { waitUntil: 'networkidle' });
  await page.locator('input[name="first_name"]').fill(first);
  await page.locator('input[name="last_name"]').fill('DaySix');
  await page.locator('input[name="user_name"]').fill(username);
  await page.locator('input[name="email"]').fill(`${username}@example.test`);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="password_confirmation"]').fill(password);
  await page.getByRole('button', { name: 'Sign up', exact: true }).click();
  await page.waitForURL(`${base}/`);
  await page.locator('.app-sidebar').waitFor();
  check(await page.getByRole('link', { name: 'Home', exact: true }).first().getAttribute('aria-current') === 'page', `${first} registration reaches real feed`);
}
try {
  const alice = await newPage(), bob = await newPage();
  const aliceName = `ui_a_${suffix}`, bobName = `ui_b_${suffix}`;
  const aliceFirst = `Alice${suffix}`;
  await signup(alice, aliceFirst, aliceName);
  await alice.goto(`${base}/create-post`);
  const postText = `Day 6 real browser progress ${suffix}`;
  await alice.getByPlaceholder(/What's on your mind/).fill(postText);
  await alice.getByRole('button', { name: 'Post', exact: true }).click();
  await alice.waitForURL(`${base}/`); await alice.getByText(postText, { exact: true }).waitFor();
  check(true, 'post creation persists and appears in feed');
  await alice.reload(); await alice.getByText(postText, { exact: true }).waitFor(); check(true, 'feed survives reload');
  await alice.goto(`${base}/groups`);
  await alice.getByRole('button', { name: 'Create community' }).click();
  const groupName = `Day Six ${suffix}`;
  await alice.getByPlaceholder('Enter group name').fill(groupName);
  await alice.getByPlaceholder('Enter group description').fill('Disposable browser regression community');
  await alice.getByRole('button', { name: 'Create', exact: true }).click();
  await alice.getByText(groupName, { exact: true }).click(); await alice.waitForURL(/\/groups\/[^/]+$/);
  const groupUrl = alice.url();
  await alice.getByPlaceholder('Message...', { exact: true }).fill(`Group hello ${suffix}`);
  const groupSend = alice.waitForResponse((response) => response.url().endsWith('/api/messages') && response.request().method() === 'POST');
  await alice.getByRole('button', { name: 'Send message', exact: true }).click();
  check((await groupSend).ok(), 'group send acknowledged by API');
  await alice.getByText(`Group hello ${suffix}`, { exact: true }).waitFor();
  await alice.reload(); await alice.getByText(`Group hello ${suffix}`, { exact: true }).waitFor(); check(true, 'group creation and message persist');
  await alice.goto(`${base}/settings/change-profile`);
  await alice.getByLabel('Bio', { exact: true }).fill(`Small steps ${suffix}`);
  await alice.getByRole('button', { name: 'Save changes', exact: true }).click();
  await alice.getByText('Profile updated!', { exact: true }).waitFor();
  await alice.goto(`${base}/${aliceName}`); await alice.getByText(`Small steps ${suffix}`, { exact: true }).waitFor(); check(true, 'settings update is visible on profile');

  await signup(bob, 'Bob', bobName);
  await bob.getByText(postText, { exact: true }).waitFor();
  await bob.getByRole('button', { name: 'Like', exact: true }).first().click();
  await bob.getByRole('button', { name: 'Unlike', exact: true }).first().waitFor(); check(true, 'like toggles with live API');
  await bob.getByRole('button', { name: 'View comments', exact: true }).first().click();
  const comment = `Encouragement ${suffix}`;
  await bob.getByPlaceholder('Add a comment...').fill(comment); await bob.getByPlaceholder('Add a comment...').press('Enter');
  await bob.getByText(comment, { exact: true }).waitFor(); check(true, 'comment submission renders persisted response');
  await bob.getByRole('button', { name: 'Close', exact: true }).click();
  await bob.goto(`${base}/chat`); await bob.getByText(`${aliceFirst} DaySix`, { exact: true }).click();
  await bob.waitForURL(/\/chat\/[^/]+$/);
  const message = `Direct hello ${suffix}`;
  await bob.getByPlaceholder('Message...', { exact: true }).fill(message);
  const directSend = bob.waitForResponse((response) => response.url().endsWith('/api/messages') && response.request().method() === 'POST');
  await bob.getByRole('button', { name: 'Send message', exact: true }).click();
  check((await directSend).ok(), 'direct send acknowledged by API');
  await bob.getByText(message, { exact: true }).waitFor(); await bob.reload(); await bob.getByText(message, { exact: true }).waitFor(); check(true, 'direct message survives reload');
  await alice.goto(`${base}/notifications`);
  await alice.getByRole('button', { name: 'Mark all read', exact: true }).waitFor();
  check(await alice.getByRole('heading', { name: 'Notifications' }).isVisible(), 'real notification activity is shown');
  await alice.getByRole('button', { name: 'Mark all read', exact: true }).click();
  await alice.getByRole('button', { name: 'Mark all read', exact: true }).waitFor({ state: 'hidden' }); check(true, 'mark-all-read clears unread activity');

  const login = await newPage();
  await login.goto(`${base}/signin`, { waitUntil: 'networkidle' });
  await login.locator('input[name="email"]').fill(`${aliceName}@example.test`);
  await login.locator('input[name="password"]').fill(password);
  await login.getByRole('button', { name: 'Sign In', exact: true }).click();
  await login.waitForURL(`${base}/`); await login.getByText(postText, { exact: true }).waitFor(); check(true, 'existing sign-in authenticates a new browser session');
  await login.screenshot({ path: path.join(screenshots, 'live-feed-desktop.png') });
  for (const width of [320, 375, 768, 1440]) {
    await alice.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/chat', '/groups', new URL(groupUrl).pathname, '/notifications', `/${aliceName}`, '/settings/change-profile']) {
      await alice.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      check(await alice.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} shell fits ${width}px`);
    }
  }
  await alice.setViewportSize({ width: 375, height: 812 });
  await alice.goto(`${base}/`); await alice.getByText(postText, { exact: true }).waitFor();
  await alice.screenshot({ path: path.join(screenshots, 'live-feed-mobile.png') });
  check(errors.length === 0, `no runtime exceptions: ${errors.join('; ')}`);
  console.log(`PASS ${checks} existing-product browser checks (real disposable data; no mocked API).`);
} finally { await browser.close(); }

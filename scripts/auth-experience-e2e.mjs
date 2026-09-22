// Real auth/recovery against the disposable log-mail stack. Fault injection is
// restricted to explicit failure tests; successful flows always reach Laravel.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

if (process.env.ELEVATEU_DISPOSABLE_UI_TEST !== 'true') throw new Error('Disposable API opt-in is required.');
if (!process.env.ELEVATEU_PLAYWRIGHT_MODULE || !process.env.ELEVATEU_TEST_LOG_PATH) throw new Error('Set browser module and disposable mail-log path.');
const { chromium } = await import(pathToFileURL(process.env.ELEVATEU_PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, channel: process.env.ELEVATEU_BROWSER_CHANNEL || 'msedge' });
const base = process.env.ELEVATEU_TEST_CLIENT_URL || 'http://127.0.0.1:18600';
const suffix = Date.now().toString(36);
const account = { first_name: 'Auth', last_name: 'Check', user_name: `auth_${suffix}`, email: `auth_${suffix}@example.test`, password: `Test-${suffix}-only!`, password_confirmation: `Test-${suffix}-only!` };
const newPassword = `Reset-${suffix}-only!`;
const directory = path.join(os.tmpdir(), 'elevateu-day7-browser');
await mkdir(directory, { recursive: true });
let checks = 0, lastSubmission = 0;
const errors = [];
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log(`PASS ${label}`); };
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function pageFor() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  page.on('pageerror', error => errors.push(error.name));
  return page;
}
async function go(page, route) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.getByText('Checking your session…', { exact: true }).waitFor({ state: 'hidden' });
}
async function fill(page, values) { for (const [name, value] of Object.entries(values)) await page.locator(`input[name="${name}"]`).fill(value); }
async function submit(page) {
  // Respect the shared 10/minute public-auth limiter without changing it.
  await delay(Math.max(0, 6500 - (Date.now() - lastSubmission)));
  lastSubmission = Date.now();
  await page.locator('button[type="submit"]').click();
}
async function feedback(page, text) {
  try { await page.getByText(text, { exact: true }).waitFor(); }
  catch { throw new Error(`Expected feedback: ${text}; actual feedback: ${await page.locator('.auth-feedback').allTextContents()}`); }
}

try {
  const page = await pageFor();
  await go(page, '/signin');
  check(await page.locator('form').count() === 1, 'signin renders a semantic form');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await feedback(page, 'Email is required.');
  check(await page.locator('[name="email"]').evaluate(element => element === document.activeElement), 'invalid submit focuses first field');
  await fill(page, { email: 'invalid', password: 'a' });
  await page.locator('button[type="submit"]').click();
  await feedback(page, 'Enter a valid email address.');
  check(await page.locator('[name="email"]').getAttribute('aria-invalid') === 'true', 'email error is associated and announced');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  check(await page.locator('[name="password"]').getAttribute('type') === 'text', 'password reveal works');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  check(await page.locator('[name="password"]').getAttribute('autocomplete') === 'current-password', 'signin supports password managers');
  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.locator('[name="first_name"]').waitFor();
  check(new URL(page.url()).pathname === '/signup', 'signin links to registration');
  check(await page.locator('form input').count() === 6, 'signup uses exactly six persisted fields');
  await fill(page, { ...account, password_confirmation: 'mismatch' });
  await page.locator('button[type="submit"]').click();
  await feedback(page, 'Passwords do not match.');
  check(await page.locator('[name="password_confirmation"]').evaluate(element => element === document.activeElement), 'signup mismatch focuses confirmation');
  await page.getByRole('button', { name: 'Show confirm password' }).click();
  check(await page.locator('[name="password_confirmation"]').getAttribute('type') === 'text', 'confirmation has its own reveal control');
  await fill(page, { password_confirmation: account.password });
  let registrations = 0, registrationContract = false;
  await page.route('**/api/auth/register', async route => {
    registrations++;
    const body = route.request().postDataJSON();
    registrationContract = Object.keys(body).sort().join() === Object.keys(account).sort().join() && Object.entries(account).every(([key, value]) => body[key] === value);
    await delay(1000); await route.continue();
  });
  await submit(page);
  check(await page.locator('button[type="submit"]').isDisabled(), 'signup loading disables submit');
  await page.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await page.waitForURL(`${base}/`);
  check(registrations === 1 && registrationContract, 'one registration request sends the exact API contract');
  await page.unroute('**/api/auth/register');
  const stored = await page.context().storageState();
  await page.route('**/api/auth/me', async route => { await delay(1200); await route.continue(); });
  await page.goto(`${base}/signin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Checking your session…', { exact: true }).waitFor();
  check(await page.locator('form').count() === 0, 'slow session verification does not flash the signin form');
  await page.waitForURL(`${base}/`);
  await page.unroute('**/api/auth/me');
  for (const route of ['/signin', '/signup', '/forget-password']) {
    let verified = false;
    const observer = response => { if (response.url().endsWith('/api/auth/me') && response.status() === 200) verified = true; };
    page.on('response', observer);
    await go(page, route); await page.waitForURL(`${base}/`);
    check(verified, `authenticated ${route} redirects after server verification`);
    page.off('response', observer);
  }
  await go(page, '/reset-password?token=invalid-test-link&email=' + encodeURIComponent(account.email));
  check(await page.locator('[name="password"]').count() === 1, 'authenticated users can still open recovery links');

  const guest = await pageFor();
  await go(guest, '/signup'); await fill(guest, account); await submit(guest);
  await feedback(guest, 'Email is already in use.');
  await feedback(guest, 'Username is already in use.');
  check(await guest.locator('[name="password"]').inputValue() === account.password, 'duplicate registration maps fields and preserves values');
  await guest.getByRole('link', { name: 'Sign in', exact: true }).click();
  await guest.getByRole('button', { name: 'Sign In', exact: true }).waitFor();
  await fill(guest, { email: account.email, password: 'incorrect' }); await submit(guest);
  await feedback(guest, 'Invalid email or password.');
  check(await guest.locator('.auth-feedback[role="alert"]').evaluate(element => element === document.activeElement), 'invalid credentials focus safe feedback');
  let logins = 0;
  await guest.route('**/api/auth/login', async route => { logins++; await delay(1000); await route.continue(); });
  await fill(guest, { password: account.password });
  await delay(Math.max(0, 6500 - (Date.now() - lastSubmission))); lastSubmission = Date.now();
  await guest.locator('[name="password"]').press('Enter');
  await guest.getByRole('button', { name: 'Signing in…' }).waitFor();
  await guest.locator('form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await guest.waitForURL(`${base}/`);
  check(logins === 1, 'keyboard signin succeeds with one request under repeated submission');
  await guest.unroute('**/api/auth/login');

  const recovery = await pageFor();
  await go(recovery, '/forget-password');
  await fill(recovery, { email: `missing_${suffix}@example.test` }); await submit(recovery);
  const neutral = 'If an account exists for that email, password reset instructions have been sent.';
  await feedback(recovery, neutral);
  check(await recovery.locator('.auth-feedback[role="status"]').evaluate(element => element === document.activeElement), 'unknown-email recovery gives focused neutral success');
  await recovery.getByRole('link', { name: 'Back to sign in' }).click();
  await recovery.getByRole('link', { name: 'Forgot password?' }).click();
  await recovery.getByRole('button', { name: 'Send reset instructions', exact: true }).waitFor();
  await fill(recovery, { email: account.email }); await submit(recovery); await feedback(recovery, neutral);
  check(true, 'known-email recovery has identical success copy');
  const log = await readFile(process.env.ELEVATEU_TEST_LOG_PATH, 'utf8');
  const match = [...log.matchAll(/reset-password\?token=3D([a-f0-9]+)|reset-password\?token=([a-f0-9]+)/g)].at(-1);
  const resetToken = match?.[1] || match?.[2];
  check(Boolean(resetToken), 'disposable mail log contains a real reset link');
  await go(recovery, '/reset-password');
  check(await recovery.locator('form').count() === 0, 'missing reset token offers recovery without a broken form');
  await recovery.context().addCookies([{ name: 'token', value: 'stale-test-session', url: base }]);
  const resetRoute = `/reset-password?token=${resetToken}&email=${encodeURIComponent(account.email)}`;
  await go(recovery, resetRoute);
  check(new URL(recovery.url()).pathname === '/reset-password' && await recovery.locator('[name="email"]').inputValue() === account.email, 'stale-session rejection preserves reset query and email');
  check(!(await recovery.locator('body').innerText()).includes(resetToken), 'reset token never appears in visible page copy');
  await fill(recovery, { password: newPassword, password_confirmation: 'wrong' });
  await recovery.locator('button[type="submit"]').click(); await feedback(recovery, 'Passwords do not match.');
  await fill(recovery, { password_confirmation: newPassword });
  let resetContract = false;
  recovery.on('request', request => {
    if (request.url().endsWith('/api/auth/reset-password')) {
      const body = request.postDataJSON(); resetContract = body.token === resetToken && body.email === account.email && body.password === newPassword && body.password_confirmation === newPassword;
    }
  });
  await submit(recovery);
  await feedback(recovery, 'Your password has been reset. Sign in with your new password.');
  check(resetContract && !(await recovery.context().cookies()).some(cookie => cookie.name === 'token'), 'real reset uses query contract and does not authenticate');
  await go(recovery, resetRoute); await fill(recovery, { password: newPassword, password_confirmation: newPassword }); await submit(recovery);
  await feedback(recovery, 'This password reset link is invalid or expired. Request a new link to try again.');
  check(true, 'used reset link is rejected with safe recovery action');
  await go(recovery, '/signin?next=https://example.invalid');
  await fill(recovery, { email: account.email, password: newPassword }); await submit(recovery); await recovery.waitForURL(`${base}/`);
  check(true, 'new password signs in and untrusted return destination is ignored');
  await go(page, '/signin');
  check(await page.locator('form').count() === 1, 'password reset revoked the prior session');

  const faults = await pageFor();
  await faults.addInitScript(() => localStorage.setItem('user', JSON.stringify({ id: 'untrusted-cache', email: 'cache@example.test' })));
  await go(faults, '/signin');
  check(await faults.locator('form').count() === 1 && new URL(faults.url()).pathname === '/signin', 'cached identity without a token never redirects');
  for (const [kind, route, endpoint, values] of [
    ['login', '/signin', 'login', { email: account.email, password: 'a' }],
    ['register', '/signup', 'register', account],
    ['forgot', '/forget-password', 'forgot-password', { email: account.email }],
    ['reset', '/reset-password?token=invalid-test-link', 'reset-password', { email: account.email, password: newPassword, password_confirmation: newPassword }],
  ]) {
    for (const status of [429, 500, 0]) {
      await go(faults, route); await fill(faults, values);
      await faults.route(`**/api/auth/${endpoint}`, handler => status ? handler.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ message: 'PRIVATE INTERNAL SQL ERROR' }) }) : handler.abort('failed'));
      await faults.locator('button[type="submit"]').click();
      await faults.locator('.auth-feedback-error').waitFor();
      check(!(await faults.locator('.auth-feedback-error').innerText()).includes('PRIVATE') && await faults.locator('[name="email"]').inputValue() === account.email, `${kind} ${status || 'network'} fault is safe and preserves input`);
      await faults.unroute(`**/api/auth/${endpoint}`);
    }
  }
  await faults.context().addCookies(stored.cookies);
  await faults.route('**/api/auth/me', handler => handler.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await go(faults, '/signin');
  await feedback(faults, 'Could not verify your session');
  check(await faults.locator('form').count() === 0, 'unavailable verification never trusts cached identity');
  await faults.getByRole('button', { name: 'Sign in again' }).click();
  await faults.locator('form').waitFor();
  check(!(await faults.context().cookies()).some(cookie => cookie.name === 'token'), 'explicit local-session recovery permits signin');
  await faults.unroute('**/api/auth/me');

  const visuals = await pageFor();
  for (const width of [320, 375, 768, 1024, 1440]) {
    await visuals.setViewportSize({ width, height: 900 });
    for (const route of ['/signin', '/signup', '/forget-password', '/reset-password?token=visual-test']) {
      await go(visuals, route);
      await visuals.locator('[name="email"]').fill('');
      check(await visuals.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route.split('?')[0]} has no overflow at ${width}px`);
      if (width < 768) check(!(await visuals.locator('.auth-brand-copy').isVisible()), `${route.split('?')[0]} prioritizes form on mobile`);
      if ((width === 375 || width === 1440) && ['/signin', '/signup'].includes(route)) await visuals.screenshot({ path: path.join(directory, `${route.slice(1)}-${width}.png`), fullPage: true });
    }
  }
  await go(visuals, '/signin');
  await visuals.locator('[name="email"]').focus();
  await visuals.keyboard.press('Tab');
  check(await visuals.locator('[name="password"]').evaluate(element => element === document.activeElement), 'keyboard order runs from email to password');
  await visuals.keyboard.press('Tab');
  check(await visuals.getByRole('button', { name: 'Show password' }).evaluate(element => element === document.activeElement && getComputedStyle(element).outlineStyle !== 'none'), 'password toggle has visible keyboard focus');
  check(errors.length === 0, 'no browser runtime exceptions');
  console.log(`PASS ${checks} authentication browser checks; real success flows and explicit fault-injection cases.`);
} catch (error) {
  console.error(String(error.stack || error).replace(/([?&]token=)[^&\s"'<>]+/g, '$1[redacted]'));
  process.exitCode = 1;
} finally { await browser.close(); }

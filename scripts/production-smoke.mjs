// Read-only smoke against an already-started production frontend.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const base = process.env.ELEVATEU_TEST_CLIENT_URL || 'http://127.0.0.1:18601';
let routes = 0, controls = 0;
const assets = new Set();
for (const [route, cookie] of [['/design-system', ''], ['/design-system?preview=true', ''], ['/design-system/child', ''], ['/design-system', 'token=smoke-test']]) {
  const response = await fetch(`${base}${route}`, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual' });
  assert.equal(response.status, 404, 'production preview must return a hard 404');
  assert.equal(await response.text(), 'Not found'); routes++;
}
for (const route of ['/signin', '/signup', '/forget-password', '/reset-password']) {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200, route);
  const html = await response.text();
  assert.ok(html.includes('auth-foundation'), `${route} must use the shared shell`);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)) {
    if (match[1].startsWith('/_next/') && /\.(?:js|css)(?:\?|$)/.test(match[1])) assets.add(match[1]);
  }
  routes++;
}
for (const route of ['/', '/chat', '/groups', '/settings', '/notifications']) {
  const response = await fetch(`${base}${route}`, { redirect: 'manual' });
  assert.equal(response.status, 307, route);
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/signin'); routes++;
}
for (const asset of assets) assert.equal((await fetch(`${base}${asset}`)).status, 200, asset);
assert.ok(assets.size > 0, 'auth assets were discovered');
if (!process.env.ELEVATEU_PLAYWRIGHT_MODULE) throw new Error('Browser verification requires ELEVATEU_PLAYWRIGHT_MODULE.');
const { chromium } = await import(pathToFileURL(process.env.ELEVATEU_PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, channel: process.env.ELEVATEU_BROWSER_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.name));
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/signin', '/signup', '/forget-password', '/reset-password?token=production-smoke']) {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.locator('form').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('[name="email"]').fill('');
      await page.locator('button[type="submit"]').click();
      await page.getByText('Email is required.', { exact: true }).waitFor();
      const firstInvalid = route === '/signup' ? 'first_name' : 'email';
      await page.waitForFunction(name => document.activeElement?.getAttribute('name') === name, firstInvalid);
      assert.ok(await page.locator(`[name="${firstInvalid}"]`).evaluate(element => element === document.activeElement), `${route} focuses first invalid field at ${width}px`);
      if (route !== '/forget-password') {
        await page.getByRole('button', { name: route.startsWith('/reset') ? 'Show new password' : 'Show password', exact: true }).click();
        assert.equal(await page.locator('[name="password"]').getAttribute('type'), 'text');
      }
      controls++;
    }
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log(`PASS production smoke: ${routes} routes, ${assets.size} JS/CSS assets, ${controls} hydrated auth/viewport checks.`);

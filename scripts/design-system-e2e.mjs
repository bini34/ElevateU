// Optional browser regression suite. Playwright is installed outside the app.
// See docs/DESIGN_SYSTEM.md. Requires the development-only preview route.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

if (!process.env.ELEVATEU_PLAYWRIGHT_MODULE) throw new Error('Set ELEVATEU_PLAYWRIGHT_MODULE to the installed playwright/index.mjs path.');
const { chromium } = await import(pathToFileURL(process.env.ELEVATEU_PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless: true, ...(process.env.ELEVATEU_BROWSER_CHANNEL ? { channel: process.env.ELEVATEU_BROWSER_CHANNEL } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 500)); });
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const focused = (locator) => locator.evaluate((element) => element === document.activeElement);
const section = (name) => page.getByRole('tab', { name, exact: true });
const screenshots = process.env.ELEVATEU_SCREENSHOT_DIR || path.join(os.tmpdir(), 'elevateu-day6-browser');
await mkdir(screenshots, { recursive: true });

try {
  const response = await page.goto(`${process.env.ELEVATEU_TEST_CLIENT_URL || 'http://127.0.0.1:18600'}/design-system`, { waitUntil: 'networkidle', timeout: 120000 });
  check(response.status() === 200, 'development preview serves successfully');
  // Wait for an actual hydrated interaction before screenshots modify caret styles.
  await page.getByRole('switch', { name: 'Dark preview' }).check();
  await page.waitForFunction(() => document.querySelector('.preview-root')?.getAttribute('data-theme') === 'dark');
  await page.getByRole('switch', { name: 'Dark preview' }).uncheck();
  await page.waitForFunction(() => document.querySelector('.preview-root')?.getAttribute('data-theme') === 'light');
  check(await page.locator('.ui-surface-mint').first().evaluate((el) => getComputedStyle(el).backgroundColor === 'rgb(223, 241, 229)'), 'pastel variants survive Tailwind compilation');
  check(await page.locator('.app-frame').evaluate((el) => getComputedStyle(el).borderTopWidth === '2px'), 'architectural frame has 2px border');
  check(await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily.includes('geist')), 'bundled Geist font is applied');
  await page.screenshot({ path: path.join(screenshots, 'foundations-desktop.png') });

  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ['Foundations', 'Interactions', 'Auth layout']) {
      await section(tab).click();
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tab} fits ${width}px viewport`);
      check(await page.locator('.app-mobile-nav').isVisible() === (width < 768), `mobile navigation breakpoint at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await section('Foundations').click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshots, 'foundations-mobile.png') });
  const navTargets = await page.locator('.app-mobile-nav a').evaluateAll((els) => els.every((el) => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; }));
  check(navTargets, 'mobile navigation targets are at least 44px');
  await section('Interactions').click();
  await page.getByRole('textbox', { name: 'Email example', exact: true }).focus();
  check(!(await page.locator('.app-mobile-nav').isVisible()), 'editing fields hides mobile navigation');
  await page.getByRole('heading', { name: 'Purposeful, predictable controls.' }).click();
  check(await page.locator('.app-mobile-nav').isVisible(), 'navigation returns after editing');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(screenshots, 'interactions-desktop.png') });

  check(await page.getByRole('button', { name: 'Unavailable', exact: true }).isDisabled(), 'disabled button is inert');
  const saving = page.getByRole('button', { name: 'Saving preview', exact: true });
  check(await saving.isDisabled() && await saving.getAttribute('aria-busy') === 'true', 'loading button prevents duplicate action');
  await page.getByRole('button', { name: 'Primary', exact: true }).click();
  check((await page.getByTestId('preview-action-status').textContent()).includes('primary preview selected'), 'enabled button invokes action');
  const errorField = page.getByLabel('Validation example', { exact: true });
  check(await errorField.getAttribute('aria-invalid') === 'true', 'invalid input is announced');
  check(await errorField.evaluate((el) => el.getAttribute('aria-describedby').split(' ').every((id) => document.getElementById(id))), 'input hint and error point to real content');
  await page.getByRole('button', { name: 'Show sample password' }).click();
  check(await page.getByLabel('Password example', { exact: true }).getAttribute('type') === 'text', 'password action works');
  await page.getByRole('button', { name: 'Hide sample password' }).click();
  const checkbox = page.getByRole('checkbox', { name: 'Sample checkbox' });
  await checkbox.focus(); await page.keyboard.press('Space'); check(await checkbox.isChecked(), 'checkbox works with keyboard');
  await page.getByRole('radio', { name: 'Daily', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  check(await page.getByRole('radio', { name: 'Weekly', exact: true }).isChecked(), 'native radio keyboard behavior');
  const toggle = page.getByRole('switch', { name: 'Sample reminders' });
  await toggle.focus(); await page.keyboard.press('Space'); check(await toggle.isChecked(), 'switch works with keyboard');
  const chip = page.getByRole('button', { name: 'Reflection', exact: true });
  await chip.click(); check(await chip.getAttribute('aria-pressed') === 'true', 'chip exposes selection');

  const tabs = page.getByRole('tablist', { name: 'Example activity tabs' });
  await tabs.getByRole('tab', { name: 'Today', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  check(await focused(tabs.getByRole('tab', { name: 'This week' })), 'tabs skip disabled entries');
  await page.keyboard.press('End'); check(await focused(tabs.getByRole('tab', { name: 'All time' })), 'End selects last tab');
  await page.keyboard.press('ArrowRight'); check(await focused(tabs.getByRole('tab', { name: 'Today', exact: true })), 'tabs wrap');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Home');
  check(await tabs.getByRole('tab', { name: 'Today', exact: true }).getAttribute('aria-selected') === 'true', 'Home selects first tab');

  const modalTrigger = page.getByRole('button', { name: 'Open modal', exact: true });
  await modalTrigger.click();
  const modal = page.getByRole('dialog', { name: 'A moment to reflect' });
  await modal.waitFor({ state: 'visible' });
  check(await focused(page.getByLabel('A small win')), 'modal initial focus is explicit');
  for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); check(await modal.evaluate((el) => el.contains(document.activeElement)), 'native modal traps tab focus'); }
  await page.keyboard.press('Shift+Tab'); check(await modal.evaluate((el) => el.contains(document.activeElement)), 'modal traps reverse tab focus');
  await page.keyboard.press('Escape'); await modal.waitFor({ state: 'hidden' });
  check(await focused(modalTrigger), 'Escape restores trigger focus');
  check(await page.evaluate(() => document.body.style.overflow !== 'hidden'), 'dialog restores scrolling');
  await modalTrigger.click(); await page.mouse.click(5, 5); await modal.waitFor({ state: 'hidden' });
  check(await focused(modalTrigger), 'backdrop dismissal restores focus');
  const mountedTrigger = page.getByRole('button', { name: 'Mount open modal' });
  await mountedTrigger.click();
  const mounted = page.getByRole('dialog', { name: 'Mounted open example' });
  await mounted.waitFor({ state: 'visible' }); await page.keyboard.press('Tab');
  check(await mounted.evaluate((el) => el.open && el.contains(document.activeElement)), 'already-open mount survives Strict Mode effect replay');
  await page.keyboard.press('Escape'); await mounted.waitFor({ state: 'hidden' });
  check(await focused(mountedTrigger), 'unmount restores focus');
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: 'Open drawer', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'A little more context' });
    check(await drawer.isVisible(), `drawer opens at ${width}px`);
    const box = await drawer.boundingBox(); check(box.x >= 0 && box.x + box.width <= width + 1, 'drawer fits viewport');
    await page.keyboard.press('Escape'); await drawer.waitFor({ state: 'hidden' });
  }

  const menuTrigger = page.getByRole('button', { name: 'Preview options' });
  await menuTrigger.focus(); await page.keyboard.press('ArrowDown');
  check(await focused(page.getByRole('menuitem', { name: 'Save example' })), 'menu opens on first enabled action');
  await page.keyboard.press('ArrowDown'); check(await focused(page.getByRole('menuitem', { name: 'Share example' })), 'menu skips disabled action');
  await page.keyboard.press('End'); check(await focused(page.getByRole('menuitem', { name: 'Delete example' })), 'menu End');
  await page.keyboard.press('s'); check(await focused(page.getByRole('menuitem', { name: 'Save example' })), 'menu typeahead');
  await page.keyboard.press('Escape'); check(await focused(menuTrigger), 'menu Escape restores focus');
  await page.keyboard.press('ArrowUp'); check(await focused(page.getByRole('menuitem', { name: 'Delete example' })), 'menu ArrowUp opens last action');
  await page.keyboard.press('Tab'); check(!(await page.getByRole('menu').isVisible()), 'Tab leaves and closes menu');
  await menuTrigger.click(); await page.getByRole('menuitem', { name: 'Save example' }).click();
  check((await page.getByTestId('preview-action-status').textContent()).includes('Save preview'), 'menu selection invokes callback');
  const unavailable = page.getByRole('button', { name: 'Unavailable options' });
  await unavailable.click(); await page.keyboard.press('Escape'); check(await focused(unavailable), 'all-disabled menu remains dismissible');
  await menuTrigger.click(); await page.getByRole('heading', { name: 'Stay oriented.' }).click();
  check(!(await page.getByRole('menu').isVisible()), 'outside click dismisses menu');

  const tooltipTrigger = page.getByRole('button', { name: 'About this preview' });
  await tooltipTrigger.focus(); check(await page.getByRole('tooltip').isVisible(), 'tooltip appears on focus');
  await page.keyboard.press('Escape'); check(!(await page.getByRole('tooltip').isVisible()), 'tooltip dismisses on Escape');
  await tooltipTrigger.hover(); await page.getByRole('tooltip').hover();
  check(await page.getByRole('tooltip').isVisible(), 'tooltip remains visible when hovered');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Success toast' }).click(); check(await page.getByText('Preview complete. Nothing was saved.').isVisible(), 'toast shows feedback');

  await section('Foundations').click();
  check(await page.getByRole('progressbar', { name: 'Sample milestone progress' }).getAttribute('aria-valuenow') === '75', 'linear progress exposes percentage');
  check(await page.getByRole('progressbar', { name: 'Sample weekly rhythm' }).getAttribute('aria-valuenow') === '60', 'ring exposes percentage');
  check(await page.getByText('A fresh start is a step forward.').isVisible(), 'zero streak encourages a fresh start');
  check(await page.getByText('128', { exact: true }).isVisible(), 'long streak is supplied through props');
  check(await page.getByRole('status', { name: 'Loading streak' }).isVisible(), 'streak loading state');
  const avatar = page.getByRole('img', { name: 'Sample avatar', exact: true });
  const avatarBefore = await avatar.boundingBox();
  await avatar.locator('img').dispatchEvent('error');
  const avatarAfter = await avatar.boundingBox();
  check(await avatar.locator('img').count() === 0 && (await avatar.textContent()).includes('SA'), 'simulated avatar load error falls back to initials');
  check(avatarBefore.width === avatarAfter.width && avatarBefore.height === avatarAfter.height, 'avatar fallback preserves geometry');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check(await page.locator('.ui-skeleton').first().evaluate((el) => parseFloat(getComputedStyle(el).animationDuration) < .001), 'reduced motion disables skeleton pulse');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // Check supported text/surface combinations numerically, in both token themes.
  for (const dark of [false, true]) {
    await page.getByRole('switch', { name: 'Dark preview' }).setChecked(dark);
    const contrast = await page.locator('.preview-root').evaluate((root) => {
      const style = getComputedStyle(root);
      const luminance = (token) => style.getPropertyValue(`--${token}`).trim().split(/\s+/).map(Number).map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const pairs = [['foreground', 'surface'], ['text-muted', 'surface-muted'], ['primary-foreground', 'primary'], ['on-solid', 'danger'], ...['mint', 'blue', 'yellow', 'peach', 'lavender', 'pink'].map((tone) => ['foreground', `pastel-${tone}`]), ...['success', 'warning', 'danger', 'info'].map((tone) => [tone, `${tone}-soft`])];
      return pairs.map(([a, b]) => { const l1 = luminance(a), l2 = luminance(b); return { pair: `${a}/${b}`, ratio: (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05) }; });
    });
    for (const { pair, ratio } of contrast) check(ratio >= 4.5, `${dark ? 'dark' : 'light'} ${pair} contrast ${ratio.toFixed(2)}:1`);
  }
  await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: path.join(screenshots, 'foundations-dark.png') });
  await page.getByRole('switch', { name: 'Dark preview' }).uncheck();
  // 200% CSS zoom/reflow check supplements, but does not replace, native-browser/manual zoom QA.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), '200% CSS zoom reflows without document overflow');
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  check(errors.length === 0, `no browser errors: ${errors.join('\n')}`);
  console.log(`PASS ${checks} design-system browser checks. Screenshots: ${screenshots}`);
} finally { await browser.close(); }

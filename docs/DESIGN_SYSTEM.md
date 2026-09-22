# ElevateU design system

Day 6 foundation, September 20–21, 2026, with Day 7 authentication adoption documented below. The foundation introduced no API, authentication, realtime, database or goal/streak domain changes. Day 7 refines browser authentication presentation and session routing while preserving the backend contracts.

## Product personality and visual principles

Calm, optimistic, purposeful and warm. Support personal growth and accountability with clear words, comfortable reading and visible progress. Use warm off-white canvas, dark navy ink, soft periwinkle actions and restrained pastel surfaces. Borders, spacing and hierarchy do most of the work; gradients, glass effects, heavy shadows and decorative animation are unnecessary.

The **thick dark rounded border is architectural**. Use it on the application frame, major panel boundaries, dialogs and auth frame. Small cards, posts, chips and inputs use light or control borders. A desktop screen should feel connected, not like a collection of heavy floating cards.

## Audit before implementation

| Existing condition | Day 6 response / remaining boundary |
| --- | --- |
| Bundled Geist variable fonts loaded, then overridden by Arial | Apply the already local Geist Sans; no remote font request |
| Undefined background/foreground theme variables; hard-coded gray/red palettes | Semantic RGB tokens and finite Tailwind component variants |
| Repeated 80px outer corners and nonexistent `border-3` utilities | One connected shell; change outer wrappers only |
| Duplicate desktop/mobile inline SVG navigation, red active circles, exact-only matching | Shared route model and Lucide icons, nested-route `aria-current`, pastel active state |
| Inline SVG, installed Lucide and react-icons; Flowbite configuration | Use already installed Lucide for new UI; leave dependency removal and old icons for a separate reference audit |
| Global reset removed every border; `.custom-input` removed focus | Keep Tailwind Preflight; restore visible focus and semantic control boundaries |
| Custom modals/dropdowns lack consistent keyboard and focus behavior | New reusable primitives; legacy post/group/header overlays still need adoption |
| Duplicated loaders and toast styles | Shared state/skeleton components; adapt post skeleton, root loading and existing Toaster |
| Fixed widths and repeated desktop assumptions | New responsive shell and preview; wrap the profile settings avatar/action row after a 320px regression check; other page internals remain incremental migration work |
| Legacy auth copy has low contrast; some controls lack visible labels | Document for Day 7; actual auth forms and business logic are unchanged |
| Profile post-loading errors can be swallowed; some API messages displayed directly | Future feature-level error work; new ErrorState defaults to safe, useful copy |
| Incomplete OS-triggered dark classes | Explicit theme selector; legacy pages stay light until individually verified |

## Source and ownership

```text
client/src/app/tokens.css                 Semantic values, light/dark themes
client/src/app/globals.css                Preflight, focus/motion, component and shell styles
client/tailwind.config.ts                 Token utilities, finite variant safelist
client/src/components/ui/                 Typed primitives beside existing media UI
client/src/components/layout/             Brand, route model, AppShell, AuthLayout
client/src/components/design-system/      Development examples and explicit sample data
client/src/app/design-system/page.tsx     Server-side development-only gate
client/src/middleware.js                 Early production 404 for the preview path
client/src/components/Layout.jsx          Real user/notification context adapter
client/tests/design-system.test.js        Node/SSR contract tests
scripts/design-system-e2e.mjs             Optional real-browser primitive checks
scripts/ui-foundation-flows.mjs           Existing-flow browser smoke tests
```

The CSS component layers live with the Tailwind directives in one stylesheet. Next processes imported stylesheets separately; splitting `@layer components` into directive-free CSS imports fails this pipeline. Keep tokens separately imported and styles in the existing Tailwind pipeline rather than adding a CSS dependency. Dynamic component class names have a **finite safelist**; adding a variant requires updating its type, CSS, safelist and preview.

Components own presentation and local interaction. API calls, permissions, persistence, date/timezone rules and progress/streak calculations belong to feature hooks/services. No preview fixture may be imported into production screens. Existing JavaScript screens can adopt typed primitives without a mass conversion.

## Color tokens

Values are RGB channels so utilities support opacity, e.g. `bg-surface/90`. In plain CSS use `rgb(var(--surface))`, not `var(--surface)` directly.

| Role | Light values / use |
| --- | --- |
| `background`, `foreground` | `#f8f7f3`, `#1d222f`; warm canvas and readable ink |
| `surface`, `surface-muted`, `surface-elevated` | White, `#f2f3f7`, white; content, fields, overlays |
| `text-muted` | `#5b6170`; secondary readable text, not disabled text |
| `border`, `border-control`, `border-strong` | `#d8dbe4`, `#7d8496`, `#272c3b`; separators, interactive boundaries, architecture |
| `primary`, `primary-hover`, `primary-soft`, `primary-foreground` | `#c1c8fa`, `#aeb9f4`, `#edefff`, ink |
| `focus` | `#4a4ca2`; focus rings and progress fill |
| `success`, `warning`, `danger`, `info` | Dark green, amber, red, blue with matching `*-soft` surfaces |
| `on-solid` | Text on status-solid backgrounds; white in light theme, ink in dark theme |
| `pastel-mint`, `pastel-blue`, `pastel-yellow` | `#dff1e5`, `#e0edfa`, `#fbefc0` |
| `pastel-peach`, `pastel-lavender`, `pastel-pink` | `#fae3d4`, `#e9e5f8`, `#f9e4ed` |
| `scrim` | Dark neutral for modal backdrops |

Pastels are surfaces, not important text or an implicit status system. Keep status labels/icons in addition to color. Category-to-color mappings are deliberately not permanent business rules. All exact light/dark values live in `tokens.css`.

## Typography

Geist Sans is loaded locally through `next/font/local`; Geist Mono remains available for technical content. Do not add another font service. Use semantic utilities instead of arbitrary text sizes in new primitives.

| Utility | Size | Line height | Weight / tracking |
| --- | --- | --- | --- |
| `text-display` | Fluid 32–44px | 1.12 | 650 / −.045em |
| `text-h1` | Fluid 26–34px | 1.2 | 650 / −.035em |
| `text-h2` | Fluid 22–26px | 1.3 | 600 / −.025em |
| `text-h3` | 18px | 1.4 | 600 / −.015em |
| `text-h4` | 16px | 1.5 | 600 |
| `text-body` | 16px | 1.65 | 400 |
| `text-body-small` | 14px | 1.6 | 400 |
| `text-label` | 14px | 1.4 | 600 |
| `text-caption` | 13px | 1.5 | 400 |
| `text-metadata` | 12px | 1.5 | 500 |

Heading utilities set visual hierarchy, not HTML semantics. Choose heading elements according to the document structure. Mobile form controls retain 16px text; reading content is not reduced to fit a screenshot.

## Spacing, radii, borders and shadows

Use Tailwind's existing 4px-based scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Matching `--space-*` variables support shared CSS. Container padding is generally 20px on phones and 24–40px on desktop. Use fluid widths and `min-width: 0` before adding breakpoints.

| Tier | Radius | Use |
| --- | --- | --- |
| `control` / `--radius-sm` | 8px | Inputs, small internal surfaces |
| `button` / `--radius-md` | 14px | Buttons, menus, tabs |
| `card` / `--radius-lg` | 20px | Normal/pastel cards |
| `panel` / `--radius-panel` | 28px | Major panels, mobile shell, dialogs |
| `shell` / `--radius-shell` | 32px | Desktop outer frame and auth frame |

Normal borders are 1px. Interactive control borders are deliberately darker than separators. Architectural borders are 2px, with 1.5px on the mobile frame. Adjacent shell regions share one boundary. Fully round badges/avatars are intentional exceptions to the radius tiers.

`shadow-xs`, `shadow-sm`, `shadow-panel` are subtle neutral shadows. Only overlays generally need elevation; normal cards do not float. Do not combine a strong border, heavy shadow and saturated surface on the same small control.

## Component conventions and APIs

Import from the individual module; avoid a client-only barrel that pulls every interactive primitive into every screen. Native element attributes are forwarded where applicable. Button defaults to `type="button"`; explicitly use `type="submit"` for forms. Field labels and icon-only accessible names are required.

| Module | Components / contract |
| --- | --- |
| `Button.tsx` | `Button`: primary/secondary/outline/ghost/danger; sm/md/lg; disabled/loading/loadingLabel. `IconButton`: required `label`, same native button contract |
| `Field.tsx` | `Input`, `Textarea`, `Select`: required visible `label`, optional description/error/required/disabled; native props and refs. Input supports decorative `leftIcon` and labeled `rightAction` |
| `Choice.tsx` | `Checkbox`, `Radio`, `Switch`: native input behavior, label/description/disabled. Group radio controls with `fieldset`, `legend` and one `name` |
| `Surface.tsx` | `Card` tone default/muted/six pastels; `Panel` architectural section; status `Badge`; toggle `Chip` with `aria-pressed`; semantic `Divider` |
| `Avatar.tsx` | Required `name`, optional image `src`, sm/md/lg/xl (32/40/56/80px), optional online state; fixed footprint and initials/icon fallback on image error |
| `Progress.tsx` | `Progress`, `ProgressRing`: required value/label, optional max/status/className; finite values clamped to 0–100%, named progressbar semantics and visible percentage |
| `Tabs.tsx` | `label`, items `{id,label,content,disabled?}`; optional controlled value/onValueChange or defaultValue. Preloaded panels, automatic activation, arrows/Home/End, disabled skipping |
| `Tooltip.tsx` | Supplementary content for one already named focusable child. Hover/focus open; Escape, blur/scroll/resize dismiss; tooltip is hoverable |
| `DropdownMenu.tsx` | Labeled trigger and action items `{id,label,onSelect,disabled?,danger?}`. Arrows/Home/End/typeahead, Escape/Tab/outside dismissal; disabled-only menu remains dismissible |
| `Dialog.tsx` | `Modal`, `Drawer`: open/onOpenChange/title/description, content, optional stable `initialFocusRef`; native modal dialog, focus cycle/restoration, Escape/backdrop dismissal, scroll lock |
| `ToastProvider.tsx` | Existing react-hot-toast integration, token surfaces, polite status messages and existing success/error API; one provider in root layout |
| `Skeleton.tsx` | Decorative `Skeleton`; announced `ContentSkeleton` post/conversation/profile/card/list variants |
| `State.tsx` | `EmptyState` title/description/optional action; `ErrorState` safe default copy and optional retry; `LoadingState` meaningful label |
| `StreakCard.tsx` | Presentation contract below; never computes consistency |

Compose cards rather than adding unrelated props such as `isGoal`, `isProfile`, `isChallenge`. Errors passed into the UI must be user-safe summaries, not exception objects, server traces or raw validation payloads. Persistent form errors belong next to fields; toasts supplement rather than replace them. Announce loading and errors once per region, not once per decorative skeleton bar.

### Streak presentation

```tsx
<StreakCard
  currentStreak={streak.currentStreak}
  days={streak.days}
  message={streak.encouragement}
  loading={loading}
/>
```

This illustrates a **caller-owned view model**, not an existing API. `days` contains seven entries `{date, label, status: 'completed' | 'missed' | 'upcoming', today?}` in display order. Supply accessible date strings and localized visible labels; no browser clock or timezone inference occurs inside the component. At most seven entries render. Counts are nonnegative integers for display; callers validate domain data. Zero, active, long and loading examples are explicitly labeled sample data in the preview. Completed/missed/upcoming states have distinct symbols and screen-reader text, not just colors.

## Responsive shell and auth foundation

`AppShell` takes navigation, mobileNavigation, children and optional account/footer/rightRail slots. `Layout.jsx` binds real authentication/notification contexts. Only implemented URLs are offered: Home, Communities, Messages, Notifications, Profile (when known), Settings and mobile Create post. Unread badges use real notification state. No Goals, Challenges, Explore or fake streak entry is shipped in navigation.

- Desktop ≥1024px: 216px navigation, flexible main, optional 288px contextual rail; whole frame caps at 1560px.
- Tablet 768–1023px: 88px icon rail with accessible names and titles. Contextual rail moves below the main region below 1200px.
- Mobile <768px: compact brand/account header and separate six-item fixed bottom navigation. Targets are at least 44px. Content reserves navigation height plus `env(safe-area-inset-bottom)`; top header respects the top inset.
- The mobile bottom bar hides while a text field/contenteditable is focused, leaving room for editing. Native dialogs cap height with dynamic viewport units and scroll internally. Actual iOS/Android virtual keyboards still need device QA.
- Chat/group master-detail behavior stays intact: list at the parent route, conversation at nested routes. Outer wrappers share the shell; message handling is unchanged.
- `AuthLayout` is a standalone split brand/illustration/form frame, with an organic rounded panel boundary and a compact stacked mobile version. It never includes app navigation. Sign-in/signup/recovery pages adopt it in Day 7 through `AuthPage`.

The skip link targets the shared content region; feature pages retain responsibility for their main landmark and heading structure. Shell changes are not a claim that every legacy screen meets accessibility requirements.

## Accessibility and motion

Use native buttons, links, fields, radio groups and dialog behavior first. New controls have visible focus, meaningful names, disabled/loading states, and associated descriptions/errors. Dialogs make the background inert, cycle Tab in both directions and return focus to the trigger; an already-open mount is tested under development Strict Mode. Menus and tabs follow the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) and [menu-button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/). Native dialog behavior is described in [MDN's dialog reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

Use 140ms feedback and 220ms panel/progress transitions. Avoid looping animation except loading indicators. `prefers-reduced-motion: reduce` reduces animations/transitions to near-zero and disables smooth scrolling. Status is always readable without movement or color.

The browser suite measures supported text/token pairs against 4.5:1 in both themes, checks keyboard/focus behavior, six widths, target sizes and reduced motion. A 200% CSS zoom/reflow check supplements testing; it is not a screen-reader assessment or native mobile/browser zoom certification. Test real assistive technology and devices as screens migrate.

## Dark-mode strategy

Light is the product default. `[data-theme="dark"]` opts a subtree into dark semantic tokens; Tailwind dark variants use the same explicit selector. The preview switch affects its own subtree only. Legacy product screens retain literal colors and are **not dark-mode-ready**. Do not add a global theme switch until each affected screen is migrated and verified. Root-level toasts follow the root theme, not a preview-local subtree.

## Development preview and verification

Run `npm run dev` in `client`, then open `/design-system` (default `http://localhost:3000/design-system`). It has Foundations, Interactions and Auth layout sections. Every sample is illustrative; preview actions explicitly say that no data was saved. Navigation links lead to real app routes and therefore still require normal sign-in where applicable.

The server route calls `notFound()` unless `NODE_ENV === 'development'`, before loading the showcase. An early middleware branch blocks `/design-system` and its subpaths with HTTP 404 outside development: App Router streaming alone can show not-found content while returning 200. This branch is scoped to the preview; existing protected-route redirects remain unchanged and have regression tests. The preview has noindex metadata and no production navigation entry. Never override NODE_ENV to expose it in a deployed build.

Required frontend checks: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit`, `npm audit --omit=dev`. Stop the dev server before building because both use `.next`. The Node suite uses built-in `node:test`, React server rendering and the existing TypeScript transpiler; typechecking remains a separate gate.

Optional browser testing without a project dependency (PowerShell, repository root):

```powershell
$uiTools = Join-Path $env:TEMP 'elevateu-day6-browser'
npm install --prefix $uiTools playwright
$env:ELEVATEU_PLAYWRIGHT_MODULE = Join-Path $uiTools 'node_modules/playwright/index.mjs'
$env:ELEVATEU_BROWSER_CHANNEL = 'msedge' # installed Edge; omit to use installed Playwright Chromium
$env:ELEVATEU_TEST_CLIENT_URL = 'http://127.0.0.1:18600'
node scripts/design-system-e2e.mjs
```

For the existing-flow smoke suite, start the [disposable integration stack](DEVELOPMENT.md#disposable-httpwebsocket-integration-stack) under a distinct project. Day 6 uses `elevateu-day6`, API 18584, WebSocket 16505 and logs in the OS temporary directory. Start the client with matching `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_REVERB_*` environment values, then set `ELEVATEU_DISPOSABLE_UI_TEST=true` and run `node scripts/ui-foundation-flows.mjs`. It creates real throwaway users/posts/comments/groups/messages, never mocks a working product API, and must not target a persistent or production environment. It does not print generated credentials. Remove only that disposable Compose project's volumes afterward. Screenshots stay outside Git in the temporary directory.

### Day 6 verification record

Final verification runs September 20–21, 2026, using Node 22.23.2/npm 10.9.8, the installed headless Edge browser, and an isolated PHP 8.2.33/MySQL 8.4.11 test stack. No project dependencies or lockfiles changed. The in-app browser runtime had no available browser; the optional external Playwright harness ran the browser checks instead.

| Check | Result |
| --- | --- |
| `npm ci` | Pass; lockfile reproduced. Existing package deprecation notices and a nonfatal Windows optional-sharp cleanup warning; native image tests subsequently pass |
| `npm run lint` | Pass, zero ESLint warnings/errors; Next 15 emits its existing `next lint` deprecation notice |
| `npm run typecheck` | Pass |
| `npm test` | 29 tests pass, zero failures/skips; 19 existing helpers, 7 primitive contracts, 3 preview/route guards |
| `npm run build` | Pass; Next 15.5.25 standalone production output, 17 static pages generated; build lint/type validation also pass |
| Standalone production smoke | 11 route checks and 32 JS/CSS asset requests pass: preview/query/subpath/token requests return 404, sign-in/signup return 200, protected routes retain sign-in redirects |
| `npm audit` / `npm audit --omit=dev` | Both zero vulnerabilities, rechecked September 21 |
| `node scripts/design-system-e2e.mjs` | 127 browser checks pass: controls, tabs, menus, tooltip, modal/drawer, focus restoration, field errors, avatar fallback, streak/progress, reduced motion, contrast and reflow |
| `node scripts/ui-foundation-flows.mjs` | 43 checks pass against real disposable data; registration/sign-in, feed creation/reload, like/comment, direct/group messages, profile update and notification read behavior; seven routes at 320/375/768/1440px |
| Isolated backend PHPUnit | 67 tests / 560 assertions pass; network disabled, read-only source and temporary SQLite/runtime storage |
| Backend scope | All 163 baseline source/config hashes unchanged; no server files added/modified/deleted in Git |
| Cleanup | Only the `elevateu-day6` test containers/network/two volumes removed; persistent development containers/volume untouched |

Issues caught and fixed during verification: optional field-adornment typing, Tailwind pruning finite dynamic variants, separate CSS component-layer imports, dialog Tab escape into browser chrome, profile settings overflow at 320px, and the production preview's soft 404. The browser harness was corrected to recognize UUID routes and await message acknowledgments before reload, rather than treating optimistic bubbles as persistence evidence.

Limitations remain explicit: legacy overlays, clickable conversation/group rows, auth contrast/copy and page-specific error handling still need migration. The flow smoke suite does not retest every attachment, offline/reconnect, password-recovery or realtime race scenario covered by separate suites. Real mobile keyboards, native 200% browser zoom and screen-reader sessions remain manual QA. Dark tokens are a foundation, not a claim that legacy pages support dark mode.

## Do / don't and migration order

| Do | Don't |
| --- | --- |
| `Card tone="mint"` for a supportive surface | Scatter literal mint colors or pastel text through JSX |
| Use one strong shell boundary | Put a 2px black outline on every post/button |
| `Input label="Email" error={safeFieldError}` | Use a placeholder as the only field label |
| Derive a progress view model from verified domain data | Present sample percentages or streaks as live activity |
| Use named native actions and preserve focus | Make clickable divs or remove focus without a replacement |
| Migrate one complete flow and its states | Restyle every page independently or rewrite working APIs |

Day 7 adopts AuthLayout and form primitives in sign-in, registration and recovery; see the conventions below. Later iterations migrate feed, communities, messages, profiles and settings one coherent flow at a time.

## Authentication experience (Day 7)

The incoming screens duplicated their own shells, icons and form markup. Sign-in/signup had accessible names but lacked consistent visible labels; recovery mixed native validation with toast-only failures. Raw API messages could reach users, password reveal controls were absent, and pending state alone did not synchronously guard repeated submissions. AuthContext had no resolved-session status for public-page redirects. A protected 401 on a reset page could redirect away and lose the reset query. These are the boundaries addressed by this migration.

`components/auth/AuthPage` connects the shared `AuthLayout` to session initialization and safe routing. `AuthBrandPanel` owns the concise brand copy and local, decorative SVG. `AuthForm` composes existing Input/Button controls plus the reusable `PasswordInput`. `useAuthForm` owns submission, pending state, input preservation and focus; `lib/auth-form.ts` owns validation and safe legacy/structured API error translation. Route components provide the screen title and form kind. No additional UI or validation package is required.

- The outer architectural border, warm surface, lavender brand area, periwinkle action, ink text and Geist typography use the Day 6 tokens. Individual fields retain the normal control border.
- At 768px and above the brand and form share a split layout. Below 768px the brand becomes a compact wordmark header; nonessential copy/art is hidden. Signup names stack on mobile. Layout height is content-driven and the outer padding respects safe areas.
- Every field has a visible label, stable input name, required semantics and appropriate autocomplete. Required markers are decorative; accessible names omit the marker. Password and confirmation toggles have independent, named buttons, preserve values and remain keyboard reachable.
- Native forms support Enter. A synchronous ref guards submission before the request starts; the loading CTA disables further submissions and fields become read-only until completion. Failures preserve input. Validation focuses the first invalid field; other errors/success focus a compact inline status. There are no duplicate form-error toasts.
- Login requires email and password and adds no password-strength rule. Signup/reset match the backend's 8–4096-character password rule and exact confirmation. Name/email lengths match the 255-character limits. The server remains authoritative, including uniqueness and email validation. Passwords are never trimmed.
- Legacy 400 message arrays and structured 422 field errors are mapped to safe local copy. Unexpected exceptions, network errors, throttling and invalid credentials get generic useful messages. A rate-limit message asks users to wait; it does not invent an exact retry countdown.
- Forgot-password success is identical for existing and unknown accounts. Reset preserves token/email query data internally, never renders the token as page text, and offers a new-link action for missing/invalid/expired/reused links. Success directs users to sign in without automatically authenticating. If the current cached account matches the reset email, its local session is cleared because the backend revokes its tokens.
- Auth entry forms wait for session initialization. Only a server-verified session or successful authentication triggers the fixed `/` destination. Cached localStorage identity cannot trigger a redirect. Failed verification offers retry or explicit local sign-in recovery. Reset links remain usable by authenticated users, and a stale-token 401 does not discard public auth-page query state.
- OAuth UI stays hidden because the existing endpoints are intentionally disabled. No remember-me toggle is shown because token persistence has no corresponding choice. No Terms/Privacy checkbox or legal links are added without actual policy routes and agreement requirements.

Passport, bearer-cookie storage, API payloads, backend validation, rate limits and session revocation rules are unchanged. JavaScript-readable tokens remain an XSS risk; the documented future HttpOnly migration is separate work. Password-change settings and broader product screens are outside this migration.

Onboarding is deferred. A later persisted flow may connect profile, goals, interests and community choices, but first requires real domain schemas, owned APIs, visibility/consent decisions and resumable server-side state. No production onboarding route, localStorage-only completion or sample domain data is introduced.

### Reproducing authentication verification

Use the same external Playwright installation described above. Start a distinct disposable Compose project with log mail and point the frontend at its API/WebSocket ports. Set `ELEVATEU_DISPOSABLE_UI_TEST=true` and `ELEVATEU_TEST_LOG_PATH` to that project's `laravel.log`, then run `node scripts/auth-experience-e2e.mjs`. Never point it at persistent data. It creates synthetic users and uses a real logged reset token without printing credentials/tokens. Real successful requests are paced for the existing public-auth limiter. Explicit 429/500/network cases use browser request fault injection and do not stand in for successful integration tests.

The auth suite covers real registration/login, duplicate fields, keyboard and reveal controls, double-submit protection, known/unknown recovery, reset/reuse/revocation, session routing and mobile/tablet/desktop reflow. Continue running the separate design-system and existing-product browser suites. Native mobile keyboards, actual password-manager autofill and screen-reader sessions still require device/assistive-technology QA; autocomplete and browser semantics alone do not certify those integrations.

### Day 7 verification record

September 21, 2026; Node 22.23.2/npm 10.9.8, Next 15.5.25, installed headless Edge and a disposable PHP 8.2.33/MySQL 8.4.11 log-mail stack. No dependency/lockfile or backend contract changes.

| Check | Result |
| --- | --- |
| `npm ci` | Pass; reproducible install, existing package deprecation notices |
| `npm run lint` / `npm run typecheck` | Pass; zero lint warnings/errors, existing Next lint-command deprecation notice |
| `npm test` | 38 passed, zero failures/skips; auth validation/error mapping, password semantics and recovery-route 401 behavior added |
| `npm audit` / `npm audit --omit=dev` | Both zero vulnerabilities |
| `npm run build` | Pass; standalone Next 15.5.25 output, all 17 static pages generated; build lint/type validation passes |
| Production smoke | 13 route checks, 19 distinct JS/CSS assets and 12 hydrated auth/viewport checks pass; preview is a hard 404 and protected routes redirect to sign-in |
| Authentication browser suite | 75 passed; real success flows and separately identified 429/500/network fault-injection cases |
| Design-system browser suite | 127 passed, including contrast, focus, controls and responsive foundations |
| Existing-product browser suite | 43 passed; posts/feed, likes/comments, direct/group messages, profile, notifications and four-width shell regression |
| Backend PHPUnit | 67 passed / 560 assertions using forced in-memory SQLite; nonfatal result-cache write warning because the source mount is read-only |
| Backend scope | All 163 pre-Day-7 source/config hashes match; Git reports no backend changes; persistent development containers/database remain untouched |
| Cleanup | Development/production frontend processes stopped; only the `elevateu-day7` containers, network and two media volumes removed |

Browser acceptance waits were corrected to await hydration and the destination form after client navigation. Existing product selectors now use the stable submitted field names because visible required markers changed label-text matching; accessible names and label associations are separately checked. Feedback focus checks are scoped to the form instead of also matching Next's route announcer. The production suite asserts the first invalid field (first name on empty signup, email elsewhere). The broader suite exposed a real tooltip focus bug: pointer departure/browser scrolling could hide keyboard-focused help. Its narrowly scoped fix keeps focused help positioned until blur or Escape. No failing test was skipped.

Desktop and mobile sign-in/signup screenshots were inspected. All four auth pages fit 320/375/768/1024/1440px without horizontal overflow. Screenshots and synthetic log-mail data are kept outside Git. Expired-token rejection is also covered by the unchanged backend security suite; the browser recovery suite verifies missing, stale-session and reused links against the real API.

Production verification uses `node scripts/production-smoke.mjs` against a started standalone build, with `ELEVATEU_TEST_CLIENT_URL` and the same external Playwright module/channel configuration. It checks hard preview 404s, protected redirects, auth assets and hydrated auth controls at phone/tablet/desktop widths. Stop the development server before building/running production from the same `.next` directory.

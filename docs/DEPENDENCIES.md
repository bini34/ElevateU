# Day 3 dependency and runtime review

Reviewed 2026-09-19 against the Day 2 lockfiles. The current npm and Composer advisory scans are clear. This does **not** make ElevateU production-ready: MySQL support, credential rotation, legacy private-media rollout, browser tokens and active-socket revocation remain release concerns. No database migration, product feature or UI redesign was introduced.

## Audit evidence

| Dependency graph | Before Day 3 | After Day 3 |
| --- | --- | --- |
| Client npm, full | 19 package entries: 14 high, 4 moderate, 1 low | 0 |
| Client npm, `--omit=dev` | 11 package entries: 7 high, 3 moderate, 1 low | 0 |
| Server Vite npm, full | 9 package entries: 1 critical, 6 high, 2 moderate | 0 |
| Server Vite npm, `--omit=dev` | 0 | 0 |
| Composer, full and `--no-dev` | 4 advisory records across 2 runtime packages: 1 high, 1 medium, 1 low, 1 unrated | 0 advisories; 0 abandoned packages; no filtered records |

npm counts affected package entries, including inherited findings; Composer counts advisory records. The two Laravel email records refer to the same defect. [DEPENDENCY_ADVISORIES.md](DEPENDENCY_ADVISORIES.md) inventories every reported source record, affected range, installed/fixed version, classification, exposure, priority, upgrade path and compatibility risk. No audit ignores, severity exclusions or permanent blocking exceptions were added.

Production installation classification is not proof of request-time reachability. Tailwind/CLI packages appear in the client's production graph through Flowbite's peer dependencies. The server's separate npm graph consists entirely of development dependencies; its generated assets are not referenced by the current welcome Blade template. Both graphs were patched and built.

## Intentional package decisions

| Package / graph | Before | Final locked version | Reason |
| --- | --- | --- | --- |
| Next.js / eslint-config-next | 15.5.25 | 15.5.25, retained | Current 15.x backport; inherited PostCSS finding resolved without forcing Next 16. |
| React / React DOM | 18.3.1 | 18.3.1, retained | Compatible with retained Next; no React migration needed. |
| sharp, direct client | 0.33.5 | 0.35.4 | Patched native decoder; accepted by Next's optional sharp range. |
| PostCSS under Next | 8.4.31 | 8.5.28 | Scoped override reuses patched root PostCSS. |
| Client Babel runtime | 7.25.6 | 7.29.7 | Compatible runtime-helper fix. |
| Client glob / minimatch | 10.3.10 / 3.1.2, 9.0.3, 9.0.5 | 10.5.0 / 3.1.5, 9.0.9 | Fix CLI/glob processing; ESTree needs a scoped override. |
| Client brace-expansion / cross-spawn | 1.1.11, 2.0.1 / 7.0.3 | 1.1.21, 2.1.7 / 7.0.6 | Compatible transitive fixes. |
| Client picomatch / selector parser / YAML | 2.3.1 / 6.1.2 / 2.5.1 | 2.3.2 / 6.1.4 / 2.9.1 | Compatible transitive fixes. |
| Client AJV / flatted / js-yaml | 6.12.6 / 3.3.1 / 4.1.0 | 6.15.0 / 3.4.4 / 4.3.2 | Fix lint/cache/config dependencies. |
| Laravel framework | 11.56.1 | 12.69.2 | Smallest supported major resolving email/signed-URL advisories on PHP 8.2. |
| Passport | 12.3.0 | 12.4.3 | Same-major compatibility with JWT 7 and Laravel 12. |
| Socialite | 5.16.0 | 5.30.0 | Compatible JWT 7 path; later releases require phpseclib 4, conflicting with Passport 12. OAuth remains disabled. |
| firebase/php-jwt | 6.10.1 | 7.1.1 | Fix key-validation advisory via updated Passport/Socialite constraints. |
| Reverb | 1.11.1 | 1.11.1, retained | Already patched; integration verified with the new framework. |
| Client Axios / Echo / Pusher / Tailwind | 1.20.0 / 1.16.1 / 8.4.0-rc2 / 3.4.11 | Retained | No current advisory requiring replacement. |
| Server asset Axios | 1.7.7 | 1.20.0 | Fix transport dependencies; aligns with client version. |
| Server Vite / Laravel Vite plugin | 5.4.9 / 1.0.5 | 6.4.3 / 1.3.0 | Reviewed patched Vite line; existing config/resources build unchanged. |

### Next.js compatibility

Inspection covered App Router, cookie-presence middleware, client dynamic-route hooks, image components, public build-time environment values, client/server boundaries and standalone output. React 18.3.1 remains accepted; Node 22.23.2 satisfies both Next and sharp. Host and Linux standalone builds pass and generate 16 static pages. The remaining Next audit entry was inherited from PostCSS, not a separate framework advisory.

Next 15 remains Maintenance LTS at review time. Its two-year window from October 21, 2024 implies a maintenance deadline of October 21, 2026; schedule the next major review soon. `next lint` emits a deprecation notice, and ESLint 8 has deprecated transitive tools despite clear advisory scans. [Next support policy](https://nextjs.org/support-policy), [Next 15.5 release notes](https://nextjs.org/blog/next-15-5).

### Image processing and authorization

The affected direct dependency was `sharp@0.33.5`. A correction to the conservative Day 2 assessment: its lockfile also had **Next's nested `sharp@0.35.4`**, so resolution from Next would select that patched copy in a matching installation. No direct application sharp import was found. Day 2 also disabled the optimizer entirely. Day 3 removes the vulnerable root copy and deduplicates on 0.35.4, eliminating reliance on that resolution detail.

The sharp 0.35 migration raises the Node minimum to 20.9 and removes deprecated options; Next's inspected optimizer uses none of those removed options. Tests exercise the actual Next optimizer and sharp with JPEG, PNG, WebP and AVIF, resized dimensions, the bundled avatar, remote-path validation and responsive srcsets. The Linux standalone runtime reports sharp 0.35.4 / libvips 8.18.6. [Maintainer advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c), [0.35 migration](https://sharp.pixelplumbing.com/changelog/v0.35.0/), [0.35.4 release](https://sharp.pixelplumbing.com/changelog/v0.35.4/).

Optimization is enabled by default. Exact protocol/host/port patterns come from `NEXT_PUBLIC_BACKEND_URL`, limited to `storage/uploads/avatars`, `posts` and `groups`, without query strings. The preexisting Facebook static asset host remains allowed. SVG optimization stays disabled. Private API endpoints and legacy message prefixes are excluded; private attachments remain authenticated blob downloads.

The API origin must be reachable from both browser and Next, and match Laravel's public storage origin (`APP_URL`). Development Compose explicitly sets `ELEVATEU_UNOPTIMIZED_IMAGES=true`: its default `localhost:8080` points back into the Next container during server fetches. This network-only fallback serves originals. With a shared reachable origin, set it to `false`; host development and production builds optimize by default. This fallback is not a substitute for patching dependencies. See [DEVELOPMENT.md](DEVELOPMENT.md).

### Laravel, Passport and Reverb

Manifest floors are framework `^12.61.1`, Passport `^12.4.3`, Socialite `^5.24.3`; committed locks specify exact versions. Laravel 11 is out of security support. Laravel 12 clears the remaining advisories while retaining PHP 8.2; Laravel 13 would also require raising PHP. Laravel 12 security support lasts until February 24, 2027. [Laravel support policy](https://laravel.com/framework/docs/12.x/releases#support-policy).

The [Laravel 12 upgrade guide](https://laravel.com/framework/docs/12.x/upgrade) was checked against the code: Carbon was already 3.x; UUID creation uses explicit `Str::uuid`; filesystem roots are explicit; SVG uploads are already denied; no application code constructs the changed password-token repository. No PHP source or schema edits were necessary. Firebase JWT 7 strengthens key validation; no direct application calls were found. Real Passport issuance/verification/revocation provides auth regression evidence. [JWT 7 release](https://github.com/googleapis/php-jwt/releases/tag/v7.0.0).

Day 2 email control-character validation and disabled unused local signed serving remain defense in depth. Socialite upgrades do not reenable OAuth. MySQL/Reverb suites retest private/group channels, X-Socket-Id self-echo exclusion, messages, typing/presence, password/reset revocation and queued notifications. Existing sockets can still survive member removal/token revocation; dependency updates do not repair that application boundary.

## Lockfile discipline

Targeted resolutions used disposable directories and the existing locks before promotion. No `npm audit fix --force`, unrestricted Composer update or blanket lock regeneration was used. Two narrow client overrides select patched code, rather than filtering advisories:

```json
{
  "next": { "postcss": "$postcss" },
  "@typescript-eslint/typescript-estree": { "minimatch": "9.0.9" }
}
```

Next pins older PostCSS; ESTree pins minimatch 9.0.3. Replacements retain their major versions and pass build/lint tests. Remove each override when the upstream constraint selects a reviewed fixed release, then repeat clean installation and regressions.

Initial npm lock-only resolution retained two stale entries. Only Next's nested PostCSS and root brace-expansion entries were removed from the scratch lock and resolved again. Final `npm ls postcss sharp minimatch brace-expansion --all` succeeds with patched/deduplicated versions. Windows and clean Linux `npm ci` pass. Windows emitted a cleanup warning for an unused optional sharp WASM directory; independent clean Linux/native checks pass.

The final client delta has 69 version changes/additions/removals by package path, including optional sharp binaries and duplicate removals. Ancillary movement is glob's required jackspeak 3/package-json-from-dist, CLI ANSI helpers, and removal of old sharp color helpers/Babel regenerator. React, Next, Tailwind, Axios, Echo and Pusher do not move. The server npm lock changes are Vite/Rollup/esbuild/plugin, Axios and affected transitive fixes; its separate clean build passes.

Composer changes 20 versions, adds two Symfony PHP polyfills and removes no packages. Compatibility updates include Tinker, Sail, Collision/Whoops, OAuth1 client, Termwind and relevant Symfony 7.1 components moving to 7.4. Resolution used an explicit allowlist with `--with-all-dependencies --minimal-changes`; normal advisory blocking remained enabled. Scripts/plugins were disabled in isolated resolution/install to avoid loading local secrets or running application commands. The production Docker build separately passes package discovery with safe drivers. Full development installation, clean production installation and strict manifest/lock validation pass.

## Runtime and Docker baseline

| Runtime | Previous selection | Day 3 selection |
| --- | --- | --- |
| Node | Floating Node 20 Alpine; host 22.18.0 | 22.23.2 Alpine 3.24, digest pin; `.nvmrc` 22.23.2 and engine `^22.23.2` |
| PHP | Floating 8.2-fpm; previous check 8.2.32 | 8.2.33 FPM Bookworm, digest pin |
| Composer | Floating latest | 2.10.3, digest pin |
| nginx | Floating latest | 1.30.5 Trixie, digest pin |
| MySQL | Floating 8.0, cached 8.0.46 | Same 8.0.46 engine, digest pin; no data-format upgrade |

Full multi-platform digests are in Dockerfiles/Compose. Host verification used the official Node 22.23.2 Windows distribution, SHA-256 checked against official checksums, with npm 10.9.8; global Node was untouched. Node 20 is EOL. PHP 8.2 security support ends December 31, 2026: schedule its upgrade. [Node releases](https://nodejs.org/en/about/previous-releases), [PHP support](https://www.php.net/supported-versions.php).

**MySQL 8.0 reached EOL in April 2026.** Pinning 8.0.46 does not fix support risk. A supported 8.4 migration needs backup/restore and rehearsal before changing a persistent volume. It remains a deployment blocker. [MySQL release notes](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/).

The frontend runs as UID 100. The existing backend Supervisor/FPM/queue/Reverb privilege arrangement and final-image build tools remain operational debt. apt avoids recommendations and drops package lists; apt repositories are not snapshot-pinned. `server/.dockerignore` now excludes private uploads as well as existing secret/key/log/public-upload exclusions. A final index check also found `server/.env` still tracked; its removal is now staged, with the local file verified unchanged. Historical credentials still need rotation. No OS vulnerability scanner was run; npm/Composer counts do not cover OS packages.

## Verification

| Check | Day 3 result |
| --- | --- |
| Client clean install, lint, typecheck, tests, production build | Pass; 19 tests; 16 static pages |
| Client full / production npm audit | Pass; 0 / 0 |
| Server asset clean install / Vite build / full and production audits | Pass; 64 modules; 0 / 0 |
| Composer development and production installs / strict validate | Pass |
| Composer full / production locked audit | Pass; 0 / 0 |
| PHP syntax / PHPUnit on PHP 8.2.33 | Pass; 37 tests / 375 assertions |
| Pint `--test` | **Fail: 49 existing files with style issues**; unchanged, no mass formatting |
| Frontend / backend production Docker builds | Pass |
| Three Compose configurations / nginx configuration | Pass |
| Feed HTTP integration | Pass; 51 assertions |
| Private/group chat HTTP/WebSocket integration | Pass; 55 assertions, including 14 new group checks |
| Profile/password HTTP integration | Pass; 23 assertions |
| Notifications HTTP/queue/WebSocket integration | Pass; 20 assertions |
| Standalone public image/navigation HTTP smoke | Pass; 26 checks: original bytes, resized WebP at 64/128px, local/avatar/post sources, protected navigation and private/external-path denial |

One verification Composer request hit a Packagist connection timeout; an explicit retry succeeded with zero findings. The first image smoke attempt preceded Next readiness and failed its initial fetch; all 26 checks passed after startup completed. The image harness maps public upload paths to an explicit container-reachable alias for optimizer requests while testing Laravel's original public URLs separately; it is not a browser deployment-origin test. PHPUnit runs network-disabled with SQLite memory, read-only source and a masked environment. HTTP suites use only the disposable `elevateu-audit` project and separate storage. All disposable containers, volumes and their network were removed after verification. No normal development database reset/migration or fixture creation occurred.

Private media checks assert exact participant bytes, safe privacy/MIME headers, guest/outsider denial, blocked public message URLs, and removed-member denial on fresh downloads/subscriptions. Browser visual interactions, live OAuth/mail, production TLS/proxy behavior, concurrency races and OS scanning remain unverified. Type checks still exclude JS (`checkJs=false`); no PHPStan/Psalm was added. Deprecated tools remain visible.

Reproduction commands, in the appropriate project directory:

```text
npm ci
npm audit --json
npm audit --omit=dev --json
composer install --no-scripts --no-plugins --no-interaction --prefer-dist
composer validate --strict --no-check-publish --no-plugins --no-scripts
composer audit --locked --format=json --no-plugins --no-scripts
composer audit --locked --no-dev --format=json --no-plugins --no-scripts
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for isolated tests. Existing deployments should rebuild images, consume lockfiles, clear stale application caches through the deployment process and restart API/queue/Reverb together. Do not rotate keys or reset data as an upgrade shortcut. These package changes need no new application migration.

## Day 4 database follow-up — 2026-09-20

Day 4 implements the database preflight/fixtures and verifies a synthetic 8.0.46 → 8.4.11 logical restore. Disposable Compose now pins 8.4.11; normal Compose deliberately retains 8.0.46 until an explicit persistent-data cutover. The Day 3 tables above remain historical results. See [DATABASE.md](DATABASE.md) for exact compatibility evidence, the Oracle 8.4.12 image-only update versus Docker Library packaging distinction, constraint plans and remaining promotion gates. No application dependency changes were needed for 8.4 compatibility. Upcoming Next/PHP support deadlines, secret rotation, legacy-media rollout and active-socket revocation remain release gates. Day 5 should address safe constraints and concurrent conflict recovery; it has not started.

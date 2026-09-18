# Dependency security review

Reviewed 2026-09-18. These are dependency inventory findings, not a claim that every advisory is exploitable through an application route. npm counts vulnerable package entries (including inherited findings); Composer counts advisory records. The totals are not directly comparable.

## Frontend

The controlled direct updates pin Next.js and eslint-config-next to `15.5.25`, Axios to `1.20.0`, js-cookie to `3.0.8`, and the direct PostCSS development dependency to `8.5.28`. No Next.js 16 or React major migration is included.

After these changes, `npm audit --json` reports **19** vulnerable package entries: **0 critical, 14 high, 4 moderate, 1 low**, down from **26** (**2 critical, 19 high, 4 moderate, 1 low**). `npm audit --omit=dev --json` reports **11**: **0 critical, 7 high, 3 moderate, 1 low**, down from **16** (**2 critical, 10 high, 3 moderate, 1 low**).

| Classification | Packages / evidence | Follow-up |
| --- | --- | --- |
| Direct runtime, high; HTTP optimizer disabled as mitigation | `sharp@0.33.5`; native image parsing previously reachable through Next.js image optimization | npm proposes `0.35.4`, outside the current `^0.33.5` range. Review the 0.x compatibility change and test image uploads, image optimization and the production container before reenabling optimization. |
| Direct package with inherited finding | `next@15.5.25` is reported moderate because its nested PostCSS remains affected | npm proposes Next.js `16.3.5`, a major upgrade. Treat this as a separate framework migration; updating the root PostCSS does not replace Next's nested copy. |
| Transitive runtime | `@babel/runtime` through Flowbite / tailwind-merge | Compatible update is available according to npm audit; use a targeted lockfile update and verify affected UI. |
| Transitive build dependencies retained by production installation | `brace-expansion`, `cross-spawn`, `glob`, `minimatch`, `picomatch`, `postcss-selector-parser`, `yaml`; Flowbite declares a Tailwind peer dependency | These still appear with `--omit=dev`. Trace build/CLI reachability separately from browser or HTTP exposure. Compatible fixes are available according to npm audit. |
| Transitive PostCSS inside Next.js | `node_modules/next/node_modules/postcss`, high | Untrusted CSS/source maps can reach filesystem reads during processing. No application route accepting user CSS was identified. Trusted builds remain a relevant boundary. |
| Development-only findings | `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `@typescript-eslint/type-utils`, `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils`, `ajv`, `flatted`, `js-yaml` | Eight package findings disappear with `--omit=dev`. Apply compatible toolchain updates in a separate controlled batch and rerun lint/type checking. |

The sharp issue must not be dismissed as development-only: the project uses `next/image` with upload storage allowed by `next.config.js`. The [sharp maintainer advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c) identifies untrusted image processing in versions before `0.35.4` as affected. As a compensating control, `images.unoptimized: true` now serves original media. Inspection of the installed Next.js `15.5.25` confirms `dist/server/next-server.js` rejects the optimizer route with `render404` before parameter validation/image processing when this flag is true, and `dist/shared/lib/get-img-props.js` returns the original source without an optimizer `srcSet`. This reduces the identified runtime exposure but does not patch sharp or remove its audit entry; original images may use more bandwidth. A newly built/restarted frontend is required to activate the configuration. The [PostCSS maintainer advisory](https://github.com/postcss/postcss/security/advisories/GHSA-6g55-p6wh-862q) explains the attacker-controlled CSS/source-map condition.

Do not run `npm audit fix --force`; its proposed framework and native-image upgrades cross the reviewed dependency ranges.

## Backend

The original lockfile reported **58 advisory records across 18 packages**: **1 critical, 17 high, 30 medium, 7 low, 3 unrated**. Of these, four records were development-only: PHPUnit (one high) and Symfony YAML (three low). The runtime graph contained the other 54 records across 16 packages.

The updated lockfile audit reports **4 advisory records across 2 packages**: **0 critical, 1 high, 1 medium, 1 low, 1 unrated**. The residual records are described below, including the duplicate email advisory. They are not suppressed.

The update uses an explicit package allow-list and Composer's `--minimal-changes` resolver. `composer.json` version constraints are unchanged. The resolved plan changes 33 locked versions and adds one PHPUnit dependency (`staabm/side-effects-detector`); it does not remove packages.

| Package group | Before | Updated |
| --- | --- | --- |
| Laravel framework, direct runtime | `11.27.2` | `11.56.1` |
| Laravel Reverb, direct runtime | `1.4.1` | `1.11.1` |
| Guzzle / PSR-7, transitive runtime | `7.9.2` / `2.7.0` | `7.15.5` / `2.13.1` |
| CommonMark, transitive runtime | `2.5.3` | `2.10.1` |
| Carbon, transitive runtime | `3.8.0` | `3.14.0` |
| sodium_compat / phpseclib, transitive runtime | `1.21.1` / `3.0.42` | `1.24.2` / `3.0.57` |
| Symfony HTTP foundation, mailer, MIME, process | `7.1.5` | `7.4.19` |
| Symfony routing | `7.1.4` | `7.4.18` |
| Symfony intl-idn polyfill | `1.31.0` | `1.42.0` |
| PsySH, transitive of runtime Tinker | `0.12.4` | `0.12.24` |
| PHPUnit, direct development | `11.4.1` | `11.5.56` |
| Symfony YAML, transitive development | `7.1.5` | `7.4.18` |

Reverb's critical deserialization issue requires Redis horizontal scaling; the repository defaults scaling to false. The package is still patched because environment configuration can enable that path. The [maintainer advisory](https://github.com/laravel/reverb/security/advisories/GHSA-m27r-m6rx-mhm4) identifies `1.7.0` as the fix. Other conditional cases include CommonMark extensions, Carbon locale selection, phpseclib cryptographic operations, Symfony Sendmail transport, and Windows-specific Symfony Process behavior. Absence of a direct application call is evidence about reachability, not grounds to hide a vulnerable runtime dependency.

### Retained incompatible fixes

| Package / advisory | Classification | Reason retained and required follow-up |
| --- | --- | --- |
| Laravel: `PKSA-3r5d-mb8f-1qw9` and `PKSA-mdq4-51ck-6kdq` | One high and one unrated record for the same default email-rule CRLF issue | Fixed in Laravel `12.60.0` / `13.10.0`, outside `^11.9`. Auth email validation now explicitly rejects ASCII control characters, and Symfony Mailer/MIME are patched. Complete a Laravel major migration before calling the dependency issue resolved. |
| Laravel: `PKSA-m5cs-t1y6-qpcs` | Medium, temporary signed local-filesystem URL confusion | Fixed in Laravel `12.61.1` / `13.12.0`, outside `^11.9`. Unused local signed serving is now disabled (`serve: false`); no application temporary URL generation was found. Do not introduce temporary signed upload/download URLs before upgrading. |
| firebase/php-jwt: `PKSA-y2cr-5h3j-g3ys` | Low, transitive runtime | Fix requires `7.0.0`; the locked Passport and Socialite dependencies require `^6.4`. Review their compatibility and key validation before a coordinated upgrade. No direct application use of Firebase JWT was found. |

Laravel's [email advisory](https://github.com/laravel/framework/security/advisories/GHSA-5vg9-5847-vvmq) concerns applications sending mail to user-supplied addresses, including password-reset flows. Its [signed URL advisory](https://github.com/laravel/framework/security/advisories/GHSA-crmm-hgp2-wgrp) concerns ambiguous local filesystem temporary URLs. See the [JWT 7.0.0 release](https://github.com/googleapis/php-jwt/releases/tag/v7.0.0) for the incompatible key-validation changes.

### Controlled update and verification

The update first passed a dry run. Composer's normal resolver refused every allowed Laravel 11 release because the newer Laravel advisories also affect that branch. A **one-command `--no-blocking` exception** allowed retaining those existing, documented risks while resolving the other fixes. No audit ignore entries, global configuration changes, or permanent blocking override were added. The final audit remains visible; this exception is not a recommended default for future updates.

The exact update command was run from the repository root in PowerShell. Only the disposable audit application and nginx containers were stopped before changing vendor files; the MySQL container remained running. The helper used Docker's bridge network rather than the audit database network, and bypassed the application entrypoint. Composer scripts/plugins were disabled, so the operation did not load the application environment, generate keys, or run database commands.

```powershell
docker run --rm --name elevateu-dependency-update --network bridge --mount 'type=bind,source=C:/Users/biniy/Documents/GitHub/ElevateU/server,target=/app' -w /app --entrypoint composer server-laravel-app:latest update laravel/framework laravel/reverb guzzlehttp/guzzle guzzlehttp/psr7 league/commonmark nesbot/carbon paragonie/sodium_compat phpseclib/phpseclib phpunit/phpunit psy/psysh symfony/http-foundation symfony/mailer symfony/mime symfony/polyfill-intl-idn symfony/process symfony/routing symfony/yaml --with-all-dependencies --minimal-changes --no-blocking --no-scripts --no-plugins --no-interaction --no-progress
```

Reproduction commands, in their respective application directories:

```text
npm audit --json
npm audit --omit=dev --json
composer audit --locked --format=json --no-plugins --no-scripts
composer audit --locked --no-dev --format=json --no-plugins --no-scripts
composer validate --strict --no-check-publish --no-plugins --no-scripts
```

Application regressions must additionally cover authentication/Passport, password-reset mail, upload validation, private attachment authorization, and broadcasting after the audit application containers are restarted. Audit and dependency validation alone do not exercise those behaviors.

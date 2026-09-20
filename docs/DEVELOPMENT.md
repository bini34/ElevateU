# Local development and verification

Day 5 adds three constraint migrations. Read [DATABASE.md](DATABASE.md) before starting current application code against an existing database: stop writers, run preflight, review dirty data, then migrate before reloading new readers. Never reset the persistent database. Disposable rehearsals now pass 67 backend tests / 560 assertions, 14 MySQL invariant checks and 12 deterministic races per run. Run MySQL scripts only on the isolated audit stack; use `www-data` for Artisan/fixture commands. [SECURITY.md](SECURITY.md) records the exact fresh/upgrade/restore and live regression results. No persistent cutover has been performed.

Use Node.js **22.23.2** (root `.nvmrc`) and Docker Desktop with Linux containers. The client engine range is `^22.23.2`; Node 20 is EOL and is no longer the baseline. PHP/Composer can run in Linux containers. Install locked dependencies, not updates, when reproducing the current state. See [AUDIT.md](AUDIT.md) for the historical assessment, [SECURITY.md](SECURITY.md) for verification and rollout requirements, and [DEPENDENCIES.md](DEPENDENCIES.md) for the current advisory inventory.

## Runtime baseline

| Component | Pinned baseline | Maintenance constraint |
| --- | --- | --- |
| Node | 22.23.2 / Alpine 3.24 | Supported Node 22 LTS; `.nvmrc` and the client manifest describe local use |
| PHP | 8.2.33 FPM / Debian Bookworm | Security support ends December 31, 2026; schedule a tested minor upgrade |
| Composer | 2.10.3 | Binary copied from the pinned official image |
| nginx | 1.30.5 / Debian Trixie | Stable branch; same pin in normal and disposable Compose |
| MySQL | 8.4.11 disposable; 8.0.46 existing development | 8.4 LTS compatibility/restore verified; explicit persistent cutover and image patch review still required |

Dockerfiles and Compose use exact multi-platform image digests as well as version tags. Update the tag and digest together after reviewing releases and rerunning checks; a version pin does not receive patches automatically. apt package resolution still uses the current Debian repositories, so these builds are not fully reproducible OS snapshots. See the official [Node schedule](https://nodejs.org/en/about/previous-releases), [PHP support table](https://www.php.net/supported-versions.php) and [MySQL 8.0 EOL notice](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/). No normal development database was upgraded during Day 3.

## Environment files

Copy examples only when the local file is absent. Never overwrite someone else's working credentials. `server/.env` and client local environments are ignored; Day 3 stages removal of the still-tracked server environment without deleting or changing the local file. Values previously in Git require rotation/history review separately.

For PowerShell, from the repository root:

```powershell
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
if (-not (Test-Path client/.env.local)) { Copy-Item client/.env.example client/.env.local }
```

The server example defaults to SQLite and log broadcasting. **For the documented Docker/MySQL stack, explicitly set** `DB_CONNECTION=mysql`, `DB_HOST=mysql`, `DB_PORT=3306`, `DB_DATABASE=ElevateU-DB`, `DB_USERNAME=root`, and `DB_PASSWORD` to your local database password. Set `BROADCAST_CONNECTION=reverb` and populate Reverb's app ID/key/secret before testing realtime. The development Compose database default is retained for compatibility; it is not a production credential policy. Existing MySQL volumes retain their initialized credentials even if `.env` changes.

| Setting | Meaning |
| --- | --- |
| Server `APP_URL` | Public API origin, normally `http://localhost:8080`; generates storage URLs |
| `FRONTEND_URL` | Client origin, normally `http://localhost:3000`; reset-link destination |
| `CORS_ALLOWED_ORIGINS` | Comma-separated URL origins; template scopes to local client |
| `APP_KEY` | Laravel encryption key; generate once per environment, preserve securely |
| `PASSPORT_PERSONAL_ACCESS_CLIENT_ID/SECRET` | Personal client provisioning; keep server-side |
| `REVERB_APP_ID/KEY/SECRET` | Server application credentials; only app key is public |
| `REVERB_HOST/PORT/SCHEME` | Server's broadcast publishing endpoint; local single-container setup uses localhost/6001/http |
| `REVERB_SERVER_HOST/PORT` | Reverb listen settings outside Supervisor; Supervisor currently fixes 0.0.0.0:6001 |
| `REVERB_ALLOWED_ORIGINS` | Comma-separated hostnames, without URL scheme; template uses localhost,127.0.0.1 |
| `QUEUE_CONNECTION` | Database worker handles queued notification broadcasts |
| `CACHE_STORE` | Use a persistent shared store for rate limits; the disposable integration stack uses `database` |
| `MAIL_MAILER` | `log` for local recovery tests; configure a real provider for actual delivery |
| Client `NEXT_PUBLIC_BACKEND_URL` | Browser API base including `/api` |
| Client `ELEVATEU_UNOPTIMIZED_IMAGES` | Optional config-time original-image fallback; only the separate local client Compose defaults it to `true` |
| Client `NEXT_PUBLIC_REVERB_APP_KEY` | Must match server's public Reverb app key |
| Client `NEXT_PUBLIC_REVERB_HOST/PORT/SCHEME` | Browser-visible WebSocket endpoint |

`NEXT_PUBLIC_*` values are public and embedded at build time. Changing runtime environment alone will not change an already-built client. Never place secrets in these variables.

The image optimizer derives its public-upload allowlist from `NEXT_PUBLIC_BACKEND_URL`; the API origin must agree with Laravel's `APP_URL` storage URLs. In production, that origin must be reachable from both browsers and the Next server. Image flags and allowlists are Next configuration, so rebuild/restart after changing them.

## API stack

From `server/`, after configuring `.env`:

```powershell
docker compose build laravel-app
# The bind mount hides the image's vendor directory. Install dev dependencies
# into server/vendor before starting PHP-FPM/Reverb/the worker on a fresh clone.
docker compose run --rm --no-deps --entrypoint composer laravel-app install --no-interaction
docker compose run --rm --no-deps --entrypoint php laravel-app artisan key:generate
docker compose up -d
docker compose exec laravel-app php artisan migrate
docker compose exec laravel-app php artisan passport:keys
docker compose exec laravel-app php artisan passport:client --personal
docker compose exec laravel-app php artisan storage:link
docker compose exec laravel-app supervisorctl status
```

Key generation and personal-client provisioning are first-time operations; do not rotate keys on every startup. If configured client ID/secret variables are used, copy the generated values into the local environment and restart workers. `storage:link` may already exist because startup creates it.

nginx exposes `127.0.0.1:8080`; Reverb `127.0.0.1:6001`; MySQL `127.0.0.1:3307`. PHP-FPM stays on the internal Docker network. This stack has persistent development data. Do not run `migrate:fresh`, broad user-deletion SQL, or volume removal against it. Use the separate guarded [demo fixture workflow](DATABASE.md#factories-and-demo-fixtures); it intentionally refuses this database's normal name. Default seeding creates no data.

### Existing message uploads

New message files go to `storage/app/private/messages` and are fetched through the authenticated attachment endpoint. Persist this private directory as well as public uploads. Deploy the nginx configuration denying `/storage/uploads/messages/` and `/uploads/messages/` before exposing old uploads. Apache has equivalent rules in `public/.htaccess`, but its deployment has not been exercised here.

Inventory the persistent environment from `server/` without changing its files:

```powershell
docker compose exec laravel-app php artisan media:privatize-messages
```

Review the inventory and back up storage. Once public serving is blocked, the deliberate migration command is:

```powershell
docker compose exec laravel-app php artisan media:privatize-messages --apply
```

The command copies each file into private storage, verifies SHA-256 and only then removes its public source. Conflicts and unexpected paths stop the migration; rerunning is supported and database paths are unchanged. Run the inventory again and verify authorized/unauthorized downloads afterward. This operation has only been tested with isolated fixtures; it has **not** been applied to normal development data. Do not serve legacy copies through `php artisan serve` or another static server before migrating them. Authenticated fallback reads do not protect a separately public file, and already cached/downloaded copies cannot be recalled.

## Client

From `client/`:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The alternative client Compose file uses the local environment and a dependency volume. Verify API/Reverb public values before building either client image.

Google/Facebook sign-in is intentionally unavailable: redirect/callback routes return 503 until a complete safe OAuth flow is implemented. Password authentication continues to use Passport bearer tokens.

Day 3 restores image optimization with patched sharp `0.35.4`. The public allowlist covers avatar, post and group upload directories on the configured API origin, plus the retained Facebook static origin; SVG optimization remains disabled. Local raster assets and public images use Next Image's responsive candidates. Private message attachments continue using bearer-authenticated downloads and browser blobs; do not pass them to the optimizer or broaden its allowlist to private endpoints.

When the client runs on the host, `http://localhost:8080/api` is reachable by both the browser and the optimizer. In the separate development client container, `localhost` means that container, so its Compose file explicitly defaults `ELEVATEU_UNOPTIMIZED_IMAGES=true` to serve original public images. This is a local network workaround, not a retained sharp vulnerability. To exercise optimization in that configuration, set `NEXT_PUBLIC_BACKEND_URL` to an origin reachable by both browser and container, set the corresponding server `APP_URL`, and override `ELEVATEU_UNOPTIMIZED_IMAGES=false` before starting the client. Do not use a Docker-only service hostname as a browser API URL. Host development and production builds default to optimization enabled.

The production Dockerfile accepts public build arguments. Supply the real reachable API/storage origin before building; its default localhost value is only useful when the runtime can actually reach that origin. The standalone image runs `node server.js` as a non-root user. Changing `NEXT_PUBLIC_BACKEND_URL` only when starting an already-built container does not change its embedded API URL or image allowlist.

## Verification

From `client/`:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
npm audit --omit=dev
```

The server's Vite scaffold has a separate npm lockfile. From `server/`, use the same Node baseline and run `npm ci`, `npm run build`, `npm audit` and `npm audit --omit=dev`. It is not the Next frontend. Day 3 tested its Vite 6.4.3 build in an isolated Linux install; its dependencies are declared as development tooling.

Validate PHP dependency reproduction from `server/` after building the current runtime image:

```powershell
docker compose run --rm --no-deps --entrypoint composer laravel-app install --no-interaction --no-scripts --no-plugins
docker compose run --rm --no-deps --entrypoint composer laravel-app validate --strict --no-check-publish --no-plugins --no-scripts
docker compose run --rm --no-deps --entrypoint composer laravel-app audit --locked --no-plugins --no-scripts
docker compose run --rm --no-deps --entrypoint composer laravel-app audit --locked --no-dev --no-plugins --no-scripts
```

Run dependency installs while application workers using that vendor directory are stopped; do not replace their loaded dependency tree during requests. The validation commands do not provision keys or migrate the database. Normal first-time setup above separately runs package discovery through Composer's standard install scripts.

Type checking includes source files but does not type-check JavaScript (`checkJs=false`). Node tests cover selected helpers; they are not React/browser interaction tests. No connected browser was available in the audit session, so mobile and accessibility findings came from source review, not visual certification.

PHPUnit must use an isolated SQLite memory database and a separate runtime from the HTTP integration stack. `server/tests/TestCase.php` overrides process, `$_ENV` and `$_SERVER` values before boot, then checks the resolved database configuration before `RefreshDatabase` can run. XML values alone are insufficient when container environment values or cached configuration take precedence. The example below masks the real `.env`, prevents network access and mounts the source read-only; runtime writes go to disposable tmpfs storage/cache. Run PHP syntax lint and Pint's read-only mode as well; formatting failures must be reported, not mass-formatted or suppressed.

Example from the repository root after `server/vendor` exists (the test image requires `pdo_sqlite`):

```powershell
$auditServerPath = (Resolve-Path server).Path
$auditTestEnvPath = (Resolve-Path server/docker/test.env).Path
$auditTestImage = 'server-laravel-app:latest'
$auditRuntimeArgs = @(
    '--rm', '--network', 'none', '--entrypoint', 'sh',
    '--mount', "type=bind,source=$auditServerPath,target=/var/www/html,readonly",
    '--mount', "type=bind,source=$auditTestEnvPath,target=/var/www/html/.env,readonly",
    '--tmpfs', '/var/www/html/storage',
    '--tmpfs', '/var/www/html/bootstrap/cache',
    '--workdir', '/var/www/html'
)
docker run @auditRuntimeArgs $auditTestImage docker/phpunit-entrypoint.sh
docker run @auditRuntimeArgs $auditTestImage docker/check-php.sh
docker run @auditRuntimeArgs $auditTestImage -c 'php vendor/bin/pint --test'
```

`docker/phpunit-entrypoint.sh` creates temporary runtime directories and disables the PHPUnit result cache. The pinned PHP 8.2.33 image supplies `pdo_sqlite`; verify the extension again if changing the base image. Rebuild the application image from the current Dockerfile and lockfile before these checks rather than accidentally using an old cached `server-laravel-app:latest`. Never substitute an application service connected to a persistent database for this isolated test runtime. Keep MySQL integration tests separate to verify the deployed database engine; an SQLite pass does not prove MySQL migration/locking behavior.

Historically, Day 2 recorded 37 backend tests / 375 assertions and 14 frontend helper tests passing, plus lint, TypeScript and the Next production build. Day 3 reran the isolated backend suite successfully at 37 tests / 375 assertions on Laravel 12 and PHP 8.2.33; PHP syntax checks also passed. Frontend checks passed with 19 helper tests, lint, type checking and a production build, and both application Docker images built successfully. Clean npm/Composer installs reproduced the locks; full and production-only audits for both npm projects and Composer reported zero findings. Day 3 full Pint reported 49 legacy style failures. Day 4 passes 52 backend tests / 489 assertions and all 22 materially changed PHP files under scoped Pint; full Pint now retains 46 legacy failures because three rewritten fixture files are clean. Day 4 frontend lint/typecheck, 19 tests and the production build also pass. Current live integration results and remaining coverage limits are recorded in [SECURITY.md](SECURITY.md), separately from these dependency/build checks.

### Disposable HTTP/WebSocket integration stack

`server/docker-compose.test.yml` uses a separate `elevateu-audit` project, tmpfs MySQL **8.4.11** data, dedicated storage/public volumes, an environment-file overlay without development secrets, and explicit test-only credentials. It defaults to API port **18080** and WebSocket port **16001** on loopback. It cannot reuse the normal development MySQL volume. It mounts source/vendor read-only, so install dependencies first as described above. Database-backed caching exercises real rate-limit persistence across HTTP requests. Never deploy its fixed testing keys/passwords.

Override `ELEVATEU_TEST_API_PORT`, `ELEVATEU_TEST_WS_PORT` and `ELEVATEU_TEST_LOG_DIR` for multiple independent projects. `ELEVATEU_TEST_MYSQL_IMAGE` is only needed for the disposable 8.0 source rehearsal. Startup fails closed unless the testing database name/host and empty DB_URL match; Passport keys and an existing personal client survive an application restart. A MySQL container restart loses tmpfs data, even if media/key volumes survive. [DATABASE.md](DATABASE.md) documents the verified backup, restore, metadata/data checks and targeted MySQL tests.

From the repository root:

```powershell
# Ensure server-laravel-app:latest exists (or set ELEVATEU_TEST_SERVER_IMAGE).
docker compose -f server/docker-compose.yml build laravel-app
docker compose -p elevateu-audit -f server/docker-compose.test.yml up -d
docker compose -p elevateu-audit -f server/docker-compose.test.yml logs laravel-app
```

Wait for migration, personal-client provisioning, PHP-FPM, Reverb and the queue worker to finish starting. The API should return 401 for unauthenticated `/api/posts`. Then:

```powershell
$env:ELEVATEU_TEST_API_URL='http://127.0.0.1:18080/api'
$env:ELEVATEU_TEST_WS_HOST='127.0.0.1'
$env:ELEVATEU_TEST_WS_PORT='16001'
$env:REVERB_APP_KEY='elevateu-audit-public-key'
$env:ELEVATEU_TEST_LOG_PATH=(Join-Path (Get-Location) 'server/storage/logs/audit/laravel.log')
node scripts/feed-e2e.mjs
node scripts/chat-e2e.mjs
node scripts/profile-e2e.mjs
node scripts/notifications-e2e.mjs
```

Run suites sequentially: feed assertions depend on newest-item order. They create throwaway accounts and do not remove all fixture data. The profile suite reads the local test-only mail log; it does not contact a mail provider. `ELEVATEU_TEST_WS_SCHEME=https` enables TLS when a different test endpoint needs it. WebSocket suites require an explicit public app key. Shared HTTP helpers reject malformed JSON and default to a 60-second request timeout; `ELEVATEU_TEST_TIMEOUT_MS` accepts 1000 through 120000 milliseconds. The shared public-auth limit remains active: allow 60 seconds between suites on fast runs, honor a 429/Retry-After before retrying, and keep the limiter enabled. Check every script's exit code; PowerShell continuing to the next command does not mean the earlier script passed.

Do not concurrently run PHPUnit database resets against the HTTP stack. The audit caught environment precedence allowing an early PHPUnit run to reset its disposable MySQL database; isolation must be verified at the resolved Laravel configuration boundary, not assumed from XML alone.

### Standalone image smoke test

While the disposable API is running, build a frontend that can reach its public media. This Docker Desktop example deliberately uses `host.docker.internal` for optimizer fetches and leaves Laravel's test `APP_URL` at localhost for host-side assertions. The image script remaps only optimizer source origins, not raw public URLs; a real deployment must use an origin reachable by both browser and server.

```powershell
docker build --build-arg NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:18080/api --build-arg NEXT_PUBLIC_REVERB_APP_KEY=elevateu-audit-public-key --build-arg NEXT_PUBLIC_REVERB_HOST=localhost --build-arg NEXT_PUBLIC_REVERB_PORT=16001 -t elevateu-client:image-check client
docker run -d --name elevateu-image-check -p 127.0.0.1:13000:3000 --add-host host.docker.internal:host-gateway elevateu-client:image-check
docker logs elevateu-image-check
```

Wait for Next's ready message and confirm `/signin` returns 200 before starting the smoke suite. It creates a disposable user/avatar/post and expects optimization to be enabled. Run after the other suites, with `client/node_modules` installed:

```powershell
$env:ELEVATEU_TEST_API_URL='http://127.0.0.1:18080/api'
$env:ELEVATEU_TEST_CLIENT_URL='http://127.0.0.1:13000'
$env:ELEVATEU_TEST_IMAGE_ORIGIN='http://host.docker.internal:18080'
node scripts/images-e2e.mjs
docker rm -f elevateu-image-check
```

Day 3 passed 26 checks for page health/navigation, original bytes, WebP negotiation/full pixel decoding at two widths, public avatar/post/local images and private/external-path rejection. The API/private-media suite separately verifies attachment authorization. Responsive srcsets are checked by the client unit suite. These are HTTP/native-decoder checks, not browser visual/accessibility tests.

### Disposable cleanup

After testing, this command removes **only this disposable project's** containers/volumes; inspect the project name first:

```powershell
docker compose -p elevateu-audit -f server/docker-compose.test.yml ps
docker compose -p elevateu-audit -f server/docker-compose.test.yml down -v
```

Do not substitute the normal development Compose file into that cleanup command. Test mail logs under `server/storage/logs/audit` are ignored and may contain reset tokens; do not commit or publish them.

## Deployment status and concerns

The client Dockerfile builds Next standalone output and runs a non-root Node process. The server image installs production Composer dependencies and supervises PHP-FPM/Reverb/queue jobs. nginx is separate. The server retains root Supervisor/Reverb/queue processes and includes build libraries, Git and Composer; changing that model requires a separate permissions and packaging review. `.dockerignore` excludes private message storage as well as keys, environments and generated logs. These are building blocks, not a tested production platform; npm and Composer audits do not scan all OS packages.

Before deployment: rotate formerly tracked credentials, complete the legacy private-media rollout and move the EOL MySQL engine through a tested upgrade; configure production URLs, debug=false, scoped origins and trusted proxies; use private DB credentials/networking and TLS; persist uploads and Passport keys; provide real mail; monitor queue failures; validate environment at startup; rehearse migrations, backup restore and rollback. OAuth must remain disabled until its replacement is fully verified. The current bearer cookie remains JavaScript-readable; an HttpOnly session migration is deferred and requires CSRF/realtime design. Verify the optimizer can reach the intended public-media origin, maintain its narrow allowlist, and update native image dependencies and runtime digests intentionally. The Day 3 zero-advisory snapshot does not remove these deployment gates. No CI, hosting target or automated release workflow is currently provided.

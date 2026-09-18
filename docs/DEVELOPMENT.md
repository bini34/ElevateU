# Local development and verification

Use Node.js 20+ and Docker Desktop with Linux containers. The audit host used Node 22.18.0/npm 11.6.2; PHP/Composer ran in Linux containers. Install locked dependencies, not updates, when reproducing the current state. See [AUDIT.md](AUDIT.md) for the initial assessment, [SECURITY.md](SECURITY.md) for Day 2 verification and rollout requirements, and [DEPENDENCIES.md](DEPENDENCIES.md) for remaining advisories.

## Environment files

Copy examples only when the local file is absent. Never overwrite someone else's working credentials. `server/.env` and client local environments are ignored; the audit staged removal of the formerly tracked server environment without deleting the local file. Values previously in Git require rotation/history review separately.

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
| Client `NEXT_PUBLIC_REVERB_APP_KEY` | Must match server's public Reverb app key |
| Client `NEXT_PUBLIC_REVERB_HOST/PORT/SCHEME` | Browser-visible WebSocket endpoint |

`NEXT_PUBLIC_*` values are public and embedded at build time. Changing runtime environment alone will not change an already-built client. Never place secrets in these variables.

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

nginx exposes `127.0.0.1:8080`; Reverb `127.0.0.1:6001`; MySQL `127.0.0.1:3307`. PHP-FPM stays on the internal Docker network. This stack has persistent development data. Do not run `migrate:fresh`, broad user-deletion SQL, or volume removal against it. The existing seeder/factories are not a reliable demo-data contract.

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

Google/Facebook sign-in is intentionally unavailable: redirect/callback routes return 503 until a complete safe OAuth flow is implemented. Password authentication continues to use Passport bearer tokens. Image optimization is temporarily disabled in `next.config.js`; rebuild/restart the client to activate the mitigation. Images are served at their original size, so bandwidth can increase. Do not reenable optimization until the retained sharp advisory is fixed and the image path is retested.

## Verification

From `client/`:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

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

`docker/phpunit-entrypoint.sh` creates temporary runtime directories and disables the PHPUnit result cache. The normal API Dockerfile does not install SQLite explicitly; the audit's cached PHP 8.2 image had `pdo_sqlite`, but verify your image before use. Never substitute an application service connected to a persistent database for this isolated test runtime. Keep MySQL integration tests separate to verify the deployed database engine; an SQLite pass does not prove MySQL migration/locking behavior.

Day 2 recorded 37 backend tests / 375 assertions passing in this isolated runtime, including a run with external MySQL environment values to exercise the guard. Frontend helper tests passed 14/14, and lint, TypeScript and the Next production build passed. Full Pint still reports 49 style issues across existing files; that failure is retained rather than hidden. See the security report for integration results and limits of coverage.

### Disposable HTTP/WebSocket integration stack

`server/docker-compose.test.yml` uses a separate `elevateu-audit` project, tmpfs MySQL data, dedicated storage/public volumes, an environment-file overlay without development secrets, and explicit test-only credentials. It binds API port **18080** and WebSocket port **16001** on loopback. It cannot reuse the normal development MySQL volume. It mounts source/vendor read-only, so install dependencies first as described above. Database-backed caching exercises real rate-limit persistence across HTTP requests. Never deploy its fixed testing keys/passwords.

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

Run suites sequentially: feed assertions depend on newest-item order. They create throwaway accounts and do not remove all fixture data. The profile suite reads the local test-only mail log; it does not contact a mail provider. `ELEVATEU_TEST_WS_SCHEME=https` enables TLS when a different test endpoint needs it. WebSocket suites require an explicit public app key. Shared HTTP helpers reject malformed JSON and default to a 60-second request timeout; `ELEVATEU_TEST_TIMEOUT_MS` accepts 1000 through 120000 milliseconds. The shared public-auth limit remains active: honor a 429/Retry-After or let its one-minute window expire before rerunning a suite rather than disabling the limiter.

Do not concurrently run PHPUnit database resets against the HTTP stack. The audit caught environment precedence allowing an early PHPUnit run to reset its disposable MySQL database; isolation must be verified at the resolved Laravel configuration boundary, not assumed from XML alone.

After testing, this command removes **only this disposable project's** containers/volumes; inspect the project name first:

```powershell
docker compose -p elevateu-audit -f server/docker-compose.test.yml ps
docker compose -p elevateu-audit -f server/docker-compose.test.yml down -v
```

Do not substitute the normal development Compose file into that cleanup command. Test mail logs under `server/storage/logs/audit` are ignored and may contain reset tokens; do not commit or publish them.

## Deployment status and concerns

The client Dockerfile builds Next standalone output and runs a non-root Node process. The server image installs production Composer dependencies and supervises PHP-FPM/Reverb/queue jobs. nginx is separate. These are building blocks, not a tested production platform.

Before deployment: rotate formerly tracked credentials, complete the legacy private-media rollout and address remaining dependency advisories; configure production URLs, debug=false, scoped origins and trusted proxies; use private DB credentials/networking and TLS; persist uploads and Passport keys; provide real mail; monitor queue failures; validate environment at startup; rehearse migrations, backup restore and rollback. OAuth must remain disabled until its replacement is fully verified. The current bearer cookie remains JavaScript-readable; an HttpOnly session migration is deferred and requires CSRF/realtime design. Revisit the image allowlist and native image dependency before reenabling optimization. Pin and update runtime images intentionally. No CI, hosting target or automated release workflow is currently provided.

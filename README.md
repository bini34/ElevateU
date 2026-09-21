# ElevateU

ElevateU is being developed into a social accountability and personal-development platform. Its intended core is goals, measurable milestones, daily check-ins, consistency, and progress analytics. The current implementation provides supporting social infrastructure: posts, comments, likes, profiles, notifications, and direct/group messaging.

**Status:** under stabilization; not production-ready. Goal tracking and analytics are planned, not implemented. See the [audit and verification report](docs/AUDIT.md) for evidence and limitations, and the [30-iteration development plan](DEVELOPMENT_PLAN.md) for the implementation order.

| Layer | Existing stack |
| --- | --- |
| Frontend | Next.js 15 App Router, React 18, mostly JavaScript/JSX, Tailwind CSS 3 |
| API | Laravel 12 / PHP 8.2.33, Eloquent, Laravel Passport 12 bearer tokens |
| Database | MySQL 8.4 LTS target; 8.4.11 disposable tests, 8.0.46 retained for existing development data; UUID entities and versioned migrations |
| Realtime | Laravel Reverb, Laravel Echo, Pusher protocol |
| Local deployment | Docker Compose, nginx, PHP-FPM, Supervisor, database queue worker |

Exact lockfile versions and maintenance concerns are in [Architecture](docs/ARCHITECTURE.md). Day 3 retains Next 15/React 18, upgrades Laravel to its supported 12 branch, and restores allowlisted public image optimization with patched sharp. The npm and Composer audit snapshots have no reported findings; that does not make the application production-ready.

Day 4 adds a read-only database preflight, repaired factories and guarded deterministic demo fixtures. A disposable MySQL 8.0 → 8.4 logical restore is verified by row/file hashes and application checks. Day 5 adds profile, membership and canonical conversation uniqueness plus tested conflict recovery. Persistent-data deployment and deletion/retention rules remain explicit follow-up work; existing development data remains untouched.

Day 6 establishes semantic design tokens, reusable UI primitives, a responsive connected shell and a development-only `/design-system` preview. Streak/progress components are presentation only. Existing product pages adopt the outer shell; full page and authentication redesigns are future iterations.

## Documentation

- [Design system, responsive shell, component APIs and development preview](docs/DESIGN_SYSTEM.md)
- [Architecture and engineering conventions](docs/ARCHITECTURE.md)
- [Local development, environment, and deployment](docs/DEVELOPMENT.md)
- [API and realtime contracts](docs/API.md)
- [Database inventory, integrity checks, demo fixtures and verified restore workflow](docs/DATABASE.md)
- [Audit findings, changes, and verification results](docs/AUDIT.md)
- [Security decisions, verification and remaining deployment gates](docs/SECURITY.md)
- [Dependency advisories and controlled upgrades](docs/DEPENDENCIES.md)
- [30-iteration development plan](DEVELOPMENT_PLAN.md)

## Local startup

Prerequisites: Node.js 22.23.2 (see `.nvmrc`) and Docker Desktop with Linux containers. PHP and Composer can run inside the pinned Docker image. Use lockfiles (`npm ci`, `composer install`) for reproduction. MySQL 8.0 is EOL; the normal stack retains it until an explicit persistent-data cutover using the [rehearsed upgrade procedure](docs/DATABASE.md).

1. Copy `server/.env.example` to `server/.env` only if a local file does not already exist. Configure local database and Reverb settings.
2. Follow the [first-time API provisioning steps](docs/DEVELOPMENT.md#api-stack). Existing data must not be reset.
3. Copy `client/.env.example` to `client/.env.local` only if absent, then run `npm ci` and `npm run dev` from `client/`.
4. Open `http://localhost:3000`. Default development API: `http://localhost:8080/api`; WebSocket port: `6001`.

Public image optimization requires the API/storage origin to be reachable from both the browser and Next runtime. When the client runs in Docker, follow the [image-origin configuration notes](docs/DEVELOPMENT.md#client); `localhost` inside that container refers to the client itself. Private chat attachments continue using authenticated downloads.

The previous `server/.env` was tracked. The audit removes it from Git tracking while retaining the local file. Rotate credentials that appeared in it; removing the current file does not erase Git history. Fresh clones must configure their own environment.

## Checks

From `client/`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Backend checks and the four HTTP/WebSocket integration suites are documented in [Development](docs/DEVELOPMENT.md#verification). Integration scripts create accounts and content; use the isolated test stack. Those four suites are API tests; Day 6 adds separate optional [browser UI suites](docs/DESIGN_SYSTEM.md#development-preview-and-verification). Never clean up by deleting every user with an `@example.com` address.

## License

MIT. See [LICENSE.txt](LICENSE.txt).

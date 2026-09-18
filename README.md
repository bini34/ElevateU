# ElevateU

ElevateU is being developed into a social accountability and personal-development platform. Its intended core is goals, measurable milestones, daily check-ins, consistency, and progress analytics. The current implementation provides supporting social infrastructure: posts, comments, likes, profiles, notifications, and direct/group messaging.

**Status:** under stabilization; not production-ready. Goal tracking and analytics are planned, not implemented. See the [audit and verification report](docs/AUDIT.md) for evidence and limitations, and the [30-iteration development plan](DEVELOPMENT_PLAN.md) for the implementation order.

| Layer | Existing stack |
| --- | --- |
| Frontend | Next.js 15 App Router, React 18, mostly JavaScript/JSX, Tailwind CSS 3 |
| API | Laravel 11 / PHP 8.2+, Eloquent, Laravel Passport bearer tokens |
| Database | MySQL 8, UUID application entities, versioned migrations |
| Realtime | Laravel Reverb, Laravel Echo, Pusher protocol |
| Local deployment | Docker Compose, nginx, PHP-FPM, Supervisor, database queue worker |

Exact lockfile versions and maintenance concerns are in [Architecture](docs/ARCHITECTURE.md). This audit retains the stack and avoids a broad rewrite.

## Documentation

- [Architecture and engineering conventions](docs/ARCHITECTURE.md)
- [Local development, environment, and deployment](docs/DEVELOPMENT.md)
- [API and realtime contracts](docs/API.md)
- [Audit findings, changes, and verification results](docs/AUDIT.md)
- [Day 2 security decisions and verification](docs/SECURITY.md)
- [Dependency advisories and controlled upgrades](docs/DEPENDENCIES.md)
- [30-iteration development plan](DEVELOPMENT_PLAN.md)

## Local startup

Prerequisites: Node.js 20+ and Docker Desktop with Linux containers. PHP and Composer can run inside Docker. Use lockfiles (`npm ci`, `composer install`) for reproduction.

1. Copy `server/.env.example` to `server/.env` only if a local file does not already exist. Configure local database and Reverb settings.
2. Follow the [first-time API provisioning steps](docs/DEVELOPMENT.md#api-stack). Existing data must not be reset.
3. Copy `client/.env.example` to `client/.env.local` only if absent, then run `npm ci` and `npm run dev` from `client/`.
4. Open `http://localhost:3000`. Default development API: `http://localhost:8080/api`; WebSocket port: `6001`.

The previous `server/.env` was tracked. The audit removes it from Git tracking while retaining the local file. Rotate credentials that appeared in it; removing the current file does not erase Git history. Fresh clones must configure their own environment.

## Checks

From `client/`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

Backend checks and the four HTTP/WebSocket integration suites are documented in [Development](docs/DEVELOPMENT.md#verification). Integration scripts create accounts and content; use the isolated test stack. They are API integration tests, not browser tests. Never clean up by deleting every user with an `@example.com` address.

## License

MIT. See [LICENSE.txt](LICENSE.txt).

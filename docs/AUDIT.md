# Repository audit and stabilization record

Initial audit started 2026-09-17; Day 2 security work began 2026-09-18 before the initial verification report was finalized. This file records the baseline, not a claim that Day 1 was fully completed before Day 2. See [SECURITY.md](SECURITY.md) for the current security decisions and final verification.

## Scope and assessment

Reviewed repository routes, frontend pages/components/hooks/contexts, backend controllers/services/repositories/models/requests/events, all migrations/factories/seeders, environment variable names, dependency locks, Docker/nginx/Supervisor configuration and existing scripts/tests. No AGENTS.md was found in the repository or checked parent paths. Local credentials were not printed. Existing development data was not migrated or reset.

The current stack is worth preserving: Next 15/React 18, Laravel 11/Passport, MySQL and Reverb. It contains working social infrastructure but no goal/milestone/check-in/streak/challenge/analytics domain. The [architecture](ARCHITECTURE.md) documents the discovered structure, and the [development plan](../DEVELOPMENT_PLAN.md) orders 30 controlled iterations around the accountability product direction.

## Confirmed findings

| Area | Finding and evidence | Disposition |
| --- | --- | --- |
| Secrets | server/.env was Git-tracked | Removed from index, retained locally; rotation/history review required |
| Group authorization | GroupController/GroupService accepted any authenticated user's management requests; update trusted mutable owner fields | Owner/member checks and field allowlists added |
| Runtime | FileAttachmentRepository filename capitalization mismatched class; Profile used auto-increment metadata for UUID; GroupUser expected nonexistent id | Corrected without schema changes |
| Uploads | Original filename suffix and client MIME used; nginx executed arbitrary PHP paths | Server-detected metadata and front-controller-only PHP added |
| Group persistence | Group photo absent from fillable; last-message preview not updated | Corrected transactionally where applicable |
| API pagination | Negative/zero/non-integer page sizes not rejected | Shared controller validation added |
| Frontend auth | Duplicate fetch transport had different error semantics; delayed failed logout could clear a new token | Shared Axios transport and stale-session guards |
| Realtime | Echo failed to initialize after session hydration/login; two presence consumers could disconnect one another | Token-reactive hook, singleton manager and shared subscription lifecycle |
| Notifications | Prior-account state survived logout; mutations appeared successful before server confirmation | Account-scoped state/async responses, visible errors and confirmed read mutations |
| UI runtime | Outgoing uploaded avatar lacked required Next Image dimensions; duplicate chat loading files | Fixed; duplicate file removed |
| Incomplete UI | Search controls lacked behavior; required signup Remember checkbox did nothing | Explicitly unavailable controls / removed misleading checkbox; no redesign |
| Dead code | Unreferenced auth hooks, empty helpers/controllers/requests and fake voice/URL media components | Confirmed references removed; no broad architecture cleanup |
| Private media | Chat attachment files lived on public disk despite private message authorization | Day 2 adds private storage, authorized delivery, static denial and a verified migration command; existing deployment rollout remains required |
| OAuth | Stateless callback, email-only linking and no complete client handoff | Day 2 explicitly disables incomplete supported-provider flows; safe reenable plan documented |
| Database | Missing unique profile/member/conversation constraints; OAuth/session BIGINT user-ID mismatch; orphan-prone nullable relationships | Deferred to safe migrations and data preflight |
| Fixtures | Empty factories, conversation factory loop with insufficient users, mismatched seeded message participants | Unresolved; do not treat seeder as valid demo data |
| API architecture | Mixed envelopes/status conventions; singular/plural routes; direct Eloquent in some controllers | Document current contracts; incremental adoption |
| Concurrency | Sequential message retry works, concurrent uniqueness exceptions and pair creation not fully handled; broadcast may fail after commit | Unresolved reliability work |
| Performance | Unbounded conversation list; offset-page drift; duplicated custom fetches and large post/chat components; media costs | Measure before optimizing |
| Accessibility | Incomplete modal focus/Escape, weak focus styling/contrast, icon labels, fixed/nested scrolling and mobile settings layout | Selected labels corrected; full browser/keyboard/mobile audit still required |
| Type/test coverage | Mostly JSX with checkJs off; no PHP static analyzer; minimal tests/CI | Targeted regression tests and explicit commands added; broad gaps remain |
| Deployment | Literal backslash-n shell startup bug; failures swallowed; public FPM/DB bindings; host bind hides vendor | Startup repaired, loopback bindings, FPM internal, docs corrected |
| Dependencies | Old Next/Laravel/Reverb and transitive dependencies with advisories | Day 2 controlled maintenance and remaining-risk report |

## Verification results

Before Day 2 changes, frontend lint and TypeScript checks passed; 9 new Node tests passed; the modified Next build compiled and generated 16 pages. A final repeat was interrupted during tracing, so no claim is made about that repeat's completion. Server Vite production build passed in disposable Node 20 Linux (58 modules). Three Compose configuration checks, nginx syntax and shell entrypoint syntax passed. Composer manifest validation passed. All 23 application migrations applied on a fresh isolated MySQL 8 database.

The first feed integration run passed early assertions before concurrent PHPUnit execution reset the disposable MySQL fixture database, causing 401 failures and an eventual missing-ID crash. This was a test-isolation failure, not a valid passing integration run. PHPUnit's initial 15-pass/88-assertion result is likewise not accepted as a safely isolated result. Laravel's environment sources can override PHPUnit XML; TestCase now sets all environment sources and checks resolved SQLite memory configuration before RefreshDatabase. Final security tests run in a separate network-disabled runtime. The normal development database was not involved. All four integration suites subsequently passed; final counts are in [SECURITY.md](SECURITY.md#dependencies-and-verification).

Initial production npm audit: 16 dependency findings (2 critical, 10 high, 3 moderate, 1 low). Initial Composer audit: 58 advisory records across 18 packages, including development/transitive dependencies; advisory records may duplicate sources. Neither audit passed. Exact current results and applied patches are recorded in [SECURITY.md](SECURITY.md).

Browser setup returned no connected browsers. UI responsiveness/accessibility findings are source-based; no visual, screen-reader or keyboard certification is claimed. No external OAuth provider, real mail delivery, production host, backup/restore or production-scale load test was verified.

## Significant changes and remaining work

Changes center on server group/upload/pagination services/controllers, UUID/pivot metadata, frontend auth/realtime/notifications helpers, focused regression tests, local environment/Docker configuration, integration harness configuration and repository documentation. Existing working stack and endpoint conventions remain. No major product features or schema rewrites were introduced.

Before production: rotate exposed credentials; resolve vulnerable/unsupported dependency lines; complete legacy private-media rollout; keep OAuth disabled until verified; implement active-socket revocation; introduce safe database constraints; test real browser journeys and production operations. Day 2 delivered the bounded security changes in [SECURITY.md](SECURITY.md). Day 3 should follow that risk assessment rather than begin automatically.

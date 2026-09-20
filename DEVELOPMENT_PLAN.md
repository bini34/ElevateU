# ElevateU development plan

Baseline: 2026-09-17 audit/stabilization, Day 2 security hardening on 2026-09-18, Day 3 dependency/runtime hardening on 2026-09-19, and Day 4 database integrity/upgrade rehearsal completed on 2026-09-20. The 30 iterations below include those first four days; they are ordered development slices, not promises of equal duration. Reassess scope after each acceptance gate. No major product features were added in these iterations.

Day 2 implemented transactional authentication/revocation, authorization coverage, private attachments, OAuth shutdown and rate limits. Day 3 moved to Laravel 12, cleared reported npm/Composer advisories, restored allowlisted image optimization and pinned runtimes. Day 4 adds 46 read-only integrity checks, valid factories, guarded deterministic demo data and a verified synthetic MySQL 8.0.46 → 8.4.11 logical restore. Both conversation and membership races are reproduced on MySQL and remain unresolved. No historical migrations or persistent data were changed. See [the database runbook](docs/DATABASE.md), [dependency review](docs/DEPENDENCIES.md) and [security report](docs/SECURITY.md). Day 5 has not started.

## 1. Current-state assessment

ElevateU has substantial social infrastructure on Next.js/React and Laravel/MySQL/Passport/Reverb. It has no persisted goals, milestones, check-ins, streaks, challenges or progress analytics. The product currently reads as a social network rather than an accountability tool.

The existing architecture is serviceable and should be improved incrementally. Strengths include separated frontend/backend projects, dependency lockfiles, Eloquent migrations, server-side feed ownership checks, transactions for several writes, pagination/eager loading, Passport token revocation, private channel checks, and real HTTP/WebSocket test scripts. Weaknesses include uneven layering, weak JavaScript type coverage, hand-maintained asynchronous state, incomplete authorization in the original group implementation, exposed environment history, outdated packages, and limited automated failure-path coverage.

The audit's exact changes, checks and limitations are in [docs/AUDIT.md](docs/AUDIT.md). Architecture and workflow are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## 2. Major technical debt

| Priority | Debt | Required outcome |
| --- | --- | --- |
| P0 | Tracked environment history and unsupported persistent MySQL runtime | Rotate credentials/review history; promote 8.4 only after image patch review, real-data preflight and explicit backed-up cutover; synthetic restore is verified |
| P0 | Legacy public message copies and incomplete OAuth | New files now private and OAuth disabled; complete the verified legacy rollout and design safe provider identities before reenabling |
| P1 | Group access checks previously absent | Regression coverage for owner/member/outsider and channel access, including removal |
| P1 | Schema missing uniqueness/target constraints | Use Day 4 preflight; review duplicate merges and deletion retention, then add safe constraints with migration/rollback evidence |
| P1 | Reproduced conversation/membership races; concurrent message retries and post-commit broadcasts | Canonical conversation pair and membership uniqueness plus conflict recovery; independently verify same-client-UUID contention and recoverable event delivery |
| P1 | API integration tests have stateful dependencies; thin component/unit coverage | Disposable deterministic fixtures, CI gates, failure diagnostics |
| P1 | Cached user state, notification races and repeated fetch logic | Explicit state ownership, cancellation and account-bound cache reset |
| P2 | Mixed controllers/services/repositories, dead generator scaffolding | Incremental deletion/extraction backed by references and behavior tests |
| P2 | Inconsistent API envelopes/routes/validation | Document compatibility first; migrate through tested adapters |
| P2 | Large post/editor/chat components and duplicated UI | Reusable presentation primitives with business logic in hooks/services |
| P2 | No operational deployment contract | Health, logs, backups, rollback, dependency and secret checks |

P0 blocks public deployment. P1 blocks reliable expansion of the affected flow. P2 is scheduled maintenance, not permission for a rewrite.

## 3. Proposed target architecture

Retain a modular Laravel application and a Next.js App Router client. Keep MySQL and Reverb. There is no demonstrated need for microservices, a new frontend framework, or a new database.

- Frontend: route composition -> feature hooks/state -> API helpers -> one transport. Reusable accessible components use the existing Tailwind styling approach. Adopt TypeScript incrementally at contracts and touched feature boundaries. Evaluate a query cache only after documenting current invalidation/reconnect behavior and measuring duplication.
- Backend: validated requests -> application services -> Eloquent/query helpers, with reusable authorization policies and explicit API Resources as each domain is touched. Transactions protect invariants; asynchronous effects have defined retry/idempotency behavior.
- Domains: Identity, Goals/Milestones, Progress/Check-ins, Accountability Communities/Challenges, Social Support, Notifications, and Analytics. Start as directories/modules within the current deployable application.
- Data: normalized goal/milestone/check-in records, user-defined visibility and timezone semantics, indexed progress queries, and derived streaks/analytics with reproducible definitions. These are proposals, not existing models or endpoints.
- Realtime: REST/database remain authoritative; events communicate changes and reconnection refetches reconcile state. Authorize both channel subscriptions and media access. Avoid delivering private information in public payloads.
- Delivery: isolated MySQL integration environment, frontend tests, accessible browser workflows, dependency checks, reproducible container builds and deployment/runbook checks in CI.

API names, database columns and analytics formulas should be agreed and tested in their implementation iterations; no speculative APIs are presented as implemented.

## 4. Existing feature coverage

| Feature | Current implementation and evidence boundary |
| --- | --- |
| Register/login/logout | Password routes, Passport tokens, profile creation and revocation exist; integration coverage recorded in audit |
| Password recovery/change | Broker, log-mail tests and revocation exist; live mail delivery unverified |
| Feed | Posts, attachments, pagination/search, likes, comments, ownership checks and edit/delete paths exist |
| Profile | Username page, profile edit and avatar upload exist; authenticated API even where UI suggests public |
| Direct chat | Participant checks, text/media, history, read receipts, typing/presence and sequential idempotency exist |
| Group chat | Creation/membership/history/message paths exist; audit repairs access checks; UX/reconnect gaps remain |
| Notifications | Persistent likes/comments/direct-message activity and queued realtime events exist |

“Exists” describes code; consult [verification results](docs/AUDIT.md#verification-results) for what actually passed. Browser flows and production behavior must not be inferred from API tests.

## 5. Features needing repair

- Social OAuth is now explicitly disabled; restoring it requires complete client handoff and a safe state/provider-identity/account-linking contract.
- Group deep links rely on selected client state for header data; group search and some controls are unfinished; existing subscriptions may outlive membership removal.
- Messaging retries/reconnects need concurrent idempotency, missed-page reconciliation, conversation uniqueness and live socket revocation. Private attachment authorization is implemented; legacy storage rollout remains a deployment gate.
- Notifications need race-aware badge/list reconciliation and retryable error states; loading or mutation failure must not appear as success.
- Forms, modals and navigation need accessible keyboard/focus/error behavior and actual mobile/zoom testing.
- Search/discovery, profile visibility and exposed personal fields need explicit product/privacy decisions.
- Day 4 repaired factory relationships and removed conversation-factory loop risks. Keep demo seeding isolated and serial; it is insert-only/idempotent for its known records, not a concurrent production data repair tool.

## 6. Thirty-iteration implementation order

| Iteration | Focus | Acceptance gate |
| --- | --- | --- |
| 1 | Repository audit and bounded stabilization — delivered | Architecture, API/workflow docs and plan; targeted runtime/authorization fixes; honest baseline check results |
| 2 | Authentication and private media hardening — implemented | OAuth disabled, private attachments deny outsiders, transactional auth/revocation, rate limits and security tests; unresolved release gates documented |
| 3 | Dependency and runtime hardening — implemented | Laravel 12/Passport-compatible JWT upgrade, patched sharp/public optimizer, all npm/Composer audits zero, image/build/auth/realtime/media checks; remaining deployment gates documented |
| 4 | Database integrity, fixtures and MySQL 8.4 rehearsal — implemented | 46 read-only checks; guarded valid fixtures; all historical migrations and synthetic restore verified; missing constraints designed; actual MySQL conversation/membership races recorded honestly |
| 5 | Safe integrity constraints and concurrent conflict handling | Rehearse profile/membership uniqueness and canonical conversation rollout on clean/dirty disposable copies; preserve reviewed merge mappings, reject unreviewed data, handle competing callers and document rollback; settle target-retention rules before related CHECKs |
| 6 | Accessibility and responsive foundation | Keyboard-only auth/feed/chat/settings, modal focus, 320/375/768/1440px and 200% zoom checks pass; document shared primitives |
| 7 | Goal domain design and minimal persistence | Agree goal lifecycle, measurable targets, units, visibility and timezone rules; migration/API validation/ownership tests pass |
| 8 | Goal creation and management UI | Create/view/edit/archive goals with persisted state, validation and mobile keyboard-accessible workflows |
| 9 | Milestone domain and UI | Ordered measurable milestones belong to goals; completion/edit rules and ownership covered end to end |
| 10 | Progress/check-in domain | Define progress events versus daily check-ins; idempotency, dates/timezones, corrections and deletion rules tested |
| 11 | Daily check-in experience | Check-in flow handles success, duplicate submission, loading/errors and history; no fabricated progress |
| 12 | Consistency and streak calculations | Document timezone/day-boundary, missed-day and correction semantics; deterministic boundary tests pass |
| 13 | Personal overview | Goals, next milestones and recent progress use real data; clear zero-data experience replaces social-first entry point |
| 14 | History refinement, API contracts and frontend state | Stable history pagination/filtering and editing; account-bound cache reset, cancellation, retries/loading/empty/error behavior and component tests across touched flows |
| 15 | Meaningful progress sharing | Explicitly opt-in sharing links social posts to actual progress without exposing private goal/check-in data |
| 16 | Social support UX | Reactions/comments support meaningful encouragement; visibility, deletion and notification behavior tested |
| 17 | Accountability community model | Clarify group roles, membership/invites and goal-sharing boundaries; safe migration from existing groups |
| 18 | Community experience | Complete deep links, member management and community progress views with authorization and empty/error states |
| 19 | Challenge lifecycle | Define start/end, eligibility and measurable completion; validation/timezone/race tests before UI |
| 20 | Challenge participation | Join/leave and log qualifying progress; real progress summaries with visibility controls and accessibility |
| 21 | Messaging reliability | Concurrent sends, stable retry UUID, reconnect gaps, read receipts and membership revocation covered in MySQL/WebSocket tests |
| 22 | Notification relevance | Tested preferences, deduplication, read-count reconciliation and delivery failure handling tied to supported events |
| 23 | Analytics definitions and queries | Document denominators, periods, timezone and missing data; aggregate queries match fixtures and respect visibility |
| 24 | Progress analytics UI | Accessible real-data charts with equivalent summaries, date ranges and clear empty states |
| 25 | Measure performance | Capture query counts/latency, page payloads, client bundles and rendering for representative volumes |
| 26 | Targeted performance repairs | Fix measured slow queries, pagination and rendering bottlenecks; before/after measurements and regression checks |
| 27 | Operational hardening | Production configuration, dependency/secret gates, health/log/queue observability and restore drill verified |
| 28 | Release pipeline and staging | CI tests/builds, migration/deploy/rollback workflow and staging smoke tests repeat successfully |
| 29 | Portfolio quality and end-to-end review | Coherent product copy, valid demo data, keyboard/mobile audit and complete core journey tests; no fake working features |
| 30 | Release candidate and retrospective | Close blockers, publish accurate architecture/API/runbook/demo documentation, record evidence and prioritized remaining backlog |

Each iteration should produce a narrow reviewable change, meaningful tests, updated documentation and an explicit list of remaining risks. Do not carry a failing baseline forward without recording it.

Day 4 evidence changes the next priority: integrity constraints precede new domains. The former Day 5 API/state work is incorporated into iteration 14 and feature acceptance gates. If safe cleanup/conversation migration exceeds one iteration, move feature dates rather than compressing validation. Day 5 is recommended, not automatically started.

## 7. Technical risks

Backward-incompatible upgrades, old data conflicting with new constraints, account/timezone semantics, realtime ordering, cascade/orphan behavior, large component changes and client/server contract drift are the principal risks. Preserve current URLs/shapes through adapters where needed. Back up data and rehearse migrations; never use `migrate:fresh` as an upgrade strategy.

## 8. Security concerns

Credential rotation/history review, dependency maintenance, private attachment access, safe OAuth linking/state, XSS/token storage, response field minimization, authorization on every resource, upload handling and abuse limits precede public release. The audit's group checks and upload/NGINX fixes reduce concrete risks but do not certify the system secure. Changes to local environment files do not rotate deployed credentials.

## 9. Performance concerns

Chat lists load every existing conversation plus up to 100 other users; group lists aggregate last messages per group; full-text-like searches and offset pagination can degrade with growth. Repeated custom fetches and unbounded in-memory history/notification lists can add work. Media payloads and large JSX components warrant measurement. Establish workloads and budgets before adding caches or replacing infrastructure.

## 10. Testing gaps

API scripts cover happy paths and selected negative cases, but are not browser automation. Day 4 adds valid/invalid integrity and fixture safety coverage (52 total backend tests / 489 assertions), MySQL FK/unique checks, two concrete race schedules and a synthetic cross-version restore. Still missing: production-sized migration/restore timing, actual-data upgrade checks, simultaneous token/reset/client-UUID contention, process-crash recovery, realtime outages/reconnections, cross-account state, live OAuth/mail, accessibility and mobile browser checks. Unit/component coverage is limited. TypeScript excludes JavaScript checking; there is no PHPStan/Psalm setup. Full Pint retains 46 legacy style failures; all 22 PHP files materially changed on Day 4 pass scoped Pint. Test freshness, coverage and production realism must be reported separately from a green build.

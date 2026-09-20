# Security and authentication review

## Day 5 database constraints and concurrency — 2026-09-20

Three new migrations enforce at most one profile per user, one group membership per pair and one unordered direct conversation. Virtual canonical participant columns preserve existing conversation IDs/order and cascading FKs; a CHECK also prevents self-conversations. All three migrations refuse dirty target data before DDL. Preflight retains every previous check, adds four data checks and reports live schema enforcement separately from migration blockers and informational references. See [the deployment, rollback and remediation runbook](DATABASE.md).

Repositories recover only their expected unique-key conflict and return the winning row. InnoDB recovery uses a current locking read, including inside an existing repeatable-read transaction. Message creation separately handles concurrent sender/client UUID conflicts after rollback and reauthorizes the original message. Retry paths preserve one message/notification/event. Unexpected database failures still fail; API responses contain only a generic 500 message and logs contain exception class, SQLSTATE code and driver code, without SQL text, bindings or exception traces. SQLSTATE is an internal log field, never an API field. Passport, Reverb, channels and private-file permissions are unchanged.

| Day 5 check | Final result |
| --- | --- |
| PHP syntax | Pass: **136 PHP files** |
| Composer validate `--strict` / audit | Pass / zero advisories |
| PHPUnit, PHP 8.2.33 | Pass: **67 tests / 560 assertions**, isolated SQLite memory, network disabled |
| Scoped Pint | Pass: **26 materially changed PHP files** |
| Full Pint baseline | Fails on **40 existing style-issue files** (46 before Day 5); no suppressed rules or mass formatting |
| Client `npm ci`, lint, typecheck, tests, build | Pass: **19 tests**, **16 generated pages** |
| Client full / production audit | Zero vulnerabilities / zero vulnerabilities |
| Server Vite `npm ci` / build / full and production audits | Pass; **64 modules**; zero vulnerabilities |
| Fresh MySQL 8.4.11 | All **26 migrations**; empty and seeded preflight clean; 14 invariant checks; 12 deterministic races |
| Existing MySQL 8.0.46 | Old 23 migrations plus clean fixtures, including a reversed valid pair; three new migrations pass; **all 23 non-ledger original-column hashes/counts unchanged** |
| MySQL concurrency | Three rounds of four races: **12 races / 24 callers / 12 observed expected-conflict recoveries per run**, passed on 8.0, fresh 8.4 and restored 8.4 |
| Before/after reproduction | Day 4: two conversations and two memberships. Day 5: **one conversation ID returned to both callers and one membership**, plus one profile; same-key first message returns 201/200, one notification and one event |
| Dirty migration | Preflight/migration fail intentionally; all **24 table counts, hashes and index inventories unchanged**; duplicates retained until disposable-stack cleanup |
| Rollback/reapply on clean 8.4 | Three new migrations only; **23 non-ledger table hashes preserved**; no redundant lookup indexes after reapplication |
| Query plans | Profile, membership and conversation unique indexes selected; `const`, estimated one row |
| Backup after 8.0 regression → empty 8.4 restore | **All 24 complete table hashes/counts and all 6 attachment byte hashes match**, including conversation IDs/read state and migration ledger; preflight clean |
| Live suites on 8.0, fresh 8.4 and restored 8.4 | **Feed 51, chat 55, profile 23, notifications 20**, all passing on each stack |

The deterministic fork tests use real InnoDB writes/services/controller notification persistence and barriers after initial SELECT. They capture message and notification broadcast dispatches so cleanup cannot strand jobs for deleted users. Live HTTP/WebSocket suites separately verify actual Reverb/queued delivery, both participants, outsiders, typing, read receipts, private media, removed members and `X-Socket-Id`. They are not production load or process-crash tests.

Failures encountered during implementation were fixed and rerun: two new PHPUnit tests lacked ephemeral Passport keys; the fork controller harness rebound its request after assigning its user resolver; and a source feed run got 500 for an invalid token because an earlier root CLI diagnostic created a non-writable log. Test key setup is shared, request binding is ordered correctly, standalone MySQL failures now reliably exit 1, and the disposable entrypoint precreates/chowns its log. Earlier fork notification jobs could outlive deleted fixtures; dispatch capture now prevents that test artifact. No failing assertion was disabled. Full Pint remains an explicitly reported failure.

The persistent `server_mysql_data` volume and normal application/database containers were not started or modified. All four owned `elevateu-day5-*` projects and their test volumes were removed after verification. No historical migration, dependency lock, frontend source or authentication architecture was changed. Backup SQL, media and keys remain outside Git and require private handling. No commit or production deployment was performed.

Final index inspection found `server/.env` tracked again in the incoming checkout. Day 5 removed it from the index with `git rm --cached` and verified that the local file's bytes were unchanged and ignore rules apply. Its staged deletion should be retained when committing this work. Historical credential rotation/review remains necessary; no values or secret diffs were displayed.

Unresolved: actual-data preflight/remediation/cutover; production-size DDL and backup timing; message/attachment/group/notification retention; post-commit event delivery under process failure; contention outside these four cases; already-subscribed member revocation; historical secret rotation and legacy public media; runtime/image support deadlines; real mail, production TLS and browser accessibility/mobile coverage. Day 6 should address the existing accessibility/responsive foundation iteration, with deployment gates tracked separately. Day 6 is not started.

## Historical Day 4 database integrity status — 2026-09-20

The new [database runbook](DATABASE.md) inventories all 24 tables and separates schema guarantees from application assumptions. `php artisan elevateu:db-preflight` performs 46 read-only checks with bounded UUID samples and redacted ancillary credential identifiers; blocking findings produce a nonzero exit status. No schema constraints were silently applied and no historical migration was rewritten.

Factories now create coherent users/profiles, conversations, memberships, direct/group messages and real decodable media. The deterministic six-user `DemoSeeder` requires local/testing, an allowlisted isolated database, explicit enablement and a supplied password. It preserves existing content/passwords, refuses identity/file collisions and rolls back failed inserts. Default seeding is empty. Run it as the PHP worker user in Docker, not root, to keep upload directories writable.

MySQL **8.4.11** is the disposable compatibility baseline and **8.4 LTS** the intended supported line. Normal development remains on **8.0.46** pending an explicit cutover. The synthetic 8.0 source was migrated/seeded, quiesced, logically dumped with consistency/encoding/object flags, and restored into a separate empty 8.4 database along with media and Passport keys. **All 24 table counts and complete row hashes matched; both attachments matched and fully decoded.** Preflight and actual MySQL constraint checks passed before traffic. A repeated restore refused the populated destination. This verifies a logical restore, not an in-place volume upgrade, replication or a production backup service.

| Day 4 check | Result |
| --- | --- |
| Client lint / TypeScript / tests / production build | Pass; 19 tests, 16 generated pages; no UI changes |
| Isolated PHP syntax / PHPUnit | Pass; 52 tests, 489 assertions; network disabled, SQLite memory, real environment masked |
| Scoped Pint on materially changed PHP | Pass; 22 files |
| Full Pint read-only inventory | **Fail: 46 legacy files**, down from 49 because three fixture files were substantively rewritten; no mass formatting |
| Backend production Docker build | Pass; locked production dependencies and package discovery; demo/preflight smoke also passes without dev dependencies in isolated SQLite memory |
| Compose configuration / shell syntax | Pass; disposable configuration resolves and changed shell scripts parse |
| Fresh MySQL 8.4 migrations | Pass; all 23 chronological migrations, empty and seeded preflight clear |
| MySQL invariant scripts | 8 checks pass on 8.0 source, fresh 8.4 and restored 8.4; verify actual 1062/1452 errors and orphan-message denial |
| MySQL conversation/membership concurrency | **Both defects reproduced on both engines: 2 rows where 1 is expected**; preflight detects them; not fixed |
| Synthetic 8.0.46 → 8.4.11 restore | Pass; 24 table hashes, relationship preflight, file size/hash/full image decoding; demo seeder also passes repeated execution; all 46 checks remain clear after restored API regression traffic |
| Fresh 8.4 HTTP/WebSocket | Feed 51, chat/media/groups 55, profile/password 23, notifications 20; all pass |
| Restored 8.4 HTTP/WebSocket | Feed 51, chat/media/groups 55, profile/password 23, notifications 20; all pass |

The initial media regression failed because a root-run seeder created upload directories inaccessible to PHP-FPM. The documented worker-user workflow resolves this; all suites were rerun. Running auth-heavy suites without allowing the shared rate-limit window also produced downstream failures; final sequential runs leave the limiter enabled and separate suites by 60 seconds. A fixture PNG passed header inspection but failed full decoding, so it was replaced and a real decoder assertion added; the backup/restore drill was repeated with the corrected file, UTF-8 text and read-state fixtures. A Docker interruption discarded only disposable tmpfs databases; the exported backup and isolated media volume remained available. These failed attempts are retained as findings, not counted as passes.

Missing profile/membership/unordered-conversation uniqueness, message/attachment target rules, deletion orphans, cross-thread last pointers and BIGINT ancillary user IDs remain concrete debt. Day 5 should implement reviewed constraints plus concurrent conflict recovery; strict target CHECKs must wait for an agreed retention policy because current FKs intentionally SET NULL on deletion. The race script's successful exit means it reproduced the known failures, not that the application is race-safe.

Production promotion still requires actual-data preflight/cleanup decisions, a protected-copy upgrade checker run, measured cutover/rollback and MySQL image patch review. Oracle's 8.4.12 image-only security release and Docker Library's tested 8.4.11 package are distinguished in the runbook; no OS patch-parity certification is claimed. Earlier credential rotation, private-media rollout, active-socket revocation, token-storage and deployment gates remain. Normal development containers/data were not migrated, seeded, reset or deduplicated; no dumps or credentials are included in repository changes. No product feature or UI/authentication redesign was added.

All three owned Day 4 Compose projects, their temporary volumes and networks were removed after verification. The normal `server_mysql_data` volume remains present and its application/database containers remain stopped as before the rehearsal. Synthetic backup artifacts stay outside the repository; no commit was created and earlier uncommitted work was preserved.

## Day 3 status — 2026-09-19

The dependency hardening iteration upgrades Laravel to 12.69.2, Passport to 12.4.3, Socialite to 5.30.0, Firebase JWT to 7.1.1 and sharp to 0.35.4. Next 15.5.25, React 18, Passport's bearer architecture and Reverb remain. Both npm lockfiles report **0 full / 0 production findings**; Composer reports **0 full / 0 production advisories**, with no abandoned or filtered records. Exact versions and every advisory are in [DEPENDENCIES.md](DEPENDENCIES.md) and [DEPENDENCY_ADVISORIES.md](DEPENDENCY_ADVISORIES.md). No advisory suppression was added.

Public image optimization is restored by default with patched sharp and a narrow configured-origin allowlist for avatars, posts and group pictures. Private message endpoints and legacy message paths cannot enter the optimizer; authenticated blob delivery remains unchanged. Development Compose serves originals by default solely because its browser-facing localhost API is unreachable inside the Next container; [DEVELOPMENT.md](DEVELOPMENT.md) explains shared-origin configuration. The previous lock already contained a patched nested sharp under Next alongside the vulnerable root copy: Day 2's conservative mitigation is not proof that Next resolved the vulnerable copy. Day 3 eliminates that duplicate/version ambiguity.

Runtime images are version/digest pinned; Node moves from the EOL Docker 20 line to 22.23.2 and PHP receives the 8.2.33 patch. MySQL 8.0.46 is pinned without changing existing data; its EOL status remains a release blocker. PHP 8.2 and Next 15 have near-term support deadlines. Private uploads are now excluded from backend Docker build contexts. OS vulnerability scanning has not been performed.

The final Git-index check found `server/.env` still tracked despite Day 2's removal report. Day 3 stages its removal from version control with `git rm --cached`, verifies the local file is byte-for-byte unchanged, and confirms ignore rules apply. No secret values are reproduced here; previous history and credentials remain subject to rotation/review. Commit the removal alongside this work; no commit or history rewrite was performed by this iteration.

| Day 3 check | Result |
| --- | --- |
| Client clean install, lint, typecheck, unit tests, production build | Pass; 19 tests |
| Server assets clean install/build and all npm/Composer audits | Pass; audits 0 |
| Composer install/strict validation and PHP syntax | Pass |
| PHPUnit on PHP 8.2.33 / Laravel 12 | Pass; 37 tests, 375 assertions |
| Pint | **Fail: same 49 files with legacy style issues**; no global formatting |
| Frontend/backend Docker builds; Compose/nginx configuration | Pass |
| Disposable HTTP/WebSocket suites | Feed 51, chat/private and group media 55, profile/password 23, notifications 20; all pass |
| Standalone image/navigation HTTP smoke | Pass; 26 checks, including resized local/avatar/post images and optimizer rejection of private/legacy/unlisted paths |

The 14 added chat checks cover group membership, live delivery, no self-echo, history, private bytes, outsider denial and fresh download/subscription denial after removal. They do not resolve already-subscribed socket revocation. Tests use separate disposable MySQL/storage and an isolated SQLite PHPUnit runtime; normal development data is preserved.

Credential rotation/history review, legacy-file migration, JavaScript-readable bearer tokens, active-socket revocation, privacy field minimization and the other release gates below remain unresolved. OAuth stays disabled. No schema migration or product feature is part of Day 3.

## Day 2 hardening record — 2026-09-18

Reviewed 2026-09-18. This is a bounded hardening iteration, not a security certification or production release. The existing Next.js/Axios, Laravel Passport, MySQL and Reverb architecture is retained. No goals, streaks, challenges, UI redesign, authentication replacement or database migration was introduced.

## Confirmed findings and decisions

| Finding | Change / disposition |
| --- | --- |
| A real server environment file was tracked | Removed from the Git index, retained locally. Rotation and history review remain mandatory; deletion does not invalidate exposed credentials. |
| Google/Facebook used stateless callbacks and email-based account linking without a complete browser handoff | Both supported providers' redirect and callback routes now return 503 without contacting a provider, linking users, issuing tokens or redirecting. Unsupported providers return 404. |
| Private message files used public storage URLs | New files use private local storage; a bearer-authenticated endpoint checks message access before serving bytes. nginx blocks legacy public prefixes. A dry-run-first migration command handles existing files. |
| Public auth routes did not share the documented budget; API limiter could resolve the wrong guard | Explicit Passport guard resolution; 120/min per authenticated user (IP fallback), plus a shared 10/min/IP budget across register/login/forgot/reset. |
| Invalid reset responses could identify registered accounts | All invalid/expired/unknown reset links return the same 422 response. Forgot-password remains account-neutral, including broker throttling and mail exceptions. |
| Password/token operations lacked complete transactional guarantees | Registration includes profile and token issuance in one transaction. Login holds the user lock through token issuance. Password change/reset couple password writes and revocation transactionally; reset consumption is serialized. |
| Restored browser state could trust cached identity; delayed responses could affect a newer login | Hydration revalidates with `/auth/me`; token snapshots guard stale 401/logout/identity responses. Logout reports server-revocation failures. |
| Upload paths used untrusted filename metadata; arbitrary PHP paths reached FPM | Server-detected extensions/MIME, UUID filenames, existing format/size allowlists and front-controller-only PHP handling. |
| Vulnerable dependency graph | Day 2 applied compatible updates and temporarily disabled image optimization and unused local signed serving. Day 3 patches the remaining findings and restores public optimization as described above; unused signed serving remains disabled. |

The initial audit also repaired group owner/member authorization and field allowlists. These changes are included in the final regression suite; see [AUDIT.md](AUDIT.md) for the baseline and [DEPENDENCIES.md](DEPENDENCIES.md) for advisory classification and exact versions.

## Authentication and token threat model

The assets are account credentials, bearer tokens, reset links, private messages/files, group membership and personal profile data. Unauthenticated visitors, unrelated authenticated users, removed members, compromised browser scripts and deployment operators have different trust boundaries. The API, not React visibility or Next middleware, decides authorization.

`AuthService` calls Passport `createToken('auth_token')` after password verification or registration. Passwords use Laravel's configured adaptive hash; `User` hides password and remember-token fields from serialization. Registration takes an explicit field allowlist, ignoring submitted IDs/roles. Tests assert hashes and safe responses. No application password logging was identified; this is not a guarantee about external proxies or production logging agents.

Personal access tokens last 30 days. The provider also configures 15-day access and 30-day refresh lifetimes, but the browser uses personal access tokens and has no refresh-token flow. `client/src/lib/token.js` stores the bearer in a JavaScript-readable `token` cookie, lasting 30 days, SameSite=Strict and Secure on HTTPS. Cached user data lives in localStorage. Axios and Echo read that token and use `Authorization: Bearer`; writes preserve `X-Socket-Id`. Next middleware checks cookie presence for navigation, not cryptographic validity. `/auth/me` verifies restored sessions with Passport.

Logout revokes the presented token; other tokens remain valid. The client clears its local identity/token and disconnects Echo even if the request fails, with a visible warning that server revocation did not succeed. Password change requires the current password, preserves the current token and revokes others. Password reset revokes every token, consumes the broker token and changes the password transactionally. Reset links expire after 60 minutes; the broker also throttles issuance to once per 60 seconds per account. Tests cover repeated and expired links and session revocation. MySQL integration verifies ordinary flows; simultaneous transaction races have not been stress-tested.

Invalid credentials return the same 401 response for missing accounts and wrong passwords. Password creation, login, change and reset share a 4096-character input ceiling; tests prevent setting credentials that login would reject for size. Forgot-password returns the same 200 body for known/unknown accounts and broker throttling; mail failures are reported through Laravel rather than exposed in the response. Invalid reset links return a generic 422. No artificial timing delays were added: database/hash/mail work can still have timing differences. Registration still reports duplicate email/username validation, and existing profile/user serializers expose personal fields to other authenticated users. Those privacy decisions need a separate field-minimization pass.

**JavaScript-readable tokens remain vulnerable to XSS.** SameSite is not an XSS defense. Thirty-day stolen tokens can be replayed until expiry or revocation. No claim is made that this iteration fixes browser script compromise. Cached content and already-downloaded files cannot be remotely erased. API responses receive no-store, nosniff and no-referrer headers; deployment TLS, browser CSP and security headers still need end-to-end verification.

### Concrete HttpOnly migration plan (not implemented)

1. Establish the deployment origins and supported nonbrowser clients. Choose a same-origin browser backend-for-frontend in Next while retaining Passport for the API.
2. Have server-only login/register handlers exchange credentials with the existing API and retain Passport tokens in a server-side session store. Issue an opaque Secure, HttpOnly, SameSite browser session cookie; rotate its ID on login and privilege changes.
3. Proxy allowlisted API paths through that server layer. Attach bearer tokens only server-side, validate origin/CSRF tokens for cookie-authenticated writes, stream files without caching, and forward the validated socket ID. Never build an unrestricted URL proxy.
4. Send Echo channel authorization to the same-origin session endpoint; it forwards to `/api/broadcasting/auth`. WebSocket application keys remain public; bearer tokens disappear from browser JavaScript.
5. Revoke Passport tokens and destroy server sessions on logout/reset, bound server-session lifetimes to token expiry, and test multi-tab logout, session fixation, CSRF, reconnect and stale requests.
6. Roll out behind an explicit compatibility window; invalidate old browser bearer sessions, remove the readable token cookie and bearer attachment from browser code only after API/chat/media journeys pass. Retain documented Passport access for other clients as needed.

This requires deployment, CSRF, session storage and realtime changes together; simply setting HttpOnly on the existing cookie would break Axios and Echo.

## OAuth disposition

The old implementation used Socialite `stateless()` and matched accounts by provider email, without durable provider-subject identity or a completed secure frontend exchange. Adding a superficial verified-email check would leave state/login-CSRF and account-confusion problems. The safe bounded outcome is to disable the unfinished paths explicitly. Tests prove supported redirect/callback routes fail closed and create no account or token.

To restore OAuth: add a unique `(provider, provider_subject)` identity relation through a safe new migration; use an expiring session-bound state value (and nonce/issuer/audience verification where the provider protocol requires it); bind exact redirect URIs; validate provider verification claims; require authenticated explicit consent or reauthentication to link an existing local account. Never link by email alone. Use a short-lived, single-use server handoff or the future server session, never bearer tokens in redirect URLs. Verify malicious/replayed state, provider errors, duplicate identity races, account linking/unlinking, and both real providers in registered callback environments. Those external tests and provider credentials were not available or exercised here.

## Authorization conventions and evidence

| Resource | Server boundary tested |
| --- | --- |
| Posts/comments | Another user cannot edit/delete; authorship comes from the authenticated user. |
| Profiles/avatars | Writes target the current account, ignoring another submitted user ID. |
| Conversations | Outsiders cannot list history, mark read or authorize the private channel. |
| Messages/files | Sender identity is server-derived; direct conversation participants or current group members can read. Removed group senders cannot read/replay their old files. Orphaned messages fail closed. |
| Groups | Members may read; owners manage fields/membership/delete; outsiders cannot access; owner cannot be removed through member removal. |
| Notifications | Queries and mutations scope to the current user; another user's notification returns 404. |
| Broadcast auth | User channel owner, conversation participants and current group members only; unauthenticated requests return 401. |

Existing API conventions remain: generally 401 for no valid bearer, 403 for a known resource outside the caller's allowed scope, 404 for missing/scoped notification resources. This preserves contracts but does not hide every resource-existence distinction. UUIDs are identifiers, not access controls.

**Unresolved realtime boundary:** channel authorization happens at subscription time. A socket already subscribed can survive token revocation or group removal and continue receiving group text/metadata until disconnected. Server-side eviction/revalidation or channel rotation needs a dedicated implementation and live removal/revocation tests. REST and fresh attachment downloads recheck access; this does not revoke bytes or events already delivered.

## Private message media and rollout

`message_attachments` is a local disk rooted at `storage/app/private/messages`. New rows retain relative `uploads/messages/<uuid>.<detected-extension>` paths. File serialization returns `/api/message-attachments/{id}`. `MessageAttachmentController` resolves a message attachment, authorizes its message, rejects unexpected/traversal paths, and streams a forced octet-stream download with nosniff, sandbox CSP and private/no-store headers.

The client constructs a relative API URL from the attachment ID, ignoring supplied URLs; it fetches bytes with the existing bearer transport. Only JPEG/PNG/GIF/WebP blobs render as images. Other allowed documents/video download after an explicit load action. Blob URLs are revoked on cleanup/account change; failed loads have visible retry controls. Private media does not pass through public `<img>` URLs or the Next image optimizer. Post/avatars/group pictures retain their existing public-media behavior.

Legacy rows may still point to files on the public disk. The authenticated endpoint temporarily falls back to that disk, while nginx rejects `/storage/uploads/messages/` and `/uploads/messages/`. Apache rules are also supplied but were not exercised on Apache. **Do not expose an alternative static server, object-store/CDN origin or `php artisan serve` with unmigrated legacy files.** A UUID URL is not protection.

Deployment sequence for an existing installation:

1. Back up database and both storage roots; inventory any public/CDN copies. Deploy the static-prefix denial before opening traffic and test a known legacy URL without authentication.
2. Deploy the API and client together; persist the private storage root with permissions limited to the application service. New writes now go private; old files remain readable only through the authenticated fallback on the checked nginx configuration.
3. Run `php artisan media:privatize-messages` inside the correctly configured application to inventory legacy files. It is a dry run by default.
4. Review the backup/inventory, then run `php artisan media:privatize-messages --apply`. It copies each file, verifies SHA-256 equality, then removes that public source. Conflicts/unexpected paths stop without overwriting the conflicting file; it can be rerun after review. Database paths do not change.
5. Check participant success, outsider/guest denial and legacy URL denial; inspect remaining public files and purge CDN copies. Remove fallback code in a later iteration only after all environments are inventoried and migrated.

The command was tested with disposable fake disks, including conflicting copies. **It was not applied to normal development or production files.** Existing leaked/downloaded copies cannot be revoked. No remote/object-storage migration or malware scanner is implemented.

## Upload validation

| Upload | Current allowlist / limit |
| --- | --- |
| Avatar | JPEG, PNG, GIF, WebP; image validation; 5 MiB |
| Group picture | JPEG, PNG, GIF; image validation; 2 MiB |
| Post | JPEG, PNG, GIF, WebP, MP4, AVI, MOV; up to 10 files, 20 MiB each |
| Message | Post formats plus PDF, DOC, DOCX; up to 10 files, 20 MiB each |

Laravel content-based MIME validation and server-detected extensions replace trust in the browser suffix/MIME. Names are generated UUIDs. SVG and executable payloads are rejected across all four boundaries in tests. Message requests cannot specify both a receiver and a group. Failed transactional creates clean their newly stored files; tests cover group write rollback and absent-profile avatar behavior. Ownership is enforced before destructive operations. Existing storage cleanup can still leave orphan files on filesystem failure; broad retention/reconciliation and adversarial media decoding are not solved. nginx's 100 MiB request-body limit can reject a batch before its per-file Laravel limits; errors through that layer need separate frontend UX coverage.

## Rate limits, environment and secrets

The four public auth endpoints share 10 requests/minute per IP; all API routes also use 120/minute per Passport user, or IP when unauthenticated. Tests exercise actual 429s and independent users behind one IP. The integration stack uses database cache so limits persist between requests; `array` cache is only for isolated PHPUnit. Multi-replica deployments need a shared cache and correctly configured trusted proxies. The limits are basic abuse controls, not distributed brute-force protection.

The tracked-file inventory and credential-pattern review found the original tracked `server/.env`; Day 3 found it still tracked and staged its removal from version control while preserving it locally. No secret values are reproduced in documentation. Ignore rules cover environments, private keys and generated storage/logs; examples contain placeholders. Disposable test credentials/zero application key are deliberately public fixtures, restricted to the isolated test stack, never deployment defaults.

Rotate any previously committed database, mail, OAuth, Reverb and application credentials as applicable; review repository history/access. Coordinate APP_KEY rotation with encrypted-data/session compatibility and Passport key replacement with session invalidation. Keys are not regenerated on ordinary startup. The current cleanup is not proof that Git history or deployed services are clean.

Production requires APP_DEBUG=false, HTTPS, real scoped DB credentials, private Passport keys, secret-managed application/mail/OAuth/Reverb settings and working operational error reporting. `NEXT_PUBLIC_*` values are browser-visible: API URLs, WebSocket host/port and Reverb application key are public configuration; Reverb secret, APP_KEY, database passwords and Passport private keys must never be there. CORS does not authorize a request. Examples use scoped origins, but the retained config fallback for CORS/Reverb is `*`; set explicit production allowlists. No blanket trusted-proxy override was introduced; deployers must allow only their actual proxy addresses before trusting forwarded IP/scheme headers. Production proxy/TLS behavior remains unverified. The log mailer writes reset links to private development logs; never publish those logs or use it as real delivery.

## Database safety

No migrations or constraints were added or rewritten, and normal development data was neither reset nor deduplicated. Inspection confirms missing uniqueness for profile user IDs, group membership pairs and normalized conversation pairs, plus UUID/BIGINT mismatches in ancillary tables and nullable relationships that can orphan content. The application prevents ordinary duplicate membership, but `firstOrCreate` alone is not a concurrent uniqueness guarantee.

Before new constraints: take backups, run read-only duplicate/orphan/type preflight on the actual populated database, agree survivor/merge rules with preserved references, then write a new migration and rehearse both fresh and representative upgrades on disposable MySQL. Existing data was not inspected deeply enough to select safe merge rules tonight. Never rewrite an old migration or reset data to make a unique index pass.

## Day 2 dependency and verification snapshot (superseded by Day 3 above)

At the end of Day 2, frontend audit reported **19 total entries (14 high, 4 moderate, 1 low)**; production install **11 (7 high, 3 moderate, 1 low)**. Backend reported **4 advisory records across 2 runtime packages (1 high, 1 medium, 1 low, 1 unrated)**. Package entries and advisory records are different units. The historical evidence below is retained; current Day 3 results supersede it.

Laravel 11 security support ended March 12, 2026 according to the [official support table](https://laravel.com/framework/docs/11.x/releases#support-policy). Day 2 retained it with explicit email control-character rejection and disabled unused local signed serving. Its vulnerable root sharp copy was retained with `images.unoptimized: true` (optimizer HTTP 404 verified). Day 3 completes the reviewed Laravel/sharp upgrades; these statements describe the prior baseline, not the current dependency state.

Commands and isolation details are in [DEVELOPMENT.md](DEVELOPMENT.md#verification).

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass; `checkJs=false` limits coverage of the mostly JSX client |
| `npm test` | Pass: 14 helper tests, including binary transport, attachment URL/MIME handling and shared presence |
| `npm run build` (Next 15.5.25) | Pass; 16 static pages generated and tracing completed |
| Server production Docker build | Pass: `elevateu-server:security-check`, including updated Composer lock and final backend changes |
| PHP syntax lint | Pass across application/config/routes/migrations/tests |
| PHPUnit 11.5.56 / PHP 8.2.32 | Pass: 37 tests, 375 assertions; network disabled, SQLite memory, masked `.env`, read-only code, disposable storage/cache; hostile external MySQL variables overridden |
| `Pint --test` | Fail: 49 files with style issues in the existing codebase; no mass formatting or suppressed rules |
| Composer manifest/lock validation | Pass |
| npm full / production audits | Fail: 19 / 11 vulnerable package entries; details above and in dependency report |
| Composer locked audit | Fail: 4 advisory records across 2 runtime packages |
| Feed HTTP integration | Pass: 51 assertions |
| Chat HTTP/WebSocket integration | Pass: 41 assertions, including 9 new private-media checks through nginx: exact participant download bytes, safe headers, guest/outsider denial and public URL denial; original live delivery, no self-echo, typing, presence and channel checks remain green |
| Profile/password HTTP integration | Pass: 23 assertions; actual MySQL/Passport, reset link read from private test mail log |
| Notifications HTTP/WebSocket integration | Pass: 20 assertions, including queued live delivery, persistence, ownership and counts |
| Server Vite production build | Pass: 58 modules in disposable Node 20 Linux during baseline verification; assets unchanged by Day 2 |
| Compose / nginx / entrypoint checks | Pass: three Compose configurations, nginx syntax and shell syntax |
| Production HTTP smoke | Pass: sign-in 200, protected navigation 307, disabled image optimizer 404, blocked legacy media prefix 404, arbitrary PHP path 404 |

Security coverage includes real Passport token issuance/verification, hashing and registration rollback, login neutrality, auth gates, logout/password revocation, reset reuse/expiry, input limits and header injection, rate budgets, OAuth fail-closed behavior, resource/channel ownership, private attachments, removed/deleted-group access, traversal, upload rejection and safe legacy-file migration. Broadcast signing and mail use local test drivers in PHPUnit; live HTTP suites separately exercise Reverb and the database queue. Browser image rendering/download interactions, external OAuth, real mail delivery and production TLS/proxy behavior remain unverified.

The first baseline PHPUnit run accidentally reset only the disposable integration database because Docker environment precedence defeated XML overrides. It invalidated that early feed run. The fail-closed test bootstrap and separate network-disabled runtime fix that isolation defect; subsequent complete integration suites passed. Normal development data was never reset. This incident is preserved in [AUDIT.md](AUDIT.md), not hidden as a passing baseline.

## Remaining release blockers

Day 5 completes the bounded uniqueness and conflict-recovery work described at the top. Keep credential rotation/history review, legacy-media rollout, actual-data MySQL cutover and Next/PHP support deadlines explicit. Active-socket revocation, field minimization, browser auth/chat/media tests, real mail/provider verification, TLS/proxy configuration, production storage recovery and remaining concurrency cases still precede public release.

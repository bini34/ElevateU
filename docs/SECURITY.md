# Day 2 security and authentication review

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
| Vulnerable dependency graph | Controlled compatible updates; unresolved findings remain visible. Image optimization and unused local signed serving are disabled as specific compensating controls. |

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

The tracked-file inventory and credential-pattern review found the original tracked `server/.env`; it is now staged for removal from version control and still exists locally. No secret values are reproduced in documentation. Ignore rules cover environments, private keys and generated storage/logs; examples contain placeholders. Disposable test credentials/zero application key are deliberately public fixtures, restricted to the isolated test stack, never deployment defaults.

Rotate any previously committed database, mail, OAuth, Reverb and application credentials as applicable; review repository history/access. Coordinate APP_KEY rotation with encrypted-data/session compatibility and Passport key replacement with session invalidation. Keys are not regenerated on ordinary startup. The current cleanup is not proof that Git history or deployed services are clean.

Production requires APP_DEBUG=false, HTTPS, real scoped DB credentials, private Passport keys, secret-managed application/mail/OAuth/Reverb settings and working operational error reporting. `NEXT_PUBLIC_*` values are browser-visible: API URLs, WebSocket host/port and Reverb application key are public configuration; Reverb secret, APP_KEY, database passwords and Passport private keys must never be there. CORS does not authorize a request. Examples use scoped origins, but the retained config fallback for CORS/Reverb is `*`; set explicit production allowlists. No blanket trusted-proxy override was introduced; deployers must allow only their actual proxy addresses before trusting forwarded IP/scheme headers. Production proxy/TLS behavior remains unverified. The log mailer writes reset links to private development logs; never publish those logs or use it as real delivery.

## Database safety

No migrations or constraints were added or rewritten, and normal development data was neither reset nor deduplicated. Inspection confirms missing uniqueness for profile user IDs, group membership pairs and normalized conversation pairs, plus UUID/BIGINT mismatches in ancillary tables and nullable relationships that can orphan content. The application prevents ordinary duplicate membership, but `firstOrCreate` alone is not a concurrent uniqueness guarantee.

Before new constraints: take backups, run read-only duplicate/orphan/type preflight on the actual populated database, agree survivor/merge rules with preserved references, then write a new migration and rehearse both fresh and representative upgrades on disposable MySQL. Existing data was not inspected deeply enough to select safe merge rules tonight. Never rewrite an old migration or reset data to make a unique index pass.

## Dependencies and verification

See [DEPENDENCIES.md](DEPENDENCIES.md) for package-level findings, sources and controlled updates. Frontend audit remains nonzero: **19 total entries (14 high, 4 moderate, 1 low)**; production install **11 (7 high, 3 moderate, 1 low)**. Backend remains **4 advisory records across 2 runtime packages (1 high, 1 medium, 1 low, 1 unrated)**. Neither has a remaining critical finding in this audit snapshot. Package entries and advisory records are different units.

Laravel 11 security support ended March 12, 2026 according to the [official support table](https://laravel.com/framework/docs/11.x/releases#support-policy). Remaining framework fixes require a major upgrade. Explicit control-character rejection in auth emails and disabling unused local signed serving reduce specific exposures without claiming the framework is patched. Sharp remains vulnerable in the lockfile; `images.unoptimized: true` disables the Next optimizer route (HTTP 404 verified), with increased original-image bandwidth. Do not reenable it before a reviewed upgrade. No audit exclusions hide these findings.

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

## Remaining release blockers and Day 3

Prioritize a supported Laravel/Passport-compatible dependency migration, remaining compatible transitive updates, and the tested sharp upgrade in a bounded dependency iteration. Keep real credential rotation/history review and legacy-media rollout as explicit deployment gates. Schedule active-socket revocation, response field minimization, safe database constraints, browser auth/chat/media tests, real mail/provider verification, TLS/proxy configuration, storage/backup recovery and concurrency tests before public release. Day 3 has not been started.

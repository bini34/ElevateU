# Database integrity and MySQL upgrade runbook

Updated Day 5, September 20, 2026. The 23 historical migrations remain unchanged; three new migrations enforce profile, membership and unordered conversation uniqueness. All database work used isolated synthetic stacks. The persistent development database was not started, inspected, migrated, seeded or reset.

## Day 5 constraints and creation flow

| Invariant | New migration (September 20, 2026) | Database enforcement |
| --- | --- | --- |
| At most one profile per user | `000001_enforce_profile_uniqueness` | `profiles_user_id_unique(user_id)`; does not guarantee every user has a profile |
| One membership per group/user | `000002_enforce_group_membership_uniqueness` | `group_users_group_id_user_id_unique(group_id,user_id)` |
| One unordered direct conversation | `000003_enforce_unordered_conversation_uniqueness` | Virtual `participant_low` / `participant_high`, unique `conversations_participants_unique`, CHECK `conversations_distinct_participants` |

Before Day 5, `/conversations/with/{userId}` only looked up a peer and optional conversation. The first message did an OR lookup in both participant orders, then inserted an unconstrained conversation inside its message transaction. Two empty lookups could both insert. Group membership used `firstOrCreate` without a unique index, which had the same race. Profile creation inserted directly.

The GET remains read-only. Application ordering now lives in `App\Support\ConversationParticipants`: validate fixed 8-4-4-4-12 hexadecimal UUID text, lowercase, and compare ASCII bytes. This orders identities, not creation times. New conversation writes store that order. Existing valid reversed rows keep their original columns, IDs and timestamps. The generated MySQL columns derive `LEAST(LOWER(user_id1),LOWER(user_id2))` and `GREATEST(...)`, with `CHAR(36) COLLATE utf8mb4_bin`. For fixed-format hexadecimal UUIDs this agrees with application ordering; exact, reversed and uppercase duplicate insertions are tested on both MySQL versions. SQLite uses equivalent CASE expressions for functional tests; it is not the concurrency evidence.

Virtual generated columns preserve the current cascading participant FKs. Stored generated columns would restrict referential actions on their base columns. A CHECK on the generated pair excludes self-conversations, while the original NOT NULL participant columns exclude missing participants. The migration preflight also rejects malformed UUID text. There is no new global UUID-format constraint on `users`. [MySQL generated columns](https://dev.mysql.com/doc/refman/8.4/en/create-table-generated-columns.html), [CHECK restrictions](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html).

`UniqueResource` resolves profile, membership and conversation insertion races. It catches only Laravel's unique-violation subtype and the expected driver/index diagnostic (MySQL 1062; exact SQLite columns). It uses an insert savepoint if a caller already owns a transaction, then reads the committed winner on the writer connection with `FOR UPDATE`. This current read is essential: a normal repeatable-read query can retain the earlier empty snapshot. Missing winners and unrelated failures are rethrown. No global lock or blanket database-error retry is used. [InnoDB consistent reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html).

Profile retries preserve existing fields; update is a separate operation. Group add remains idempotent 201. Both conversation directions resolve the same ID. Message creation separately catches only `(sender_id,client_uuid)` uniqueness after rolling back the losing transaction, then reauthorizes and returns the original message with `created=false` / HTTP 200. Only `created=true` produces a notification and message broadcast. Reusing a key with different content still returns the original authorized payload; fingerprint/conflict semantics are deferred. Post-commit notification/broadcast failure is not solved by database uniqueness.

## Constraint deployment and dirty-data procedure

1. Use a protected backup of the actual database and media and rehearse on a separate instance. This session's synthetic evidence does not authorize or perform a persistent-data cutover.
2. Stop API writers and all queue/scheduled/import writers for the migration window. Take a read-only preflight snapshot with `php artisan elevateu:db-preflight --json --sample=5`. A clean snapshot does not prevent later writes; do not migrate under uncontrolled concurrent writers.
3. Inspect `constraint_migration_safe` and `migration_blocking_checks`. Each of the three migrations checks **all three domains** plus self/null/malformed participants before its DDL. Dirty membership/conversation data therefore blocks even the first profile migration. No rows are deleted, merged, reassigned or rewritten.
4. On duplicates, stop. Preserve a protected remediation mapping and backup. Select profile field precedence and membership timestamp provenance explicitly. For conversations, map every source ID, message, attachment link, read state, notification reference, last-message pointer and externally used URL/channel ID before deciding whether a manual merge is appropriate. The two informational reference checks identify affected message/pointer IDs without revealing contents. Resolve orphan/retention warnings separately; do not delete history just to obtain a green report.
5. Apply only approved data repair on a copy first, validate references and compare hashes. No automated merge tool is supplied. Repeat preflight. Once reviewed data is clean, apply `php artisan migrate --force` in the stopped-writer window. MySQL DDL can acquire metadata locks and is not one transaction across all three migrations. Check the ledger/indexes after interruption before resuming; do not assume a partially applied batch rolled back.
6. Deploy/reload the application and workers after the columns exist; the new repository lookup requires them. Run preflight, schema checks, login, profile, group, message/media and realtime smoke tests, then reopen writers. Do not run new readers against a pre-Day-5 schema.

Rollback drops only the new constraints/generated columns. It preserves every original column and row. Profile/group FK support indexes are restored before removing their unique indexes; reapplication removes the now-redundant support indexes. Stop writers and use compatible application code before schema rollback: dropping guarantees permits duplicates again, and current readers require generated columns. Rollback cannot undo a separately approved manual merge or restore deleted bytes; that requires the protected mapping/backup. Prefer retaining compatible constraints when rolling back application code.

## Day 5 rehearsal and verification commands

Use only `server/docker-compose.test.yml`, a unique project name and unused loopback ports. It uses project-specific storage and tmpfs MySQL, never `server_mysql_data`. Start with `ELEVATEU_TEST_SERVER_IMAGE` pointing to the verified PHP runtime; the entrypoint now creates the log file before setting ownership so root CLI diagnostics cannot prevent HTTP authentication from logging. Run fixture/Artisan commands as `www-data`.

For a **fresh** 8.4 stack: start it, run preflight on empty tables, seed the guarded demo, run preflight again, then run the scripts below. For an **existing-data** rehearsal, start 8.0 with a checkout at the 23-migration Day 4 baseline, seed, stop writers and snapshot. Deploy the three new migrations/application, preflight, migrate, compare original-column hashes and run regressions. Then use the guarded backup/media archive and empty 8.4 restore procedure below. Do not merely start an 8.0 stack at current HEAD and call that an old-schema migration rehearsal.

```text
php artisan elevateu:db-preflight --json --sample=0
php tests/MySql/invariants.php
php tests/MySql/concurrency.php
php tests/MySql/query-plans.php
php tests/MySql/snapshot.php
```

The concurrency script runs three rounds each of reverse-direction first messages, group membership, profile creation and same-key first-message retries: 12 two-process races / 24 callers. Query barriers force both initial lookups to miss; exactly one recovery current-read is required per race. Real database rows and controller notification persistence are checked. Broadcast dispatches are captured locally in these fork tests; separate HTTP/WebSocket suites verify actual Reverb delivery, socket exclusion and the database queue. Unexpected script exceptions exit 1 with safe class/location diagnostics.

On a **separate disposable dirty stack only**, seed and stop writers, then opt in with `ELEVATEU_DIRTY_REHEARSAL=1` when executing `php tests/MySql/dirty-migration.php`. It verifies that the newest three ledger entries are Day 5 migrations before rolling them back, adds deliberate duplicate fixtures, expects preflight/migration failure and compares all 24 table counts/hashes/index inventories. It leaves invalid synthetic data for inspection; discard that owned stack afterwards. Never run this script on development data.

`snapshot.php` reports only counts and hashes. `original_sha256` excludes the two newly derived conversation columns for the pre/post-migration comparison; all other original columns must match. Only the migration ledger is expected to change in that comparison. An 8.0-to-8.4 restore must match full hashes of all 24 tables, including the ledger. Every attachment's existence, metadata size and bytes are checked; demo PNGs also fully decode. Existing HTTP scripts use minimal PNG fixtures, so their byte matching is not evidence of image-decoder safety.

Measured profile, membership and canonical conversation lookups use their unique indexes with EXPLAIN access type `const`, estimated one row. Redundant profile/user and membership/group prefix indexes are absent. Reverse user-membership and original conversation participant FK indexes remain useful and are retained. These are small-fixture query plans, not production-size latency/DDL evidence. Exact results and remaining limits are recorded in [SECURITY.md](SECURITY.md).

## Retention decisions still required

| Domain question | Current behavior | Decision still needed |
| --- | --- | --- |
| Delete a conversation? | No direct-conversation delete API; SQL/user cascades can delete conversations and SET NULL message targets | Archive/hide versus delete, participant rights, history/export and erasure rules |
| Remove a group member? | Historical messages stay; removed members cannot fetch history/media or authorize a new channel subscription | Whether access to pre-removal history should remain; active-socket revocation policy |
| Delete a group? | Owner endpoint deletes group/memberships; messages remain with null group target and become inaccessible | Retain/archive/purge messages, timelines and privacy expectations |
| Delete attachment owners/files? | SET NULL can retain orphan attachment metadata; normal post deletion explicitly removes its files; no general orphan collector | Retention duration, private access, transaction-safe retryable file deletion and media backup policy |
| Notifications? | Persist until separately removed; payload references are not FKs | Expiry, deleted-target display, recipient erasure and cleanup policy |
| Audit versus privacy? | No agreed audit/erasure model or soft-delete architecture | Minimal audit metadata, access controls, export/erasure scope and retention duration |

No new message/attachment ownership, target or retention constraints were added. Current behavior is documented, not adopted as a final product policy.

## Database baseline and compatibility

The intended supported engine line is **MySQL 8.4 LTS**. Disposable Compose now pins **8.4.11** and its multi-platform digest. Normal development Compose deliberately retains **8.0.46** and its existing volume until an explicit data cutover. A new image tag alone is not an upgrade procedure.

Oracle documents logical dump/load as a supported 8.0-to-8.4 path. Day 4 rehearses that path with synthetic data, separate projects and a new database; it does not test an in-place data-directory upgrade or replication. [MySQL upgrade paths](https://dev.mysql.com/doc/refman/8.4/en/upgrade-paths.html).

The selected Docker Library image was available as 8.4.11. Oracle also lists **8.4.12**, an image-only security update; `mysql:8.4.12` was unavailable in Docker Library during this review. Do not describe this rehearsal pin as the latest security-cleared production image. Verify the selected distribution's patch parity and OS advisories before production promotion. [Oracle 8.4.12 notes](https://dev.mysql.com/doc/relnotes/mysql/8.4/en/news-8-4-12.html), [Docker Library manifest](https://github.com/docker-library/official-images/blob/master/library/mysql).

| Compatibility area | Finding |
| --- | --- |
| Laravel/PDO | Laravel 12.69.2 and PHP 8.2.33 PDO MySQL run migrations and application queries on both engines |
| Authentication | Actual 8.4 account metadata reports `caching_sha2_password`, and the PHP runtime connects successfully. No legacy authentication override is configured; do not reenable `mysql_native_password` to bypass client compatibility |
| Charset/collation | Laravel connections use `utf8mb4` / `utf8mb4_unicode_ci`; information_schema confirms all 24 tables are InnoDB with that collation. Retain it explicitly rather than silently adopting a different server default |
| UUIDs | Domain keys are `CHAR(36)`, not binary UUIDs. Preserve representation/collation; application generation uses UUID strings. No UUID storage redesign today |
| Timestamp precision | Posts, comments and messages use nullable `TIMESTAMP(6)`; other Eloquent timestamps use precision 0. Fixture microseconds are included in restore hashes |
| SQL modes | Both connections use `ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION`; no relaxed mode workaround |
| Foreign keys | Existing business FKs reference primary keys. No dependency on nonunique parent indexes or generated columns was found |
| Migrations | All 26 migrations apply on empty 8.4. Day 5 restore retains the 26-entry migration ledger |
| Data | Restored hashes cover every column, including IDs, relationships, microseconds, UTF-8/emoji text, nullable targets and read state; media bytes are checked separately |

MySQL 8.4 disables the old native-password plugin by default and tightens nonstandard FK behavior. See [8.4 changes](https://dev.mysql.com/doc/refman/8.4/en/mysql-nutshell.html) and [PDO MySQL](https://www.php.net/manual/en/ref.pdo-mysql.php). Day 5 adds two virtual generated conversation columns; migrations declare no stored routines, events, triggers or custom SQL functions. MySQL Shell's upgrade checker, production-scale query plans, external database accounts and real-volume compatibility have not been verified; run the checker against a protected copy of the actual environment before cutover.

## Actual schema

Unless stated otherwise, `id` is the UUID primary key, `created_at`/`updated_at` are nullable timestamps, and required columns are non-null. **No application table has soft deletes.** MySQL creates supporting indexes for foreign keys; these are distinct from the additional indexes listed below. `CASCADE` means deleting the parent deletes the row; `SET NULL` retains it.

| Table | Columns, nullability and relationships | Unique/composite indexes and invariant gaps |
| --- | --- | --- |
| `users` | UUID PK; required `user_name`, `email`, `password`, `is_admin` (default false); nullable `email_verified_at`, `remember_token`, `blocked_at` | Separate unique username/email; a user can exist without a profile |
| `profiles` | Required user FK → users CASCADE, first/last name; nullable bio, `profile_picture_URL`, location, birthdate | Day 5 unique `user_id`; zero profiles remains possible |
| `posts` | Required author FK → users CASCADE; nullable text content; timestamps(6) | Indexes `created_at`, `(user_id,created_at)`; DB permits an empty post without media |
| `comments` | Required author FK → users CASCADE and content; nullable post FK → posts CASCADE; timestamps(6) | `(post_id,created_at)`; NULL post is permitted |
| `likes` | Required user FK → users CASCADE; nullable post FK → posts CASCADE | Unique `(user_id,post_id)` protects non-null pairs; NULL targets are still allowed |
| `conversations` | Required `user_id1`, `user_id2` FKs → users CASCADE; virtual canonical pair; nullable `last_message_id` → messages SET NULL | Day 5 canonical pair unique + distinct CHECK; last message may still belong to another thread |
| `groups` | Required name, owner FK → users CASCADE; nullable description, profile picture, last-message FK → messages SET NULL | Owner need not be a member at DB level; pointer need not belong to group |
| `group_users` | Required group/user FKs, both CASCADE; nullable timestamps | Day 5 unique `(group_id,user_id)`; no separate ID/declared primary key |
| `messages` | Required sender FK → users CASCADE; nullable message text, receiver/user FK, conversation FK, group FK (all SET NULL), `read_at`, `client_uuid`; timestamps(6) | Unique `(sender_id,client_uuid)`; indexes `(conversation_id,created_at)`, `(group_id,created_at)`; target exclusivity and participant agreement absent |
| `file_attachments` | Nullable message/post FKs, both SET NULL; required name(255), path(1024), MIME(255), signed BIGINT size | Neither exactly-one-owner nor nonnegative size enforced; DB does not verify file existence or disk privacy |
| `notifications` | UUID PK; required type, `notifiable_type`, UUID `notifiable_id`, TEXT data; nullable read timestamp | Indexes `(notifiable_type,notifiable_id)` and `(notifiable_type,notifiable_id,read_at)`; no recipient FK; TEXT does not enforce valid JSON |
| `oauth_auth_codes` | String(100) PK; required **BIGINT user_id**, BIGINT client_id, revoked; nullable scopes and DATETIME expiry; no timestamps | User index; no FKs; user ID type conflicts with UUID users |
| `oauth_access_tokens` | String(100) PK; nullable **CHAR(36) user_id** after later migration, name, scopes, DATETIME expiry; required BIGINT client_id, revoked; timestamps | User index, no FKs; only this OAuth user-ID column was converted |
| `oauth_refresh_tokens` | String(100) PK; required access-token string(100), revoked; nullable DATETIME expiry; no timestamps | Access-token index; no FK |
| `oauth_clients` | Auto BIGINT PK; nullable **BIGINT user_id**, secret(100), provider; required name, redirect, personal/password/revoked flags; timestamps | User index; no FKs; personal clients normally have NULL user |
| `oauth_personal_access_clients` | Auto BIGINT PK; required client ID, timestamps | Neither client FK nor unique client constraint |
| `password_reset_tokens` | Email string PK, required token, nullable created timestamp; no updated timestamp | No user/email FK; credentials must never appear in preflight output |
| `sessions` | String PK; nullable **BIGINT user_id**, IP(45), user agent; required payload, integer last_activity; no Eloquent timestamps | User and last-activity indexes, no FK; UUID mismatch matters if database sessions are enabled |
| `cache`, `cache_locks` | String key PK; required value/owner and integer expiration; no timestamps/FKs | Framework cache/lock data, including rate limits |
| `jobs` | Auto BIGINT PK; required queue, payload, unsigned tiny attempts, unsigned integer available/created; nullable unsigned reserved timestamp | Queue index, no FKs; timestamps are epoch integers |
| `job_batches` | String PK; required name, total/pending/failed integer counts, failed-ID text, integer created; nullable options, cancelled/finished integers | No FKs; batch counts have no domain CHECKs |
| `failed_jobs` | Auto BIGINT PK; required UUID, connection, queue, payload, exception, failed timestamp default current | Unique UUID; no FKs; payload/exception may contain sensitive data |
| `migrations` | Auto integer PK, required migration string and batch integer | Laravel migration ledger, not a domain model |

There are 24 tables including the ledger. There are no goal, milestone, check-in, streak or challenge tables. Historical `down()` methods are not a safe data rollback: converting access-token UUIDs back to BIGINT loses meaning, restoring non-null post content fails on image-only posts, and reducing timestamp precision loses microseconds.

## Invariants and lifecycle findings

| Expected invariant | Actual guarantee / concrete behavior |
| --- | --- |
| Exactly one profile per user | Registration creates both transactionally; DB now permits at most one, but does not require existence |
| One like per user/post | Unique index works for non-null pairs on MySQL (error 1062); NULL post still allowed |
| One membership per group/user | Unique pair plus expected-conflict recovery; concurrent service calls resolve one membership |
| One conversation per unordered pair | Canonical generated pair unique index rejects exact/reversed duplicates; callers recover one ID |
| Direct message | `group_id IS NULL`, non-null conversation and receiver; sender/receiver must be the two distinct participants |
| Group message | Non-null group; conversation and receiver NULL; service checks sender's current membership when sending |
| Historical group sender | A removed member's older message remains valid history. Current membership is not a retroactive history constraint |
| Message retry | DB rejects duplicate non-null sender/client UUIDs; sequential and simultaneous first-message retries return the original authorized resource |
| Attachment ownership | Exactly one existing post/message, valid metadata and readable file on the correct disk; only non-null parent existence is enforced |
| Thread last-message pointer | FK ensures an existing message, not that it belongs to the same thread or is chronologically newest |
| Group owner membership | Service autojoins owner and prohibits removing owner; raw SQL can remove owner membership |
| Deleting a group | Pivot rows cascade; messages remain with NULL group. They fail target readiness checks and the existing access check still denies retrieval (403 verified on MySQL) |
| Deleting users/messages/posts | Sender messages cascade; receiver/conversation/group targets can become NULL; attachment owners become NULL. Post service explicitly removes attachment metadata/files, but raw cascades bypass file cleanup |

Orphan retention is an existing lifecycle choice, not proof of unauthorized access. A strict target CHECK would conflict with today's SET NULL actions; settle retention before enforcing it. Notification payloads may legitimately reference deleted activity. Preflight verifies recipients, not every historical payload target.

## Read-only preflight

From a correctly configured Laravel runtime:

```text
php artisan elevateu:db-preflight
php artisan elevateu:db-preflight --json --sample=0
```

There are **50 data checks**: the 46 Day 4 checks plus null/malformed conversation participants and message/last-pointer references involving duplicated conversations. Read-only schema metadata also reports the installed uniqueness and self-conversation guarantees. Existing data checks remain active after constraints are installed.

Exit **0** means no blocking data violation; **1** means blocking violations; **2** means an invalid sample option. SQL/connection errors fail. The unknown notification type is a warning; the two duplicate-thread reference inventories are informational. Other data violations still affect overall `ok`, while only the six conditions in `ConstraintReadiness::CHECKS` block these three migrations. Review all findings before deployment. `--sample` accepts 0–20, default 5. Output contains meanings, states, counts and bounded UUID samples; credential IDs, content, paths, emails, passwords and tokens are never projected.

Counts can overlap. A duplicate count is the number of duplicate key groups, not the number of excess rows. The command starts a repeatable-read, read-only MySQL transaction and rolls it back; the query catalog contains SELECTs only. Tests verify no data statements are issued. Numeric ancillary user IDs are explicitly cast to strings to avoid false UUID matches through MySQL numeric coercion.

This report observes data and installed schema guarantees. It does not install constraints, verify file bytes, parse notification JSON, audit stored grants or repair anything. Unconstrained rules can still be violated by future writes. Full scans/groupings can be expensive on a large dataset: use a read-only account, a quiet window and measured runtime. Long snapshots retain undo history. Investigate failures with protected access; do not publish sampled IDs as public telemetry.

## Factories and demo fixtures

`User::factory()` deliberately remains a bare user for auth/missing-profile tests; use `User::factory()->withProfile()` for a complete account. Related post/comment/like/group/conversation factories create valid profiles automatically. Conversation factories create distinct fresh users and canonicalize their order; they no longer select arbitrary existing users or loop on an empty database. Explicitly reuse an existing conversation via `Message::factory()->inConversation($conversation)`.

`Group::factory()` creates owner membership; `GroupUser::factory()` supplies valid parents. `Message::factory()` makes a direct message whose participants match its conversation; `inGroup($group)` creates a valid owner-sent group message. Both initialize the appropriate last-message pointer. Attachment factories create a fully decodable synthetic 1×1 PNG on the correct public/private disk; `forMessage($message)` switches ownership. Use `Storage::fake()` in unit tests. Explicitly repeating the same pair still needs the caller to reuse a record; factories do not substitute for missing DB constraints.

`DatabaseSeeder` is now an explicit no-op. Demo creation is a separate `DemoSeeder`, never an automatic production initialization step. It requires all of:

- Environment `local` or `testing`.
- Actual database name `elevateu_demo` or `elevateu_audit` (SQLite `:memory:` allowed only in tests).
- `ELEVATEU_DEMO_ENABLED=true` and an operator-supplied password of 12–72 bytes. No default login credential.

The v1 dataset has fixed UUIDv5 identities and September 1, 2026 timestamps: **6 users/profiles, 6 posts, 6 comments, 6 likes, 2 conversations, 2 groups, 6 memberships, 12 messages, 2 attachments and 2 notifications**. Names are fictional; emails use the reserved `.example` domain. The two tiny images test actual media delivery, not portfolio photography. UTF-8/emoji, microseconds, NULL fields and read state are represented. No nonexistent product domains are seeded.

Runs insert missing fixtures and preserve existing content/passwords. They refuse identity, ownership and file-byte collisions rather than overwriting records. SQL changes roll back on failure and only newly written files are removed; rollback/collision safety is tested. A missing last pointer can be initialized. Files cannot participate in the SQL transaction, so a process crash can still leave a fixture file; run seeding serially in an isolated database, not concurrently with writes. Existing demo passwords are not rotated by rerunning.

Safe PowerShell example, after starting the disposable stack from [Development](DEVELOPMENT.md#disposable-httpwebsocket-integration-stack):

```powershell
# Run as the PHP worker user so newly created upload directories stay writable.
$env:ELEVATEU_DEMO_PASSWORD = Read-Host 'Local demo password (12-72 bytes)' -MaskInput
docker compose -p elevateu-audit -f server/docker-compose.test.yml exec --user www-data `
  -e ELEVATEU_DEMO_ENABLED=true -e ELEVATEU_DEMO_PASSWORD laravel-app `
  php artisan db:seed --class=DemoSeeder --no-interaction
Remove-Item Env:ELEVATEU_DEMO_PASSWORD
docker compose -p elevateu-audit -f server/docker-compose.test.yml exec --user www-data `
  laravel-app php artisan elevateu:db-preflight
```

`-MaskInput` requires PowerShell 7; use a secret manager or masked input equivalent on older shells. Store a demo password privately if you need to log in as `mira@elevateu.example`. There is no seeder-generated admin. Do not commit the password, and do not use `migrate:fresh` for demo setup. Normal development's database name is intentionally rejected.

## Historical Day 4 disposable upgrade rehearsal

The commands below record the original 23-migration rehearsal. At current HEAD the entrypoint applies 26 migrations and the concurrency script expects one resource. Use the Day 5 old-checkout/deploy sequence above when reproducing a pre-constraint upgrade; project labels alone do not reproduce historical code.

Use the existing Compose file, not the persistent stack. It uses tmpfs MySQL data, no published DB port, explicit test credentials, a masked `.env`, project-scoped media/key volumes and loopback API/Reverb ports. A Docker restart destroys the tmpfs database; make a verified backup outside the container before stopping it. Source files/vendor are read-only. Install dependencies before startup.

The examples use the actual rehearsal project names; only reuse them when they are yours and disposable. Commands below run from the repository root. Check `$LASTEXITCODE` after each Docker command and stop on failure. Build a current PHP image first:

```powershell
docker build -t elevateu-server:day4 server
$env:ELEVATEU_TEST_SERVER_IMAGE='elevateu-server:day4'
$env:ELEVATEU_TEST_API_PORT='18280'
$env:ELEVATEU_TEST_WS_PORT='16201'
$env:ELEVATEU_TEST_LOG_DIR='./storage/logs/day4-source'
$env:ELEVATEU_TEST_MYSQL_IMAGE='mysql:8.0.46@sha256:7dcddc01f13bab2f15cde676d44d01f61fc9f99fe7785e86196dfc07d358ae2b'
docker compose -p elevateu-day4-source -f server/docker-compose.test.yml up -d
docker compose -p elevateu-day4-source -f server/docker-compose.test.yml logs laravel-app
```

Wait for migrations and Supervisor readiness, then run `DemoSeeder` with the masked password and `--user www-data` as above, substituting `elevateu-day4-source`. Run preflight and the isolated checks:

```powershell
docker exec --user www-data elevateu-day4-source-laravel-app-1 php tests/MySql/invariants.php
docker exec --user www-data elevateu-day4-source-laravel-app-1 php tests/MySql/concurrency.php
docker exec --user www-data elevateu-day4-source-laravel-app-1 php artisan elevateu:db-preflight --sample=0
```

These scripts reject non-testing environments, other database names/hosts/drivers and DB_URL overrides. Invariant tests roll back their transaction. The race test removes only its generated IDs. Never run either against normal development.

### Logical backup and associated files

Stop application writes and DDL for a consistent DB-plus-files checkpoint. In this synthetic stack, Supervisor can stop PHP-FPM, Reverb and the queue while allowing CLI checks. Choose a new backup directory **outside the repository**:

```powershell
$rehearsalBackup = Join-Path $env:TEMP ('elevateu-rehearsal-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $rehearsalBackup | Out-Null
docker exec elevateu-day4-source-laravel-app-1 supervisorctl stop all
docker exec --user www-data elevateu-day4-source-laravel-app-1 php tests/MySql/snapshot.php |
  Set-Content -Encoding utf8 (Join-Path $rehearsalBackup 'source-snapshot.json')
docker cp server/docker/backup-audit-db.sh elevateu-day4-source-mysql-1:/tmp/backup-audit-db.sh
docker exec -e ELEVATEU_REHEARSAL=1 elevateu-day4-source-mysql-1 sh /tmp/backup-audit-db.sh
docker cp elevateu-day4-source-mysql-1:/tmp/elevateu-audit.sql (Join-Path $rehearsalBackup 'elevateu-audit.sql')
Get-FileHash -Algorithm SHA256 (Join-Path $rehearsalBackup 'elevateu-audit.sql')
docker run --rm --network none --entrypoint tar `
  --mount type=volume,source=elevateu-day4-source_audit_storage,target=/source,readonly `
  --mount "type=bind,source=$rehearsalBackup,target=/backup" elevateu-server:day4 `
  -C /source -cf /backup/storage.tar app oauth-private.key oauth-public.key
```

The guarded helper uses `umask 077`, refuses an existing output, checks InnoDB, writes a `.partial` file, checks exit status/nonempty output, renames only on success and prints SHA-256. The copied checksum must match. It runs this source-engine dump:

```sh
mysqldump -uroot --single-transaction --quick --routines --triggers --events \
  --hex-blob --default-character-set=utf8mb4 --no-tablespaces --set-gtid-purged=OFF \
  --databases elevateu_audit > /tmp/elevateu-audit.sql.partial
```

`MYSQL_PWD` comes from the **test container's** environment; no password is placed in the command or output. This helper is for the synthetic database, not a generic production backup service. For production use least-privilege backup credentials supplied through a protected option file/secret mount, encrypted storage, restrictive ACLs and a retention policy. Dumps contain password hashes, tokens and private content even though diagnostics do not. Archives contain private media and Passport keys. Preserve APP_KEY separately in the secret store; never generate a replacement on restore. The test APP_KEY is fixed and public by design.

`--single-transaction` gives consistent InnoDB rows, not nontransactional tables or filesystem consistency, and concurrent DDL invalidates that assumption. `--quick` streams rows; UTF-8 and `--hex-blob` preserve relevant encodings; routines/triggers/events are included even though this schema defines none. GTID output is intentionally disabled; this does not establish replication or point-in-time recovery. System schemas, users/grants and server configuration are not backed up. [mysqldump reference](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html).

### Restore into an empty 8.4 destination

```powershell
Remove-Item Env:ELEVATEU_TEST_MYSQL_IMAGE
$env:ELEVATEU_TEST_API_PORT='18380'
$env:ELEVATEU_TEST_WS_PORT='16301'
$env:ELEVATEU_TEST_LOG_DIR='./storage/logs/day4-restore'
docker compose -p elevateu-day4-restore -f server/docker-compose.test.yml up -d mysql
# Wait for MySQL health before copying/importing.
docker cp (Join-Path $rehearsalBackup 'elevateu-audit.sql') elevateu-day4-restore-mysql-1:/tmp/elevateu-audit.sql
docker cp server/docker/restore-audit-db.sh elevateu-day4-restore-mysql-1:/tmp/restore-audit-db.sh
docker exec -e ELEVATEU_REHEARSAL=1 elevateu-day4-restore-mysql-1 sh /tmp/restore-audit-db.sh
docker compose -p elevateu-day4-restore -f server/docker-compose.test.yml create laravel-app nginx
docker run --rm --network none --entrypoint tar `
  --mount type=volume,source=elevateu-day4-restore_audit_storage,target=/restore `
  --mount "type=bind,source=$rehearsalBackup,target=/backup,readonly" elevateu-server:day4 `
  -C /restore -xf /backup/storage.tar
docker compose -p elevateu-day4-restore -f server/docker-compose.test.yml up -d
```

The restore helper requires an empty destination **with zero tables**, a nonempty trusted dump and explicit synthetic enablement. It never disables errors with `--force`. A second import into the populated target was tested and refused. MySQL DDL is not transactional: if an import fails partway, preserve diagnostics and discard only that owned disposable destination before retrying. SQL dumps are executable input; never import untrusted dumps or extract untrusted archives.

The application entrypoint preserves restored Passport keys and now creates a personal client only when none is usable; restarting no longer adds extra client rows. It sets storage ownership for PHP workers. Docker Desktop `docker cp` against the application container can fail because of nested read-only `.env` mounts; the standalone volume archive helper above avoids that issue without touching the source bind mount.

### Validate before traffic

After application readiness, collect the restored snapshot and compare every table, not just totals:

```powershell
$restored = docker exec --user www-data elevateu-day4-restore-laravel-app-1 php tests/MySql/snapshot.php
if ($LASTEXITCODE -ne 0) { throw 'Restored snapshot/preflight failed' }
$restored | Set-Content -Encoding utf8 (Join-Path $rehearsalBackup 'restored-snapshot.json')
$before = Get-Content -Raw (Join-Path $rehearsalBackup 'source-snapshot.json') | ConvertFrom-Json
$after = $restored | ConvertFrom-Json
if (@($before.tables.psobject.Properties).Count -ne @($after.tables.psobject.Properties).Count) { throw 'Table count mismatch' }
foreach ($table in $before.tables.psobject.Properties) {
  $target = $after.tables.($table.Name)
  if ($table.Value.count -ne $target.count -or $table.Value.sha256 -ne $target.sha256) {
    throw "Restore mismatch: $($table.Name)"
  }
}
if (($before.files | ConvertTo-Json -Compress) -ne ($after.files | ConvertTo-Json -Compress)) { throw 'File mismatch' }
if (-not $before.preflight_ok -or -not $after.preflight_ok) { throw 'Integrity failure' }
docker exec --user www-data elevateu-day4-restore-laravel-app-1 php tests/MySql/invariants.php
```

The snapshot uses a read-only transaction, canonicalizes each row's columns, sorts rows and hashes all values. Output contains only counts/hashes, runtime settings and safe file identifiers. It checks synthetic attachment bytes separately. It refuses more than 10,000 rows per table and unexpected fixture paths; this is intentionally not a production data-export tool. Preflight separately checks important relationships, including cross-thread references and recipient existence. Aggregate matching alone would miss changed relationships.

Run the four scripts in [Development](DEVELOPMENT.md#disposable-httpwebsocket-integration-stack) with API `http://127.0.0.1:18380/api`, WS `16301` and log path `server/storage/logs/day4-restore/laravel.log`. Run sequentially and allow the shared 10/minute auth window to expire between suites. Keep the limiter enabled. Inspect every exit status. The fresh 8.4 rehearsal uses project `elevateu-day4-fresh`, API `18180`, WS `16101` and its own logs.

### Rollback and cleanup

For a real cutover, back up and retain the old engine/volume, storage and keys; stop writes, run actual-data preflight plus upgrade checker, restore into a new 8.4 volume, validate, then switch the application. Do not attach 8.0 to an 8.4 data directory. Before new writes, rollback can return to the untouched 8.0 checkpoint. After new writes, a switch-back would lose changes: require an explicitly tested reconciliation/replay plan or keep the application read-only until acceptance. A synthetic drill does not establish production RPO/RTO or downtime.

After inspecting each project name, `docker compose -p elevateu-day4-source -f server/docker-compose.test.yml down -v` removes only that disposable project. Repeat for `elevateu-day4-restore` and `elevateu-day4-fresh`. Never substitute normal Compose or remove its MySQL volume. Keep backups outside Git; protect/delete test mail logs and backup artifacts according to their sensitivity.

## Historical Day 4 concurrency evidence and proposals

The Day 4 version of `tests/MySql/concurrency.php` forked two independent PDO connections and paused each real repository SELECT before INSERT. On both 8.0.46 and 8.4.11 it reproduced two conversations and two memberships. That historical result motivated Day 5. The current script requires one resource and observes expected-conflict recovery; its exact checks are described at the top. Neither version is a throughput benchmark.

The script exits successfully when it reproduces this documented defect, and explicitly labels the races **UNRESOLVED**. After implementing uniqueness, change its expected outcome to one row and verify both callers succeed correctly. A pre-insert existence check, `firstOrCreate`, or a normal transaction alone cannot close these races.

The designs below are proposals for a separate migration iteration. For each, run the named SELECT-only checks in `app/Services/Database/IntegrityChecks.php`; the command is the executable preflight query catalog. Back up dirty rows and record decisions externally under protected access. **Do not delete users or silently merge content.**

| Constraint | Dirty-data preflight and cleanup | Migration and concurrency behavior | Rollback implications |
| --- | --- | --- | --- |
| One profile per user | `duplicate_profiles`, `missing_profiles`, `orphan_profiles_user_id`; compare fields, choose survivor with reviewed merge rules; create missing profiles only from known data | Add unique `profiles(user_id)` in a new migration after cleanup. Transactional account creation remains responsible for existence; catch uniqueness conflicts in any repair path | Dropping index permits duplicates again; cannot reconstruct merged profile fields without saved mapping/backup |
| One group membership | `duplicate_group_users`, `owners_without_membership`, group/user orphans; consolidate duplicate timestamps deliberately and restore missing owner membership | Add unique `(group_id,user_id)`; consider composite PK separately since existing Eloquent model assumes a conventional ID. Catch duplicate-key race and return the existing membership. Lock group row when owner/membership lifecycle changes compete | Dropping key does not restore removed duplicate rows; uniqueness must remain until callers can tolerate old behavior |
| One unordered conversation | `duplicate_conversation_pairs`, `reversed_conversation_pairs`, `self_conversations`, invalid last pointers; map losing conversation IDs to survivor, repoint messages and relevant notification references, preserve client/deep-link mapping, recompute last message | Normalize participant IDs and store lower UUID first, CHECK distinct canonical order plus UNIQUE `(user_id1,user_id2)`. A plain ordered UNIQUE is insufficient. Deploy canonical writes first; gate writes during cleanup/index installation. On unique conflict, roll back/retry with the existing conversation, then insert message | Keep a protected merge mapping and backup; dropping key cannot unmerge history. Both old/new readers must resolve both orders during rollout; no automatic data-destructive down migration |
| Valid message targets | `invalid_message_targets`, `direct_message_participants`, `empty_messages` and message FK checks; classify deletion orphans separately from corruption | First decide retain/archive/delete semantics and replace conflicting SET NULL behavior. Then add direct/group target CHECK. Cross-row participant/membership rules remain transactional service checks (SQL CHECK cannot query another table). Preserve already-removed senders' historical group messages | Dropping CHECK widens writes but cannot undo retention cleanup. Do not delete retained messages merely to make a CHECK pass |
| Attachment integrity | `invalid_attachment_owner`, `invalid_attachment_metadata`, attachment FKs; inventory actual disk bytes separately; quarantine orphans with review | Resolve retention/cascade policy first, then exactly-one-owner and size>=0 CHECKs. Keep private-disk/path enforcement in services; schedule file deletion after commit with retry/compensation | Restoring metadata alone does not restore deleted bytes. Retain media backup; dropping CHECK cannot recover files |
| Required post targets | `comments_without_post`, `likes_without_post`, respective FK checks; quarantine/reconcile targetless rows using known references | New NOT NULL columns only after cleanup; retain existing like unique index. Handle duplicate-key conflicts without toggling twice under concurrent requests | Nullable rollback reopens invalid states; cleaned rows need backup if restoration is necessary |
| Valid last-message pointers | `invalid_conversations_last_message`, `invalid_groups_last_message`; recompute from each thread with stable timestamp/ID order | Retain existing FK; update parent under appropriate thread lock and test concurrent writes/deletes. Cross-thread DB guarantees would need a separately designed composite relationship and careful handling of circular references; not an ad hoc CHECK | Saved old pointers aid review; replacing them does not delete messages. Do not introduce an untested circular cascade |
| UUID ancillary user IDs | Eight `orphan_oauth_*` / `orphan_sessions_user_id` checks plus schema inspection; numeric legacy IDs cannot safely be inferred as UUIDs | New migrations for auth-code/client/session user ID types, then chosen FKs/retention. Disabled OAuth and array sessions reduce current exposure but do not fix schema. Review existing grants/client flows before enforcing | CHAR36 back to BIGINT is unsafe. Prefer forward repair; retain backup rather than a lossy down conversion |

The first three rows above preserve the Day 4 design proposal for historical context; the implemented virtual-column design and deployment order at the top supersede that proposal. All future index additions need measured lock/DDL behavior on a representative copy. Day 5 verifies concurrent sender/client UUID recovery; a different-payload conflict policy and process-crash delivery recovery remain undecided.

## Day 4 verification and remaining limits

Final commands and results are recorded in [SECURITY.md](SECURITY.md). Fresh and restored schemas, row hashes, actual file bytes, FK/unique rejection, orphan denial and both race schedules are separately checked. No browser visual audit, live mail, production TLS, OS security scan, production-size load test, persistent-data cleanup or actual persistent cutover is claimed.

Day 5 implements the bounded constraint rollout described at the top. Message/attachment lifecycle constraints still require a retention decision. Day 6 should follow the controlled accessibility/responsive foundation iteration; no new product domain is started automatically.

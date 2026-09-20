# Database integrity and MySQL upgrade runbook

Day 4, September 19–20, 2026. This inventory comes from all 23 migrations, models, repositories and services, with isolated MySQL verification. No historical migration was rewritten and no new constraint was applied. Normal development data was neither migrated nor seeded.

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
| Migrations | All 23 existing migrations apply chronologically on an empty 8.4 database. Restored migration history contains the same 23 records |
| Data | Restored hashes cover every column, including IDs, relationships, microseconds, UTF-8/emoji text, nullable targets and read state; media bytes are checked separately |

MySQL 8.4 disables the old native-password plugin by default and tightens nonstandard FK behavior. See [8.4 changes](https://dev.mysql.com/doc/refman/8.4/en/mysql-nutshell.html) and [PDO MySQL](https://www.php.net/manual/en/ref.pdo-mysql.php). No stored routines, events, triggers, generated columns or custom SQL functions are declared by this application's migrations. MySQL Shell's upgrade checker, production-scale query plans, external database accounts and real-volume compatibility have not been verified; run the checker against a protected copy of the actual environment before cutover.

## Actual schema

Unless stated otherwise, `id` is the UUID primary key, `created_at`/`updated_at` are nullable timestamps, and required columns are non-null. **No application table has soft deletes.** MySQL creates supporting indexes for foreign keys; these are distinct from the additional indexes listed below. `CASCADE` means deleting the parent deletes the row; `SET NULL` retains it.

| Table | Columns, nullability and relationships | Unique/composite indexes and invariant gaps |
| --- | --- | --- |
| `users` | UUID PK; required `user_name`, `email`, `password`, `is_admin` (default false); nullable `email_verified_at`, `remember_token`, `blocked_at` | Separate unique username/email; a user can exist without a profile |
| `profiles` | Required user FK → users CASCADE, first/last name; nullable bio, `profile_picture_URL`, location, birthdate | `user_id` is **not unique** despite `User::profile()` being `hasOne` |
| `posts` | Required author FK → users CASCADE; nullable text content; timestamps(6) | Indexes `created_at`, `(user_id,created_at)`; DB permits an empty post without media |
| `comments` | Required author FK → users CASCADE and content; nullable post FK → posts CASCADE; timestamps(6) | `(post_id,created_at)`; NULL post is permitted |
| `likes` | Required user FK → users CASCADE; nullable post FK → posts CASCADE | Unique `(user_id,post_id)` protects non-null pairs; NULL targets are still allowed |
| `conversations` | Required `user_id1`, `user_id2` FKs → users CASCADE; nullable `last_message_id` → messages SET NULL | No pair uniqueness, ordering or distinct-participant constraint; last message may belong to another thread |
| `groups` | Required name, owner FK → users CASCADE; nullable description, profile picture, last-message FK → messages SET NULL | Owner need not be a member at DB level; pointer need not belong to group |
| `group_users` | Required group/user FKs, both CASCADE; nullable timestamps | **No primary key, ID or unique pair**; Eloquent relationship/`firstOrCreate` cannot guarantee uniqueness |
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
| Exactly one profile per user | Registration creates both transactionally; DB permits zero or several profiles |
| One like per user/post | Unique index works for non-null pairs on MySQL (error 1062); NULL post still allowed |
| One membership per group/user | Not guaranteed; concurrent service calls produced two identical pivot rows |
| One conversation per unordered pair | Repository checks both orders before insertion; neither exact nor reversed duplicates are prevented |
| Direct message | `group_id IS NULL`, non-null conversation and receiver; sender/receiver must be the two distinct participants |
| Group message | Non-null group; conversation and receiver NULL; service checks sender's current membership when sending |
| Historical group sender | A removed member's older message remains valid history. Current membership is not a retroactive history constraint |
| Message retry | DB rejects duplicate non-null sender/client UUIDs; sequential API retries work. Simultaneous collisions still need application recovery |
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

There are **46 checks**: duplicate profiles/memberships/likes/ordered and unordered conversation pairs, reversed pairs, self conversations, missing profiles/owner memberships, 17 business-FK orphan checks, nullable comment/like targets, malformed/empty messages and posts, direct participants, attachment ownership/metadata, two thread pointers, notification recipients/types, and eight ancillary OAuth/session references.

Exit **0** means no blocking data violation; **1** means blocking violations; **2** means an invalid sample option. SQL/connection errors also fail rather than being treated as clean. `unknown_notification_type` is a warning requiring review; all other checks block constraint readiness. `--sample` accepts 0–20, default 5. Output includes meanings, counts and limited UUID samples. OAuth/session credential IDs are redacted; contents, paths, emails, passwords and tokens are never projected.

Counts can overlap. A duplicate count is the number of duplicate key groups, not the number of excess rows. The command starts a repeatable-read, read-only MySQL transaction and rolls it back; the query catalog contains SELECTs only. Tests verify no data statements are issued. Numeric ancillary user IDs are explicitly cast to strings to avoid false UUID matches through MySQL numeric coercion.

This is a **data-readiness report**, not a guarantee that future writes cannot violate invariants. It does not install constraints, verify file bytes, parse notification JSON, audit stored grants or repair anything. Full scans/groupings can be expensive on a large dataset: use a read-only account, a quiet window and measured runtime. Long snapshots retain undo history. Investigate failures with protected access; do not publish sampled IDs as public telemetry.

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

## Reproduce the disposable upgrade rehearsal

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

## Concurrency evidence and safe constraint designs

`php tests/MySql/concurrency.php` forks two independent PDO connections and pauses each **real repository SELECT** after it returns but before either INSERT. It then invokes the real message/group service paths. On **both 8.0.46 and 8.4.11**, the result is **two conversations for one unordered pair and two memberships for one group/user**. Preflight detects both. The barrier selects a permitted interleaving; it is not a raw-insert substitute or a throughput benchmark.

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

All index additions need measured lock/DDL behavior on a representative copy; online DDL is not a promise of zero locking. Neither default collation equality nor lowercase UUID normalization should be changed casually. Existing `(sender_id,client_uuid)` uniqueness also needs concurrent duplicate recovery and conflict-payload policy; sequential retry coverage is not sufficient.

## Day 4 verification and remaining limits

Final commands and results are recorded in [SECURITY.md](SECURITY.md). Fresh and restored schemas, row hashes, actual file bytes, FK/unique rejection, orphan denial and both race schedules are separately checked. No browser visual audit, live mail, production TLS, OS security scan, production-size load test, persistent-data cleanup or actual persistent cutover is claimed.

Day 5 should first implement a narrow, rehearsed constraint rollout (profiles and memberships, then canonical conversations) with explicit dirty-data refusal/merge plans and concurrent conflict recovery. Message/attachment lifecycle constraints require a retention decision first. Do not begin goals or an authentication/UI rewrite to bypass these data guarantees.

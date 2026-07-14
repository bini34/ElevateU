# ElevateU

A social media platform: feed with posts, likes and comments, real-time
direct & group chat, live notifications, and user profiles.

| Layer     | Stack |
|-----------|-------|
| Client    | Next.js 15 (App Router), React 18, Tailwind CSS |
| API       | Laravel 11, Laravel Passport (bearer tokens) |
| Realtime  | Laravel Reverb (Pusher protocol over WebSockets) + Laravel Echo |
| Database  | MySQL 8 |
| Dev infra | Docker Compose (php-fpm + nginx + MySQL + Reverb + queue worker) |

## Features

- **Auth** — register, login, logout, change password (revokes other
  sessions), email-based password reset, protected routes, expired-session
  handling. Personal access tokens expire after 30 days.
- **Feed** — infinite scroll, newest-first, optimistic likes with per-user
  state, comments (create / edit / delete by author or post owner),
  create posts with up to 10 images/videos, edit & delete own posts.
- **Chat** — real-time direct messages with delivery over WebSockets,
  automatic reconnection with gap-fill, typing indicators (whispers),
  online presence, read receipts, idempotent sends (`client_uuid` — a
  retry can never duplicate a message), paginated history, group chat.
- **Notifications** — real-time on likes, comments and direct messages;
  unread badges, mark-read/mark-all, toast on arrival.
- **Profiles** — public profile pages (`/{username}`) with the user's
  posts, avatar upload, bio/location/birthday editing.

## Getting started (development)

Prerequisites: Docker Desktop and Node.js ≥ 20. PHP is **not** required on
the host — every artisan command runs inside the container.

### 1. API stack

```bash
cd server
cp .env.example .env          # then fill in values (see Environment below)
docker compose up -d --build
docker compose exec laravel-app composer install
docker compose exec laravel-app php artisan key:generate
docker compose exec laravel-app php artisan migrate
docker compose exec laravel-app php artisan passport:keys
docker compose exec laravel-app php artisan passport:client --personal
# copy the printed Client ID/secret into .env as
# PASSPORT_PERSONAL_ACCESS_CLIENT_ID / PASSPORT_PERSONAL_ACCESS_CLIENT_SECRET
docker compose exec laravel-app php artisan storage:link
```

The API is served by nginx at **http://localhost:8080** (routes under
`/api`), websockets at **ws://localhost:6001**, MySQL on host port 3307.
The app container runs php-fpm, Reverb and a queue worker under
supervisord (`docker compose exec laravel-app supervisorctl status`).

### 2. Client

```bash
cd client
cp .env.example .env.local    # defaults match the docker stack
npm install
npm run dev                   # http://localhost:3000
```

## Environment

Server (`server/.env`) — beyond the Laravel defaults:

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Public origin of the API (`http://localhost:8080`); storage URLs derive from it |
| `FRONTEND_URL` | Where password-reset links send users (`http://localhost:3000`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origin allowlist; `*` for dev |
| `PASSPORT_PERSONAL_ACCESS_CLIENT_ID` / `_SECRET` | From `passport:client --personal` |
| `REVERB_APP_ID` / `_KEY` / `_SECRET` | Reverb app credentials |
| `REVERB_HOST` / `REVERB_PORT` / `REVERB_SCHEME` | Public websocket endpoint (`localhost` / `6001` / `http` in dev) |

Client (`client/.env.local`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | API base **including** `/api` (`http://localhost:8080/api`) |
| `NEXT_PUBLIC_REVERB_APP_KEY` | Must match the server's `REVERB_APP_KEY` |
| `NEXT_PUBLIC_REVERB_HOST` / `_PORT` / `_SCHEME` | Websocket endpoint (`localhost` / `6001` / `http`) |

## Testing

End-to-end suites exercise the running docker stack over real HTTP and
WebSockets (126 assertions total):

```bash
node scripts/feed-e2e.mjs           # posts, likes, comments, uploads, ownership (51)
node scripts/chat-e2e.mjs           # messaging incl. live websocket delivery (32)
node scripts/profile-e2e.mjs        # profiles, avatar, password flows (23)
node scripts/notifications-e2e.mjs  # live notifications, unread counts (20)
```

Each run registers throwaway users with `...@example.com` emails; remove
them with
`DELETE FROM users WHERE email LIKE '%@example.com'` when they clutter
the chat list.

Client production build (must pass with zero errors):

```bash
cd client && npm run build
```

## Architecture

```
client/src
  app/            Next.js routes (feed, chat, groups, profile, settings, auth)
  components/     UI components (PostCard, chat bubbles, notification bell, ...)
  context/        AuthContext, NotificationContext, DataContext
  hooks/          echo (websocket singleton), usePosts, useOnlineUsers, ...
  lib/            API layers per feature (post, message, profile, notifications)
  utils/fetcher   axios wrapper: bearer token, X-Socket-Id, 401 handling

server/app
  Http/Controllers   thin controllers (validation + auth identity)
  Services           domain logic & authorization (ownership, membership)
  Repositories       query layer (eager loading, pagination)
  Events             MessageSent / MessagesRead (broadcast now)
  Notifications      ActivityNotification (database + broadcast)
```

Realtime channels: `conversations.{id}` (private, participants),
`groups.{id}` (private, members), `online` (presence),
`App.Models.User.{id}` (private, notifications). Channel auth lives in
`server/routes/channels.php`; typing indicators are client whispers and
never touch the server.

The full endpoint list is in [docs/API.md](docs/API.md).

## Deploying to production

1. **Secrets**: generate fresh `APP_KEY`, Reverb credentials and OAuth
   secrets; never commit `.env` (images exclude it via `.dockerignore`).
2. **Server env**: `APP_ENV=production`, `APP_DEBUG=false`, real `APP_URL`
   and `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS=https://your-client-origin`,
   `REVERB_SCHEME=https`.
3. **Server image**: `docker build -t elevateu-api server/` — runs
   php-fpm + Reverb (:6001) + queue worker under supervisord; put nginx
   (see `server/nginx/default.conf`) in front for `/api` and `/storage`,
   and terminate TLS + proxy websockets to :6001.
4. **One-time provisioning** inside the container: `php artisan migrate`,
   `passport:keys`, `passport:client --personal`, `storage:link`.
5. **Client image**: build with your public values baked in —
   see the build-args header in `client/Dockerfile`. Runs `node server.js`
   (standalone) on :3000 as a non-root user.
6. Persist `storage/app/public` (uploads) and the MySQL data volume; use a
   non-root MySQL user with a strong password.

## License

MIT — see [LICENSE.txt](LICENSE.txt).

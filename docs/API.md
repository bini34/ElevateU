# ElevateU API

Base URL: `{APP_URL}/api` (dev: `http://localhost:8080/api`).

Most application responses have the shape `{ "status": "success|error", "message": ..., "data": ... }`.
Exceptions: `GET /user` returns the raw user; Laravel validation/auth/access errors
use framework JSON (`message`, optionally `errors`); group-create validation returns
`errors`; broadcasting authorization returns Pusher's auth shape; private attachments
return binary bytes. Registration/login validation currently uses HTTP 400 with a
message array. Do not assume one universal error envelope.

Paginated feed/comment/like/history/notification endpoints return a Laravel paginator
inside `data` (`data.data`, `data.next_page_url`, `?page=N`). `per_page` must be a
positive integer and is capped at 50. Message-card and group lists are arrays,
not paginators. Search/list ordering uses timestamp plus UUID where implemented.

**Auth**: send `Authorization: Bearer <token>` on every route except the
public auth endpoints. Send `X-Socket-Id: <echo socket id>` on writes so
your own websocket doesn't receive an echo of the event you caused.
All API routes have a 120 requests/min budget per authenticated Passport user,
otherwise per IP. Register/login/forgot/reset share an additional 10/min per-IP
budget. `429` includes `Retry-After`. A persistent cache store is required across
HTTP requests. Errors: `401` unauthenticated, `403` not allowed, `404` missing or
owner-scoped lookup, `422` validation (except legacy auth 400 noted above).
Protected API responses use private/no-store caching. Bearer and X-Socket-Id
contracts are unchanged.

## Auth

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | `first_name, last_name, user_name, email, password, password_confirmation` → user + token |
| POST | `/auth/login` | `email, password` → user + token |
| GET | `/auth/me` | Current user with profile |
| GET | `/user` | Same authenticated identity as me, but raw user response |
| POST | `/auth/logout` | Revokes the current token |
| POST | `/auth/change-password` | `current_password, password, password_confirmation`; revokes other sessions |
| POST | `/auth/forgot-password` | `email`; always answers success |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation`; revokes all sessions |
| GET | `/auth/{provider}/redirect` · `/auth/{provider}/callback` | Google/Facebook deliberately unavailable (503); unsupported provider 404. No redirect, account linking or token issuance. |

Passwords require at least 8 characters when created/changed/reset and accept at most
4096 characters across those routes and login. Login returns a generic 401 for wrong
credentials. Forgot-password is account-neutral for valid input; malformed input and
shared rate-limit exhaustion still return validation/429 errors. Invalid, expired,
reused and unknown-account reset links share the same 422 response.

## Users & profiles

| Method | Path | Notes |
|--------|------|-------|
| GET | `/users/{id}` | User with profile |
| GET | `/profiles/{userName}` | User + profile + `posts_count` |
| PUT | `/profile` | Own profile: `first_name, last_name, bio, location, birthdate` |
| POST | `/profile/avatar` | multipart `avatar` (image ≤ 5 MB) |

## Posts

| Method | Path | Notes |
|--------|------|-------|
| POST | `/post` | multipart: `content` and/or `file[]` (≤10 files, 20 MB each) → full post |
| GET | `/posts` | Feed, newest first; each post has `user.profile`, `attachments[].url`, `likes_count`, `comments_count`, `is_liked` |
| GET | `/posts/search?query=` | Content search |
| GET | `/posts/{id}` | Single post with details |
| PUT | `/posts/{id}` | Own post: `content` |
| DELETE | `/post/{id}` | Own post; deletes attachment files |
| GET | `/user/{userId}/posts` | A user's posts |

## Likes & comments

| Method | Path | Notes |
|--------|------|-------|
| POST | `/posts/{id}/like` | Toggle; → `{ liked, likes_count }` |
| GET | `/posts/{id}/likes` | Users who liked |
| POST | `/posts/{id}/comments` | `content` → comment with author |
| GET | `/posts/{id}/comments` | Oldest first |
| PUT | `/comments/{id}` | Own comment |
| DELETE | `/comments/{id}` | Comment author **or** post owner |

## Chat

| Method | Path | Notes |
|--------|------|-------|
| GET | `/message-cards` | Chat list: conversations (last message, `unread_count`) + users to start with |
| GET | `/conversations/with/{userId}` | Read-only peer card + `conversation_id` (null until first message); self lookup returns 422 |
| GET | `/conversations/{id}/messages` | Participants only; newest page first |
| POST | `/conversations/{id}/read` | Mark incoming as read; broadcasts `messages.read` |
| POST | `/messages` | multipart: `message` and/or `files[]`, `receiver_id` **or** `group_id`, `client_uuid` (idempotency key — retries return the original, 200 instead of 201) |
| GET | `/messages/{id}` | Participants only |
| GET | `/groups/{groupId}/messages` | Members only |

## Groups

Direct participant order does not affect conversation identity or authorization. Concurrent first messages resolve the same conversation ID. A repeated `(sender,client_uuid)` returns the original authorized message with 200; first creation returns 201. Only creation emits the message event and notification. The original payload wins if a key is reused with different content; payload-fingerprint conflict semantics remain a future contract decision. No new conversation-create endpoint exists. Self messaging returns 422 before database insertion.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/group` | `name, description, profile_picture`; owner = caller |
| GET | `/groups/{id}` · PUT `/group/{id}` · DELETE `/group/{id}` | Members can read; owner alone can update/delete. Updates allow name/description only. |
| POST | `/group/{id}/add-user` · `/group/{id}/remove-user` | Owner only; validated `user_id`; owner cannot be removed |
| GET | `/users/{userId}/groups` | Own membership list only; another user's list returns 403 |

Adding an existing member, including after a competing add, remains an idempotent 201 success with the existing response envelope. It does not add another pivot row. Profile creation is internal to registration; repeated repository creation returns the existing profile without changing its fields. Updates remain explicit. Unexpected database errors return `{"message":"Server Error"}` with 500, including when debug mode is enabled; SQL, bindings and stack traces are not exposed.

## Private message attachments

`GET /message-attachments/{attachmentId}` requires a bearer token. Only direct
message participants or current group members may download. Guests receive 401,
outsiders 403, missing/invalid/non-message attachments 404. Removed group senders
also lose access. Message attachment `url` now points to this endpoint; its path
and identifier are not authorization. `receiver_id` and `group_id` on message
creation are mutually exclusive; actor IDs always come from authentication.

The response is an attachment with `application/octet-stream`, `nosniff`, a
restrictive CSP and `private, no-store`. The client downloads via Axios with the
existing bearer token, renders allowlisted image blobs and revokes object URLs
on cleanup/account change. Do not put tokens in URLs or use public image
optimization for private files. Post media keeps its public storage contract.

Old `/storage/uploads/messages/*` URLs are blocked in nginx/Apache. New uploads
use the private message disk. Existing public files can be read through the
authenticated endpoint during migration; follow the verified-copy migration
procedure in [SECURITY.md](SECURITY.md) before using another static server.

## Notifications

| Method | Path | Notes |
|--------|------|-------|
| GET | `/notifications` | Paginated; `data.kind` ∈ `post_liked, post_commented, new_message` with `actor`, `text`, `snippet`, target ids |
| GET | `/notifications/unread-count` | `{ count }` |
| POST | `/notifications/{id}/read` | Own notifications only |
| POST | `/notifications/read-all` | |

## WebSockets (Reverb, Pusher protocol)

Endpoint `ws(s)://{REVERB_HOST}:{REVERB_PORT}`; authorize private/presence
channels via `POST /api/broadcasting/auth` with the bearer token.

| Channel | Type | Events |
|---------|------|--------|
| `conversations.{id}` | private (participants) | `message.sent` `{message}`, `messages.read` `{conversation_id, reader_id, read_at}`, whisper `typing` |
| `groups.{groupId}` | private (members) | `message.sent` |
| `online` | presence | member list = online users (id, user_name, name, avatar) |
| `App.Models.User.{id}` | private (owner) | notification events (Echo `.notification()`) |

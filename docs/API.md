# ElevateU API

Base URL: `{APP_URL}/api` (dev: `http://localhost:8080/api`).

Every response has the shape `{ "status": "success|error", "message": ..., "data": ... }`.
List endpoints return a Laravel paginator inside `data`
(`data.data` = items, `data.next_page_url`, `?page=N`, `?per_page=N` capped at 50).

**Auth**: send `Authorization: Bearer <token>` on every route except the
public auth endpoints. Send `X-Socket-Id: <echo socket id>` on writes so
your own websocket doesn't receive an echo of the event you caused.
All API routes are rate-limited to 120 requests/min per user (10/min for
the public auth endpoints). Errors: `401` unauthenticated, `403` not
allowed, `404` missing, `422` validation.

## Auth

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | `first_name, last_name, user_name, email, password, password_confirmation` → user + token |
| POST | `/auth/login` | `email, password` → user + token |
| GET | `/auth/me` | Current user with profile |
| GET | `/user` | Alias of `me` (Laravel convention) |
| POST | `/auth/logout` | Revokes the current token |
| POST | `/auth/change-password` | `current_password, password, password_confirmation`; revokes other sessions |
| POST | `/auth/forgot-password` | `email`; always answers success |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation`; revokes all sessions |
| GET | `/auth/{provider}/redirect` · `/auth/{provider}/callback` | Social login (google, facebook) |

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
| GET | `/conversations/with/{userId}` | Peer card + `conversation_id` (null until first message) |
| GET | `/conversations/{id}/messages` | Participants only; newest page first |
| POST | `/conversations/{id}/read` | Mark incoming as read; broadcasts `messages.read` |
| POST | `/messages` | multipart: `message` and/or `files[]`, `receiver_id` **or** `group_id`, `client_uuid` (idempotency key — retries return the original, 200 instead of 201) |
| GET | `/messages/{id}` | Participants only |
| GET | `/groups/{groupId}/messages` | Members only |

## Groups

| Method | Path | Notes |
|--------|------|-------|
| POST | `/group` | `name, description, profile_picture`; owner = caller |
| GET | `/groups/{id}` · PUT `/group/{id}` · DELETE `/group/{id}` | |
| POST | `/group/{id}/add-user` · `/group/{id}/remove-user` | `user_id` |
| GET | `/users/{userId}/groups` | Groups a user joined |

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

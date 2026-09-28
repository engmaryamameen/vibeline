# API contract

All application routes are under `/v1`. Protected routes require `Authorization: Bearer <access-token>`. Refresh authentication uses the HttpOnly `vibeline_rt` cookie. Errors use `{ "code": string, "message": string }`.

## Authentication

`POST /auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`. Login, verification and refresh return a short-lived access token; refresh tokens are opaque, rotated, hashed in PostgreSQL, and sent only as HttpOnly cookies to browser clients.

## Users

`GET /users/me` returns the safe public profile. `GET /users/search?q=...` returns up to 20 verified users for conversation creation.

## Conversations

`POST /chat/conversations` accepts `{ type: "direct"|"group", participantUserIds, title? }`. Direct conversations require exactly one other member and are de-duplicated by the stable member pair. `GET /chat/conversations` lists membership-visible conversations. `GET/PATCH /chat/conversations/:id` reads/renames a group. Member mutation is through `POST /:id/members`, `DELETE /:id/members/:userId`, and `POST /:id/leave` with owner/admin rules.

## Messages

`POST /chat/conversations/:id/messages` accepts `{ clientMessageId, body }`; retrying the same client ID returns the existing message. `GET .../messages?beforeSequence=N&limit=50` paginates older history. `afterSequence=N` recovers newer persisted messages after a realtime gap. Sender-only `PATCH` and `DELETE` edit or tombstone a message without changing its sequence.

## Realtime

`GET /chat/events` is an authenticated SSE stream. Events are hints after durable commits; clients reconcile with the REST message history and sequence cursor. The current in-process fan-out works for one API instance. Multiple API instances require a shared fan-out mechanism (for example Redis Pub/Sub) but do not change PostgreSQL's source-of-truth role.

## Operations

`GET /health/live` checks process liveness. `GET /health/ready` checks PostgreSQL and returns 503 when the dependency is unavailable.

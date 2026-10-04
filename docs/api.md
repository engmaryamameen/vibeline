# API surface

All routes are mounted under the configured API prefix, `/v1` by default.

## Authentication

`POST /auth/register` accepts `firstName`, `lastName`, `dateOfBirth` (`YYYY-MM-DD`), `email`, and `password`. Password confirmation is a client-side form invariant and is not sent to the API.

`POST /auth/login`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh`, `/auth/logout`, and `/auth/change-password` provide the password authentication lifecycle. Login, verification and refresh return a short-lived access token; refresh tokens are opaque, rotated, hashed in PostgreSQL, and sent only as HttpOnly cookies to browser clients.

Google is the only social authentication provider. Google OAuth does not provide date of birth through the current `openid email profile` scopes, so OAuth-created accounts may not have `dateOfBirth` until profile completion.

## User profile

`GET /users/me` returns the authenticated user profile.

`PATCH /users/me` updates one or more of `firstName`, `lastName`, `dateOfBirth`, and `phoneNumber`. Phone numbers use international E.164 format such as `+923001234567`; send `null` to remove a stored phone number. `displayName` remains the chat-facing compatibility field and is derived from first and last name when both are available.
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

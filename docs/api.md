# API surface

Every route is mounted under the configured API prefix, `/v1` by default. All
routes require a bearer access token except `/health/*`, `/auth/providers`, the
pre-session auth routes, and the Google OAuth redirects.

Errors are always `{ code, message }` with `code` drawn from
`apiErrorCodes` in `@vibeline/contracts`.

## Auth

| Route | Purpose |
| --- | --- |
| `GET /auth/providers` | `{ providers: { google } }`. The web client hides the Google button when it is false |
| `POST /auth/register` | `firstName`, `lastName`, `dateOfBirth` (`YYYY-MM-DD`), `email`, `password`. Confirmation is a client-side invariant and is not sent |
| `POST /auth/login` | Rate limited to 10/min per IP |
| `POST /auth/verify-email`, `/auth/resend-verification` | Token or six-digit code |
| `POST /auth/forgot-password`, `/auth/reset-password` | Token or six-digit code |
| `POST /auth/refresh` | Rotates the refresh token; reuse revokes every session for the account |
| `POST /auth/logout` | Revokes the presented refresh token and clears the cookie |
| `POST /auth/change-password`, `/auth/password` | Authenticated credential management |
| `GET /auth/google`, `/auth/google/callback` | Signed-state OAuth redirect flow |

Login, verification and refresh return a short-lived access token in the body.
Refresh tokens are opaque, rotated, hashed in Postgres, and sent only as
HttpOnly cookies.

## Users and connections

| Route | Purpose |
| --- | --- |
| `GET /users/me`, `PATCH /users/me` | Profile read and update (`firstName`, `lastName`, `dateOfBirth`, `phoneNumber` in E.164) |
| `GET /users/search?q=` | Up to 30 verified users, with the connection state between them and the caller |
| `GET /users/connections/requests` | Incoming pending requests |
| `POST /users/connections/:userId` | Send or re-send a request |
| `POST /users/connections/requests/:requestId/accept` \| `/reject` | Respond; only the addressee may |

## Conversations and messages

| Route | Purpose |
| --- | --- |
| `POST /chat/conversations` | `{ type, participantUserIds, title? }`. Direct conversations take exactly one peer and de-duplicate on the member pair |
| `GET /chat/conversations` | Membership-visible conversations with previews, unread counts and peer receipts |
| `GET /chat/conversations/:id`, `PATCH` | Read, or rename a group as owner/admin |
| `POST /:id/members`, `PATCH /:id/members/:userId`, `DELETE /:id/members/:userId`, `POST /:id/leave` | Group membership with owner/admin rules and deterministic ownership transfer |
| `POST /:id/messages` | `{ clientMessageId, body, mediaAssetIds }`. Retrying a client id returns the existing message |
| `GET /:id/messages?beforeSequence=&afterSequence=&limit=` | Paginate older history, or recover newer messages after a realtime gap |
| `PATCH`/`DELETE /:id/messages/:messageId` | Sender-only edit, or tombstone (`scope=everyone`) / hide (`scope=me`) |
| `GET /:id/reactions`, `PUT`/`DELETE /:id/messages/:messageId/reactions` | Reactions, scoped to messages the caller can see |
| `GET`/`PUT /:id/quick-emoji` | Per-member quick reaction |
| `POST /:id/receipt` | Advance delivered/read watermarks; never moves backwards |
| `POST /chat/presence` | Heartbeat; publishes one presence event to the caller's peers |
| `GET`/`POST /:id/assistant`, `POST /:id/assistant/responses` | Assistant participant and lease-based generation |

## Realtime

`GET /chat/events` is a Server-Sent Events stream, authenticated by bearer token
and scoped to the caller. Event types: `message.created`, `message.updated`,
`message.deleted`, `message.reaction`, `conversation.updated`, `receipt.updated`,
`presence.updated`, `call.updated`, `call.signal`. The stream sends a `connected`
event on open (clients use it to run catch-up) and a comment heartbeat every 25s.
A proxy in front of this route must not buffer responses.

## Media

| Route | Purpose |
| --- | --- |
| `POST /media/assets` | Raw body upload. The stored MIME type is sniffed from the bytes, not trusted from the client. Rate limited to 40/min per IP. Size caps: 10 MB image, 25 MB audio, 100 MB video |
| `GET /media/assets/:id/content` | Streams the asset. The caller must own it, be able to see a non-deleted message it is attached to, or be able to see a live story it backs |

## Calls

| Route | Purpose |
| --- | --- |
| `GET /calls/ice-servers` | STUN URLs plus per-request TURN credentials that expire |
| `GET /calls/active` | The caller's live call, for reconnect and refresh |
| `GET /calls/history?conversationId=&limit=` | Call log including missed and declined |
| `POST /calls` | `{ conversationId, media }`. 409 `CALL_BUSY` when either party is already on a call. Rate limited to 20/min per IP |
| `POST /calls/:callId/accept` \| `/decline` | Callee only |
| `POST /calls/:callId/connected` | Reported once when ICE reaches connected |
| `POST /calls/:callId/heartbeat` | Keeps the call alive; the server ends calls that stop reporting |
| `POST /calls/:callId/end` | `{ reason }`; a caller ending a ringing call records `canceled` |
| `POST /calls/:callId/signals` | `offer`, `answer` or `candidate`, validated per kind |
| `GET /calls/:callId/signals?afterSequence=` | Replay missed signalling after a reconnect |

## Stories

| Route | Purpose |
| --- | --- |
| `GET /stories/feed` | Live visible stories grouped by author, with seen/unseen counts |
| `POST /stories` | `{ mediaAssetId, caption?, durationMs? }` from an asset the caller owns. Expires 24h after creation. Rate limited to 20/min per IP |
| `GET /stories/authors/:authorUserId` | One author's live stories, chronological |
| `POST /stories/:storyId/views` | Record a view; an author viewing their own story is not counted |
| `GET /stories/:storyId/viewers` | Author only |
| `DELETE /stories/:storyId` | Author only, soft delete |

Expiry and connection-based visibility are enforced in SQL on every read,
including the media route.

## Notifications

| Route | Purpose |
| --- | --- |
| `GET /notifications/config` | VAPID public key, or null when push is not configured |
| `GET`/`PUT /notifications/preferences` | `enabled`, `messagesEnabled`, `connectionsEnabled` |
| `GET`/`PUT /notifications/conversations/:conversationId` | Per-conversation mute |
| `POST`/`DELETE /notifications/subscriptions` | Register or remove a browser subscription |

Message notifications respect `messagesEnabled` and per-conversation mute.
Connection notifications respect `connectionsEnabled`. Call notifications respect
only the global toggle and per-conversation mute, so muting message previews does
not silence an incoming call.

## Health

`GET /health/live` is a liveness probe. `GET /health/ready` checks the database
and returns 503 when it is unreachable.

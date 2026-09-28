# Engineering Review and Chat Architecture

## Executive summary

The repository supplied as `chat-app` was not an existing chat system. It was an authentication foundation: Next.js web, Fastify API, PostgreSQL/Drizzle, JWT authentication, email verification/password reset, OAuth scaffolding, shared packages, Docker/Nginx, and CI. There were no conversation/message tables, chat routes, realtime transports, or tests.

The implementation therefore preserves the useful monorepo and auth boundaries and adds the smallest durable chat core rather than inventing a distributed architecture.

## Verified problems in the original code

### Critical: unverified registrations received usable access credentials
Registration returned access and refresh tokens immediately, while generic protected-route authentication checked only token validity/type. Login rejected unverified users, but a newly registered user did not need login to call protected endpoints. Registration now creates the account and verification challenge without creating a session; a session is created after verification/login.

### High: profile serialization could expose authentication secrets
`UserService.getProfile` removed only `passwordHash` from the repository object. The repository object also contains verification/reset tokens and codes. Profile output is now an explicit allow-list of public fields. This is safer than exclusion-based serialization because future secret columns do not become public by default.

### High: no chat domain existed
UI copy claimed realtime messaging and end-to-end encryption although neither existed. Those claims were replaced with capabilities the code can support. A durable chat domain has now been added.

### High: no automated tests
The original repository contains no test/spec files. This remains a production-readiness blocker. The current sandbox cannot install the pinned pnpm toolchain because outbound npm registry access fails, so build/typecheck/test execution could not be completed here.

### Medium: access token persisted in browser storage
The Zustand auth store persists the access token in localStorage. This increases token exposure if an XSS vulnerability occurs. A stronger browser session design would keep access credentials in memory and rely on a hardened refresh/session cookie, or use a BFF/server-session model. This was not changed in the chat patch because it affects the complete frontend auth lifecycle and should be migrated deliberately.

### Medium: refresh tokens are stateless and not revocable
Refresh JWTs are not persisted as sessions, so logout only clears the browser cookie; a copied refresh token remains usable until expiry. Production session management should use server-side session records with hashed refresh-token material, rotation/reuse detection, revocation, device/session metadata, and an absolute lifetime.

### Medium: operational health is shallow
`/health` only proves the process can answer HTTP. It does not prove database readiness. Production should separate liveness and readiness and make readiness check critical dependencies with tight timeouts.

## Existing architecture retained

The monorepo split is reasonable for the current scope. `apps/web` owns browser UX/state, `apps/server` owns HTTP/business/persistence concerns, `packages/contracts` owns shared public contracts, and PostgreSQL is the source of truth. The backend's controller/service/repository direction is also appropriate when repositories represent real persistence boundaries rather than interfaces created only for ceremony.

## Chat target architecture implemented

The first chat vertical slice uses four concepts:

- `conversations`: lifecycle container and sequence allocator.
- `conversation_members`: authorization/ownership boundary.
- `messages`: immutable durable message records.
- REST chat module: authenticated creation, listing, history, and sending.

The key invariants are enforced in PostgreSQL, not only application code:

1. A message belongs to one conversation and one sender.
2. Only conversation members may read or send.
3. `(conversation_id, sequence)` is unique, providing deterministic order.
4. `(sender_id, client_message_id)` is unique, providing retry idempotency.
5. Sending locks the conversation row while allocating the next sequence, preventing two concurrent writers from receiving the same sequence.
6. History uses a sequence cursor rather than offset pagination, so newly inserted messages do not shift historical pages.
7. Non-members receive the same not-found result whether a conversation exists or not, reducing resource enumeration.

## Request lifecycle

### Send message

Client generates a UUID `clientMessageId` and POSTs a body. Authentication establishes the sender. Membership is checked. The repository checks for an already-committed idempotent result. Inside a transaction it locks the conversation row, checks the idempotency key again, allocates the current sequence, inserts the message, increments the conversation sequence, updates activity time, and commits. A retry returns the existing message.

The second idempotency check inside the lock is intentional: the first is a cheap fast path; the second protects concurrent retries.

### Read history

The caller must be a member. Messages are queried by `sequence < beforeSequence`, descending for efficient latest-first retrieval, limited to at most 100, then returned in chronological order. The oldest returned sequence becomes the next cursor.

## Why realtime is not implemented yet

WebSocket support is useful for low-latency fan-out but is not required to make message persistence correct. Adding it before the durable model would create two competing message paths. The next realtime design should keep the REST/domain write path authoritative and publish committed message events after persistence. At one instance, an in-process connection registry is sufficient. At multiple instances, Redis pub/sub or a durable event/outbox mechanism becomes justified depending on delivery requirements.

SSE is simpler for server-to-client updates but still needs a separate client-to-server POST, which is acceptable. WebSockets become more attractive when typing/presence and bidirectional ephemeral events become important.

## Deliberately deferred features

Delivery/read receipts require per-user state and clear semantics across multiple devices. Presence and typing are ephemeral and should not be modeled as durable messages. Notifications require preferences and background delivery. Attachments require object storage, malware/content validation, quotas, and signed access. Search requires product requirements before choosing PostgreSQL FTS versus a search service. Redis is not needed for correctness today. Queues are not needed until asynchronous work exists.

## Scale boundaries

At roughly 10x, add connection pooling metrics, request/message rate limits, database query telemetry, realtime fan-out, and session storage. At 100x, evaluate an outbox/event pipeline, conversation/message partitioning based on measured table size and hot-conversation behavior, read replicas for history where lag is acceptable, and distributed realtime fan-out. The per-conversation row lock deliberately serializes sends within one conversation; that is desirable for ordering but becomes a hot-key bottleneck for extremely high-volume rooms. Do not replace it until measurements show that requirement.

## Security follow-ups

Required before public production: rate limiting for auth and message endpoints; persisted/revocable refresh sessions; CSRF review for cookie-authenticated endpoints; CSP/security headers; secret rotation procedures; abuse/spam controls; request-size limits; database TLS in hosted environments; least-privilege DB credentials; audit policy for administrative actions; dependency/security scanning.

End-to-end encryption is not present and should not be claimed. Implementing real E2EE changes search, moderation, recovery, multi-device key management, notifications, and server observability and should be treated as a product architecture of its own.

## Observability and operations

Pino/Fastify logging is a useful base. Add stable request IDs, authenticated actor/conversation identifiers where safe, latency/error metrics, DB pool saturation, message-send success/duplicate/error counters, readiness checks, graceful shutdown that stops accepting requests before closing the DB pool, and alerting tied to user-visible SLOs. Never log message bodies or auth/reset secrets by default.

## Testing strategy

The repository needs a real test harness. Highest-value tests are integration tests against PostgreSQL because the important guarantees are database/concurrency guarantees: non-member access denial; idempotent retry returns one row; two concurrent different sends receive distinct increasing sequences; two concurrent identical sends create one row; cursor pagination has no duplicates/gaps; conversation deletion/member FK behavior; registration cannot access protected resources before verification; profile responses never contain secret fields.

Unit tests should cover validation and pure mapping logic, but mocking the database cannot prove locking/idempotency behavior. CI should provision PostgreSQL, apply migrations, and run integration tests before build/deploy.

## Before / after

Before: auth-only starter, no chat persistence or lifecycle, no ordering/idempotency model, misleading realtime/E2EE UI claims, unverified registration session bypass, unsafe profile serialization.

After: auth foundation retained, registration verification boundary corrected, profile output allow-listed, conversation/member/message persistence added, membership authorization centralized, idempotent message creation added, deterministic per-conversation ordering added, cursor history added, misleading capability claims removed.

## Remaining required work before production

1. Add and run PostgreSQL integration/concurrency tests.
2. Run lint/typecheck/build after dependencies are available and resolve any failures.
3. Add endpoint rate limiting and abuse boundaries.
4. Replace stateless refresh JWT behavior with revocable persisted sessions.
5. Add database-backed readiness and graceful shutdown.
6. Add structured metrics/tracing and log-redaction policy.
7. Decide product semantics for direct messages versus groups, membership changes, deletion/editing, retention, and moderation before expanding the schema.

## Optional next iterations

After the required work, add realtime delivery, unread/read state, presence/typing, notifications, attachments, and search only in response to concrete requirements. Keep PostgreSQL as message authority; caches/transports must remain reconstructable from durable state.

## Second-pass implementation update

The continuation pass adds persistent rotated sessions, refresh reuse detection, password-change session invalidation, HMAC-protected verification/reset credentials, direct/group lifecycle rules, group roles/member management, message edit/delete tombstones, authenticated SSE delivery, reconnect/recovery behavior, user discovery, a responsive chat UI, database readiness, graceful shutdown, abuse throttling for sensitive auth endpoints, PostgreSQL integration tests, CI database testing, and API/production architecture documentation.

The remaining infrastructure work is intentionally outside the application repository's present boundary: managed TLS/secrets, SMTP/OAuth credentials, backup/PITR configuration, production metrics/alerts, and Redis-backed distributed fan-out/rate limiting when multiple API replicas are introduced.

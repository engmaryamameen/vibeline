# Production architecture and engineering decisions

## Final shape

The system is a modular monolith: Next.js web client, Fastify API, PostgreSQL/Drizzle persistence, and SSE for committed-event delivery. REST commands are authoritative. PostgreSQL owns durable users, sessions, conversation membership, message order, message history, and idempotency constraints.

### Authentication

Browser refresh credentials are opaque random tokens in an HttpOnly, SameSite=Lax cookie. Only a SHA-256 digest is stored in `sessions`. Every refresh rotates the token by revoking the old session row and creating a replacement. Logout revokes the presented refresh session. Password reset/change revokes all refresh sessions. Access JWTs are deliberately short-lived and held only in browser memory; logout cannot revoke an already-issued access JWT, so its lifetime is the bounded residual exposure window.

OAuth callbacks no longer put access JWTs in URLs. They establish the refresh cookie and redirect; the frontend obtains an access token through `/auth/refresh`.

### Conversation invariants

A direct conversation has exactly two immutable members and a sorted `direct_key` unique constraint, so concurrent creation converges on one row. Groups have owner/admin/member roles. Owners/admins may manage ordinary membership; only the owner changes roles. Owner departure transfers ownership to the longest-standing remaining member; an empty group archives itself.

### Message invariants

`(conversation_id, sequence)` is unique and each conversation row owns `next_message_sequence`. Send locks that conversation row, allocates one sequence, inserts the message, increments the sequence, and commits. The lock is intentionally per conversation, so unrelated conversations do not serialize.

`(conversation_id, sender_id, client_message_id)` is unique. A retry returns the durable message rather than creating another. Edit/delete require sender ownership. Delete is a tombstone: it clears content but preserves ID, sequence, and history position.

### Realtime: SSE over WebSockets

SSE fits the present protocol because client mutations already use REST and realtime is server-to-client delivery after commit. It has a smaller state machine than WebSockets and works naturally with HTTP infrastructure. Events are hints, never authority. Reconnect/missed events recover via `afterSequence` REST reads.

The in-memory event broker intentionally supports one API process. At multiple API instances, replace only the fan-out boundary with Redis Pub/Sub (or a managed broker). Do not move durable messages into Redis. WebSockets become preferable if bidirectional ephemeral traffic such as typing/presence becomes frequent enough that separate REST + SSE channels are awkward.

### Redis and queues

Not added now. At 1x, PostgreSQL plus one API process is sufficient. At ~10x/multiple API replicas, Redis becomes justified for cross-instance realtime fan-out and distributed rate limiting; presence can also live there because it is ephemeral. At 100x, evaluate dedicated realtime nodes, partitioning hot workloads, async notification workers, and a durable queue for external side effects. Queueing message persistence itself would weaken the current synchronous durability contract and is not justified.

### ORM decision

Keep Drizzle. This code needs visible SQL semantics, row locking, compound constraints, PostgreSQL transactions, and hand-reviewable migrations. Drizzle stays close to SQL while retaining TypeScript inference, which fits those requirements. Prisma is also a strong ecosystem choice and offers a higher-level generated/data-contract workflow; migrating would add cost without removing a current constraint. Kysely is a credible typed SQL-builder alternative but likewise offers no material project benefit that justifies churn.

Package popularity is not treated as a hiring proxy. Current npm usage demonstrates that Drizzle, Prisma, and Kysely are all active mainstream TypeScript data-layer choices; engineering fluency in PostgreSQL transactions, indexes, constraints, query plans, and migrations is more portable than a repository rewrite around one ORM.

### Observability

Fastify/Pino provides structured request/error logging and request IDs. Security-sensitive flows log event metadata, not tokens. Readiness checks PostgreSQL; liveness checks the process. OpenTelemetry is not added yet because there is only one application service and no collector/backend in this repository. Add OTel when distributed request traces or external dependency spans would answer operational questions that request IDs and structured logs cannot.

### Scale boundaries

**1x:** one or a few app instances, PostgreSQL, SSE, in-memory rate limiting/fan-out. Focus on correctness and indexes.

**10x:** multiple API instances make in-memory fan-out/rate limits incorrect globally. Add Redis for Pub/Sub and distributed limits; add connection-pool/proxy planning, metrics, and query-plan monitoring. Read replicas may help non-authoritative history reads if lag semantics are acceptable.

**100x:** measure hot-conversation lock contention, connection counts, message table/index size, retention, and notification throughput. Consider partitioning messages, dedicated realtime fleet, durable background jobs for notifications/media, and only then sharding if a measured write/storage boundary requires it.

## Security boundaries

Authorization is membership-based and non-members receive 404 for conversation resources to reduce enumeration. Validation caps messages and request bodies. CORS is allow-listed. Auth abuse endpoints have a bounded per-process limiter; move this to Redis when the API scales horizontally. HTML is rendered as React text, not injected markup. Drizzle parameterization is used; raw SQL is limited to a parameterized row lock.

Remaining production infrastructure concerns include managed secret storage, TLS termination, backup/PITR policy, alerting, CSP/security headers at the edge, and a distributed limiter once there is more than one API process.

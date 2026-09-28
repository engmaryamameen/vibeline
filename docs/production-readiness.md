# Production-readiness checklist

## Implemented in application code

- Email/password registration, verification, login, refresh, logout, reset and password change.
- Google/GitHub OAuth foundation with state validation and cookie-based session handoff.
- Verified-account enforcement before authenticated sessions are issued.
- Opaque, hashed, rotating refresh sessions with reuse detection and revocation.
- In-memory-only access JWT handling in the browser; no access token in OAuth callback URLs.
- Safe public user serialization and HMAC-protected verification/reset credentials at rest.
- Direct/group conversations, stable direct identity, membership roles, member changes, leave/ownership transfer, group rename.
- Ordered, idempotent, cursor-paginated messages with edit/delete authorization and tombstones.
- PostgreSQL row locking for sequence allocation and concurrency-sensitive membership operations.
- Authenticated SSE event stream with heartbeat, bounded connection lifetime, client reconnect, and REST recovery.
- Responsive chat UI with conversation/user discovery, creation, history, sending/loading/empty/error states, member management, edit/delete and retry-safe sends.
- Structured Fastify/Pino logging with redaction, request IDs, body limits, security response headers, liveness/readiness, and graceful shutdown.
- Per-process throttling for login and credential-recovery endpoints.
- PostgreSQL integration tests for key chat/session invariants and CI PostgreSQL provisioning.
- API and architecture documentation.

## Partially implemented / deliberately bounded

- Realtime fan-out is single-process. Correct for one API process; multiple replicas require shared Pub/Sub.
- Rate limiting is per-process. Multiple replicas require a shared limiter.
- Access JWT revocation is bounded by the configured short token lifetime; refresh sessions are immediately revocable.
- Observability has structured logs/request IDs and an operational signal contract, but not an in-repository metrics backend or distributed traces.
- Group UI is intentionally utilitarian; API semantics are richer than presentation polish.
- Message deletion is user tombstoning, not retention/compliance erasure.

## Requires infrastructure or external services

- TLS/domain and edge/proxy security policy.
- Managed PostgreSQL, backups, PITR, tested restore procedure, RPO/RTO targets.
- SMTP credentials and deliverability configuration.
- Google/GitHub OAuth credentials and production callback registration.
- Secret manager rather than plaintext deployment environment files.
- Metrics/log aggregation/alerting backend.
- Shared realtime/rate-limit infrastructure only when horizontal requirements justify it; it is not required for the current single-process guarantees.

## Not implemented because there is no current requirement

- Attachments/media pipeline.
- Push/email message notifications and durable background workers.
- Typing indicators/presence/read receipts.
- Redis caching of durable chat state.
- Kafka or another event streaming platform.
- Database sharding.
- OpenTelemetry collector/export pipeline.

These are not omissions to conceal; each introduces operational and correctness costs and should be added only when product or measured scale requirements justify it.

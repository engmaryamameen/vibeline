# Production operations

## Runtime and deployment

Use Node 24 for local production builds, CI, and the server container. The API is a stateless process with PostgreSQL as authoritative durable storage. TLS should terminate at a trusted ingress or load balancer. Set `TRUST_PROXY=true` only when that proxy is controlled by the deployment and strips/replaces forwarded headers from untrusted clients.

Production `APP_URL` and every `CORS_ORIGIN` must use HTTPS. Refresh cookies are HttpOnly, SameSite=Lax, and Secure in production. Secrets are injected by the deployment environment or secret manager; they are not stored in source control.

## Configuration

Startup validation fails on malformed production URLs, short authentication secrets, invalid pool settings, or partially configured OAuth providers. A provider is disabled when all three of its client ID, client secret, and callback URL are absent.

`DB_POOL_MAX` is per API process. Capacity planning must satisfy approximately:

`(DB_POOL_MAX + 1 realtime listener) × API replicas + migration connections + workers + operational connections < PostgreSQL max connections`

Phase 4 uses one dedicated PostgreSQL LISTEN connection per API replica in addition to the request pool. Keep headroom for administration and failover. External pooling such as PgBouncer is not required by the current deployment, but can be introduced later without changing application persistence semantics.

## Health and shutdown

`/health/live` proves only that the process can answer HTTP. It intentionally does not depend on PostgreSQL.

`/health/ready` performs a lightweight PostgreSQL query. A failure returns 503 so the instance can stop receiving new traffic. It does not prove every external integration is healthy.

SIGTERM/SIGINT stop Fastify, end active SSE responses, close the PostgreSQL pool, and retain the existing ten-second forced-exit guard. The PostgreSQL realtime listener is closed before the request pool. Realtime events are hints rather than durable delivery; clients recover from PostgreSQL through sequence catch-up after reconnecting.

## Logging

Fastify/Pino request IDs remain the correlation key. Completion and error logs include operation, status, duration where available, and authenticated actor ID where available. Logger redaction covers authorization/cookie headers and common credential/token fields. Message bodies are not intentionally logged.

Do not add request bodies, OAuth callback codes, access/refresh tokens, passwords, verification/reset credentials, cookies, or secret configuration to logs.

## Migrations

Application replicas do not run migrations on startup. Run `pnpm --filter @vibeline/server db:migrate` once as a deliberate deployment step before or during rollout according to migration compatibility.

The current historical migrations create/alter tables, indexes, and constraints in ordinary transactions. On a large production dataset these operations can take locks or perform expensive validation. Do not rewrite historical migrations after deployment. For future high-volume changes use expand/contract: add backward-compatible schema first, deploy code that tolerates both versions, backfill separately when necessary, then remove old schema in a later deployment.

A failed migration blocks rollout. Inspect the database state and migration journal, correct the root cause, and prefer forward recovery. Do not blindly rerun destructive SQL or mark migrations successful manually. The repository does not claim zero-downtime migrations.

## Backup and recovery

Backups belong to the PostgreSQL platform, not the application process. A production deployment should provide automated backups, PITR where supported, retention appropriate to the data policy, and scheduled restore tests.

Initial operating targets for this project are RPO <= 15 minutes when PITR is available and RTO <= 4 hours. These are deployment targets, not guarantees created by application code. The operator owning PostgreSQL must periodically restore into an isolated environment and verify schema and representative data before treating backups as recovery evidence.

## Monitoring

Minimum useful signals are request rate, latency, 4xx/5xx rate, authentication failures, PostgreSQL connection/pool pressure, database errors, SSE connection count, message creation failures, process memory/CPU, restarts, and readiness failures. Use platform/container/PostgreSQL metrics plus structured application logs. OpenTelemetry is deferred until there is an actual collector/export destination and tracing requirement.

## Current scaling boundaries

Rate limiting is process-local and is not a global quota across replicas. Coarse abuse protection should therefore also exist at the trusted ingress/gateway in multi-replica production. Redis is not required for the current phase.

Realtime fan-out is also process-local. Multiple API replicas do not deliver an event published in one process to SSE clients connected to another. PostgreSQL remains authoritative and clients recover through REST. Shared Pub/Sub belongs to a later scalability change when multiple realtime API replicas are required.

## Common failures

A startup configuration failure should be corrected rather than bypassed. A readiness failure normally indicates PostgreSQL connectivity or capacity trouble. Pool waiting growth indicates connection pressure and should trigger investigation of replica count, pool sizing, slow transactions, and PostgreSQL limits. Failed deployments should roll application code back only when the database schema remains compatible; otherwise use the documented forward-recovery approach for migrations.

### Review of existing migrations

`0003_chat_core.sql` creates ordinary indexes on chat tables; on a large populated table PostgreSQL index creation can block writes because these historical statements are not `CONCURRENTLY`. `0004_chat_lifecycle_sessions.sql` adds columns with defaults and creates/replaces indexes; deployment should allow for lock acquisition and index-build time. `0005_phase1_identity_and_invariants.sql` is the highest-risk upgrade: it creates unique indexes, copies credential data, drops user credential columns, rewrites existing membership rows to populate IDs, replaces the membership primary key, and installs constraints/triggers. It requires a maintenance-aware upgrade plan and representative-data rehearsal before production use. The historical migration is intentionally not rewritten in Phase 3 because changing an already-applied migration would make environments disagree about migration identity. Future large-table changes should be introduced through new, backward-compatible migrations.

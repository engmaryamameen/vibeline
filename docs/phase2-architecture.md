# Phase 2 architecture boundaries

Phase 2 is structural cleanup only. Phase 1 correctness semantics remain authoritative and unverified until the required Node 24/PostgreSQL verification environment is available.

## Ownership

- `packages/contracts`: transport schemas, runtime validation, inferred transport types, stable API error codes. It does not expose database rows.
- server routes/controllers: HTTP parsing, authentication hooks, cookies/status codes and response transport.
- application services: use-case coordination and mapping persistence outcomes to application errors.
- repositories: PostgreSQL reads and correctness-sensitive transactional mutations. Existing Phase 1 transaction/locking behavior remains in the repository because those methods are cohesive persistence operations whose transaction is part of their contract; Phase 2 does not split them without evidence of a correctness problem.
- `realtime.publisher`: ephemeral delivery infrastructure. PostgreSQL remains authoritative.
- frontend chat API: transport endpoints and response contract parsing.
- frontend chat workspace hook: server-state orchestration and application interaction state for the chat screen.
- frontend chat components: rendering and local form/UI state.
- Zustand: authentication session state only; chat server state is not stored in Zustand.

## Contracts

Runtime Zod schemas and their inferred TypeScript types live together. HTTP boundaries validate request data. Frontend API functions validate important chat responses. Database models remain server-only.

This contract package can later feed OpenAPI generation, but OpenAPI tooling is intentionally not introduced in Phase 2.

## Errors

Expected application failures use `AppError(statusCode, code, message)`. `code` is constrained to the shared stable error-code vocabulary. The HTTP error handler returns only `{code,message}` for expected errors and a generic internal error for unexpected failures. Private-resource hiding continues to use `CONVERSATION_NOT_FOUND` where established by Phase 1.

## Realtime

Chat application behavior publishes committed events through `realtimePublisher`; the SSE route subscribes to it. The publisher is intentionally in-process and single-instance. It is not a source of truth and Phase 2 adds no Redis or WebSocket infrastructure.

## Frontend server state

TanStack Query is deferred. The current application can establish meaningful API/orchestration/rendering boundaries without adding another dependency before the real Phase 1 dependency graph is verified. Revisit this if invalidation, cache sharing, request deduplication or mutation coordination becomes materially more complex.

## Phase 1 issue discovered

`changePasswordHandler` supplied three arguments to the two-argument `validate(schema, value)` helper. This is a concrete Phase 1 type/API defect, not an architectural preference. Phase 2 corrects the call to `validate(changePasswordSchema, request.body)` and records it for Phase 1 verification.

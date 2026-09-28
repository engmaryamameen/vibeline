# Assistant response architecture

## Phase 5 scope

This phase adds one coherent capability: a provider-backed assistant can be enabled in an existing group conversation and an authorized member can request an assistant response. It establishes the participant, provider, durability, idempotency, context, and usage boundaries needed for later model work without creating a second chat system.

Attachments, notifications, message search, moderation workflows, tools, summarization, embeddings, retrieval, queues, Python services, and multiple model providers are deferred because the current product does not require them to establish this boundary.

## Domain model

An assistant is a `conversation_assistants` record, not a synthetic user. It joins at the conversation's current message sequence, so it does not imply access to history from before it was enabled. One assistant is supported per group conversation in this phase. Only an owner or admin can enable it. Any active member can request a response once enabled.

A message has exactly one author: either `sender_id` for a user or `assistant_id` for an assistant. Assistant messages use the same conversation sequence allocator and the same `messages` table as user messages. PostgreSQL therefore remains authoritative for final chat history and ordering.

## Generation lifecycle and idempotency

`assistant_generations` stores the durable request identity and lifecycle. `(conversation_id, requested_by_user_id, client_request_id)` is unique. The first request creates a `running` generation. Concurrent or later requests with the same identity observe that row instead of making another provider call. A completed duplicate returns the persisted final message. A running duplicate returns the current generation state. A failed request is not automatically retried; the client must explicitly create a new request identity. This avoids uncontrolled duplicate provider cost after ambiguous failures.

The provider call occurs outside a database transaction. Finalization locks the conversation row, allocates the next sequence, inserts the assistant message, advances the conversation sequence, and marks the generation completed in one transaction. Realtime publication happens only after commit and remains best effort. A publication failure cannot roll back or erase the final message.

Partial model output is not persisted or delivered in this phase. Streaming is deliberately deferred until the application has a product requirement for partial output. The existing SSE path continues to deliver the final persisted message as a normal `message.created` event.

## Context and privacy

Context construction is separate from message persistence. It loads at most the latest 40 non-deleted messages visible from the invoking member's current `joined_sequence`. This prevents a rejoined member from causing inaccessible earlier history to be sent to the external model provider. The system instruction is application-owned in `assistant.prompt.ts`; authorization is never delegated to the prompt.

The model provider is an external data processor. Conversation message bodies included in context are sent externally only when a member explicitly requests a response. Credentials, cookies, authorization state, and unrelated user data are not included. Provider credentials remain environment configuration and are covered by the existing log redaction policy.

## Provider boundary

`ModelGateway` is the application capability boundary. Chat and assistant lifecycle code do not depend on a provider SDK. `OpenAiModelGateway` is the single provider adapter and uses the configured Responses API endpoint. Provider-specific response parsing is contained there. Replacing the provider should not require changing chat sequencing, membership, persistence, or idempotency rules.

The configured provider is not retried automatically. Requests time out after 30 seconds. Provider rate limits, timeouts, malformed/empty responses, and other failures mark the generation failed without creating a chat message. This favors cost and duplicate-generation safety over transparent retry.

## Usage accounting

Generation rows record provider, model, input/output/total token counts when reported, request latency, status, and a stable failure code. Prompt or message content is not copied into usage records. Pricing is intentionally not calculated because provider pricing and model versions are not modeled as authoritative billing data.

## Known limits

Generation currently runs in the request lifecycle and is limited to 30 seconds. A process crash after the provider accepts a request but before finalization can leave a generation in `running`; there is no durable worker/recovery lease yet. That is the point at which a background job boundary may become justified. Streaming, cancellation, tools, summaries, retrieval, attachment context, and per-assistant configuration are not implemented.

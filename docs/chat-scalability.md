# Chat scalability and reliability

PostgreSQL remains the authoritative chat store. HTTP remains the write path. SSE is notification delivery, not durable storage.

## Reconnect and gap recovery

Messages already have a per-conversation sequence. The browser keeps the highest sequence it has observed for the selected conversation. After an SSE connection is established, it requests messages after that sequence until caught up. The server subscribes the SSE connection before sending the `connected` frame, so an event may overlap with catch-up but cannot create a fetch-then-subscribe loss window. Message merging is idempotent by message id, so overlap is harmless.

A created-message event whose sequence jumps over the browser's last observed sequence triggers the same catch-up path. A low-frequency 60 second reconciliation remains as a safety net for notification outages; it is not the normal delivery path. Full page load reads PostgreSQL directly.

Membership visibility is enforced by `joined_sequence` during catch-up. Realtime recipients are also filtered so a member who rejoined later is not sent an edit/delete payload for a message outside the current visibility period.

## Multi-replica delivery

The application uses PostgreSQL `LISTEN/NOTIFY` as a small shared notification mechanism because PostgreSQL is already required and multiple API replicas otherwise cannot notify clients connected to another replica. Notifications contain only routing metadata and a message id, not the message body. Each replica loads the authoritative message only when it has a local subscriber that needs the event.

`NOTIFY` is not durable and is not the system of record. If notification publication or consumption fails, the committed message remains valid. Reconnect/gap recovery and periodic reconciliation read PostgreSQL and close the delivery gap.

Each API replica uses one dedicated PostgreSQL connection for `LISTEN` in addition to its configured request pool. Capacity planning must include that connection:

`(DB_POOL_MAX + 1 realtime listener) × API replicas + migrations + workers + operational connections < PostgreSQL max_connections`

The listener reconnects after failure. Publication failure is logged after the database transaction and does not turn a committed message into a failed write response.

## SSE decision

SSE remains appropriate. Writes already use HTTP and current requirements do not need bidirectional persistent transport for presence, typing, read receipts, or delivery acknowledgements. WebSockets would add lifecycle and infrastructure complexity without fixing a current requirement.

Connections receive a heartbeat every 25 seconds and are rotated after 10 minutes or when the authenticated access token expires, whichever comes first. Shutdown closes active streams and removes listeners. Proxy idle timeouts must exceed the heartbeat interval. Connection count, memory, reconnect rate, and listener count should be measured before increasing per-instance connection targets.

## Queries and indexes

Message history and catch-up use `(conversation_id, sequence)` with a conversation equality predicate and sequence range/order. `messages_conversation_sequence_uq` already has the required column order and uniqueness. `messages_conversation_history_idx` duplicates the same key columns; no additional message index is justified by the current queries. Removing the duplicate index should be done through a reviewed migration after plan verification rather than rewriting historical migrations.

Idempotent send lookup uses `messages_conversation_sender_client_id_uq (conversation_id, sender_id, client_message_id)`. That database uniqueness constraint remains the authority across retries and replicas.

Active membership checks use `conversation_members_active_uq (conversation_id, user_id) WHERE left_at IS NULL`. Conversation listing starts from active membership by user and is served by `conversation_members_user_active_idx (user_id, conversation_id) WHERE left_at IS NULL`, then joins conversations and sorts the user's result by `updated_at`.

The current conversation list does not query last message, participants, unread state, or metadata per row, so it has no current N+1 path for those fields. If those fields are added, they should be designed as a set-based read query rather than per-conversation requests.

No EXPLAIN or EXPLAIN ANALYZE result is claimed until the PostgreSQL verification environment is available.

## Contention and hot conversations

A conversation row is the serialization boundary for message sequence allocation and membership changes. This preserves deterministic ordering and prevents writes from crossing membership changes. A hot conversation therefore has a deliberate single-conversation write bottleneck. Measure lock wait time, send latency, transaction duration, and pool waiters before changing it. Removing the lock without replacing its invariants is not an optimization.

SSE connections do not hold request-pool database connections. The shared realtime listener does hold one dedicated connection per replica. Transactions acquire request-pool connections only for their database work and release them when the transaction completes.

## Idempotency and failure behavior

`clientMessageId` plus `(conversation_id, sender_id)` is database-unique. A retry after an HTTP timeout, replica failure, or duplicate concurrent submission resolves to the already committed message. Realtime publication happens after commit and is best effort. A publish failure is logged and recovery reads the committed row from PostgreSQL.

Failure expectations:

* crash before commit: transaction is not committed; retry can create the message
* crash after commit before publish/response: retry resolves to the committed message; catch-up observes it
* notification outage: writes remain durable; catch-up/reconciliation closes gaps
* SSE disconnect or replica change: reconnect then sequence catch-up
* database unavailable: writes and catch-up fail rather than accepting non-durable chat state
* simultaneous sends: conversation locking allocates distinct ordered sequences
* deploy/restart: streams close and browsers reconnect; PostgreSQL catch-up restores committed messages

## Read state

Read/unread state is not currently a product contract, so Phase 4 does not add it. If introduced later, a monotonic membership-level `last_read_sequence` is preferable to a row per user per message for the current model. It must respect membership visibility periods and use a monotonic database update so stale tabs cannot move the cursor backward.

## Remaining limits

PostgreSQL notifications are appropriate for the current architecture but are not a high-throughput durable event bus. Notification payload size and database notification traffic are bounded here by sending only routing metadata. At materially higher event rates, measure PostgreSQL notification load before selecting another transport.

The 60 second reconciliation interval trades a small amount of database traffic for deterministic eventual recovery from notification outages. It should be tuned from observed reconnect and notification reliability rather than shortened by default.

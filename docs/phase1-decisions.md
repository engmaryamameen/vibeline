# Phase 1 correctness and security decisions

## Runtime and framework

- Runtime target: Node.js 24 LTS. Node 20 is EOL; Node 24 also provides native Argon2id, avoiding a new native password-hashing package.
- Next.js: remain on major 15 for this phase, upgrading to 15.5.26 (current Maintenance LTS security patch as of 2026-09-27). A Next 16 major migration is not required to fix Phase 1 security issues and is intentionally deferred.
- React: upgrade from 18.3.1 to stable 19.3.0 as required by modern Next 15 and current security maintenance.

## Authentication invariants and linking policy

1. `users` is the account/profile. Authentication methods are separate records.
2. A password is optional. Password accounts have exactly one `password_credentials` row; OAuth-only accounts do not.
3. External identity is authoritative by `(provider, provider_subject)`, never by email.
4. One provider identity can belong to only one user. One user can have at most one identity per provider.
5. OAuth sign-in requires a provider-verified email.
6. If a new OAuth identity presents an email already used by an account, sign-in fails with `ACCOUNT_LINK_REQUIRED`. Email match never silently links accounts.
7. Provider email changes update identity metadata only; they do not silently change the account email.
8. Cross-provider same-email sign-in follows the same explicit-link requirement.
9. Explicit linking/unlinking UI/API is deferred until the product has an authenticated re-verification UX. The schema supports it; unsafe implicit linking is removed now.
10. Removing the final authentication method is forbidden when disconnect support is introduced.
11. Concurrent account creation/linking is resolved by database uniqueness, not pre-checks alone.

## Conversation invariants

1. A direct conversation has exactly two distinct active participants and a canonical unordered `direct_key`; duplicate direct conversations are prevented by a unique index.
2. Direct membership is immutable through group membership APIs.
3. Every non-archived group has exactly one active owner. Ownership transfer and owner leave serialize on the conversation row.
4. Admins may remove members only; owners may remove admins/members. Owners leave through the ownership-transfer path.
5. When the last group member leaves, the conversation is archived atomically.
6. Membership is historical: leaving sets `left_at`; rejoining creates a new membership period.
7. A membership period records `joined_sequence`. A current member sees messages from that period onward. Leaving removes access; rejoining does not restore earlier history.
8. Membership mutations and message writes lock the conversation row, so remove/send and owner-transition races serialize around one correctness boundary.

## Message lifecycle

- Only the sender may edit/delete their message and only while currently a conversation member.
- Edit/delete serialize with membership mutations on the conversation row.
- Deleted messages remain as tombstones with sequence/id/timestamps but body is cleared. They cannot be edited afterward.
- Delete is idempotent for the sender; retrying after an uncertain response returns the existing tombstone.
- Full moderation/compliance retention is intentionally deferred; the schema does not pretend deletion is a compliance-grade erasure mechanism.

## Authorization matrix

| Operation | Direct member | Group owner | Group admin | Group member | Non-member |
| --- | --- | --- | --- | --- | --- |
| Read conversation/current-period messages | allow | allow | allow | allow | hide as 404 |
| Send message | allow | allow | allow | allow | hide as 404 |
| Edit/delete own message | allow | allow | allow | allow | hide as 404 |
| Edit/delete another user's message | deny | deny | deny | deny | hide as 404 |
| Rename conversation | deny | allow | allow | deny | hide as 404 |
| Add member | deny | allow | allow | deny | hide as 404 |
| Promote/demote admin/member | deny | allow | deny | deny | hide as 404 |
| Remove ordinary member | deny | allow | allow | deny | hide as 404 |
| Remove admin | deny | allow | deny | deny | hide as 404 |
| Remove owner | deny | ownership leave/transfer only | deny | deny | hide as 404 |
| Leave | deny (direct immutable) | allow with deterministic transfer/archive | allow | allow | hide as 404 |

Frontend state never grants authorization. Mutation authorization is rechecked inside the same transaction after locking the conversation row.

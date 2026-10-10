# Vibeline

Full-stack messaging app: direct and group chat, media messages, one-to-one audio
and video calling over WebRTC, and 24-hour stories.

## Workspace

```txt
apps/
  web/      Next.js 15 app (App Router, Tailwind)
  server/   Fastify API (JWT auth, Drizzle, Postgres LISTEN/NOTIFY realtime)
packages/
  contracts/  Zod schemas and types shared by both apps
  ui/         Shared UI primitives
  utils/      Shared helpers
  config/     Shared tsconfig/eslint/prettier presets
infra/
  docker/ nginx/ ci/
docs/
```

### Web feature layout

```txt
apps/web/src/features/
  auth/           sign-in, registration, verification, guards
  chat/           conversation list, thread, composer, reactions
  media/          camera capture, media editor, export pipeline
  calls/          WebRTC session, call UI, call history
  stories/        story rail, viewer, composer
  realtime/       single SSE connection shared by the features above
  notifications/  web push subscription
apps/web/src/shared/assets/svg/   icon assets, imported (not served from public/)
```

## Requirements

- Node.js >= 24.11 (< 25)
- pnpm 9
- PostgreSQL 14+
- An SMTP account for verification and password-reset mail

## Setup

```bash
pnpm install
cp .env.example .env     # then fill in the values below
pnpm --filter @vibeline/server db:migrate
pnpm dev
```

The web app serves on `http://localhost:3002` and the API on `http://localhost:5001`.
In development the web app proxies `/v1/*` to the API through a Next rewrite, so
`NEXT_PUBLIC_API_BASE_URL` can stay empty.

## Environment

Required:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Access-token signing key (32+ chars) |
| `AUTH_CREDENTIAL_SECRET` | Credential hashing pepper (32+ chars) |
| `OAUTH_STATE_SECRET` | OAuth state signing key (32+ chars) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `INVITE_FROM_EMAIL` | Outbound mail |
| `APP_URL`, `CORS_ORIGIN` | Public web origin, and the origins allowed to call the API |

Optional, per feature:

| Variable | Feature | Notes |
| --- | --- | --- |
| `MEDIA_STORAGE_DIR` | Media | Defaults to `.data/media`, relative to the server working directory |
| `CALL_STUN_URLS` | Calling | Comma-separated STUN URLs. Enough for same-network calls only |
| `CALL_TURN_URLS` | Calling | Comma-separated TURN URLs. **Required** for calls across most real NATs |
| `CALL_TURN_SECRET` | Calling | coturn `static-auth-secret`; the API mints short-lived credentials from it |
| `CALL_TURN_USERNAME` / `CALL_TURN_PASSWORD` | Calling | Long-lived TURN credentials, if you are not using a shared secret |
| `CALL_TURN_TTL_SECONDS` | Calling | Lifetime of minted TURN credentials (default 600) |
| `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` | Push | Generate with `npx web-push generate-vapid-keys` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | OAuth | Set all three or none |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_RESPONSES_URL` | Assistant | Set all three or none |

Grouped variables are validated together at boot: providing some but not all of a
group fails startup with a specific message rather than degrading silently.

### TURN

Browsers cannot connect peer-to-peer across most home and mobile networks without
a relay. Without `CALL_TURN_URLS`, calls will connect on a shared LAN and fail
elsewhere. The API never sends `CALL_TURN_SECRET` to a client: `GET /v1/calls/ice-servers`
returns a username of `<expiry>:<userId>` with an HMAC-SHA1 credential that expires
after `CALL_TURN_TTL_SECONDS`.

## Migrations

Migrations are hand-written SQL in `apps/server/drizzle`, registered in
`apps/server/drizzle/meta/_journal.json`. The runner applies files in journal
order.

```bash
pnpm --filter @vibeline/server db:migrate
```

Adding one: create `apps/server/drizzle/NNNN_name.sql`, append a matching entry to
`_journal.json` (`idx`, `tag`, and a `when` later than the previous entry), and
mirror the change in `apps/server/src/db/schema.ts`. A file without a journal
entry is never applied.

## Commands

| Command | Effect |
| --- | --- |
| `pnpm dev` | Run every workspace in dev mode |
| `pnpm build` | Production builds |
| `pnpm typecheck` | Strict typecheck across workspaces |
| `pnpm lint` | Lint every workspace |
| `pnpm --filter @vibeline/server db:migrate` | Apply migrations |
| `pnpm --filter @vibeline/server db:seed` | Seed development data |
| `pnpm --filter @vibeline/server test:integration` | Integration tests (needs `RUN_DB_TESTS=1` and a database) |

## Reverse proxy requirements

Two defaults will break the app if you put it behind your own proxy:

- **Response buffering** must be off for `GET /v1/chat/events`. The realtime stream
  carries messages, presence, call state and call signalling; a buffering proxy
  delivers nothing. The route also needs a long read timeout (the server
  heartbeats every 25s) and HTTP/1.1 upstream.
- **Upload body size** must allow 100 MB. nginx defaults to 1 MB, which rejects
  every video.

`infra/nginx/nginx.conf` is configured for both, and forwards `X-Forwarded-For`
so per-IP rate limiting sees real clients. Set `TRUST_PROXY=true` on the server
when it sits behind a proxy you control.

## Operational notes

- **Realtime.** The API publishes events through Postgres `pg_notify`; each
  instance holds one `LISTEN` connection and fans events out to the SSE streams it
  owns. Envelopes carry the originating instance id so a publisher does not
  redeliver its own events. Large payloads (messages, call SDP) travel by
  reference and are loaded per recipient, which keeps notifications inside the
  8 kB `pg_notify` limit and re-applies per-user authorization.
- **Media.** Assets are stored on the local filesystem under `MEDIA_STORAGE_DIR`.
  For more than one server instance, put that directory on shared storage or
  replace `media.storage.ts` with an object-store implementation; it is the only
  module that touches the filesystem.
- **Calls.** Signalling and call state live in Postgres; media never passes
  through the API. A sweeper ends calls that stop sending heartbeats, so a client
  that crashes mid-call does not leave either party permanently busy.
- **Stories.** Expiry and visibility are enforced in SQL on every read, including
  the media route, so an expired or unconnected story cannot be fetched by URL.

- **Fonts and icons.** Text faces load from Google Fonts over CSS `@import`, with
  `preconnect` hints in the root layout. Icons are SVG files under
  `apps/web/src/shared/assets/svg`, imported so they are hashed and bundled.
  `public/` holds only `images/vibeline-bird-logo.svg`, which the push service
  worker references by URL and therefore cannot be an import.

More detail: `docs/architecture.md`, `docs/calling-architecture.md`,
`docs/media-architecture.md`, `docs/stories-architecture.md`.

<div align="center">
  <img src="apps/web/src/shared/assets/svg/vibeline-bird-logo-green.svg" alt="VibeLine" width="56" />
  <h1>VibeLine</h1>
  <p><strong>Talk freely. Come back anytime.</strong></p>
  <p>A full-stack messaging application for conversations, shared moments, and real-time connection.</p>
  <p>Next.js · React · TypeScript · Fastify · PostgreSQL · WebRTC</p>
  <p>
    <a href="#product">Product</a> ·
    <a href="#architecture">Architecture</a> ·
    <a href="#getting-started">Getting started</a> ·
    <a href="#quality-and-testing">Testing</a> ·
    <a href="#documentation">Documentation</a>
  </p>
</div>

---

VibeLine brings direct and group messaging, media sharing, one-to-one calls, and
24-hour stories into one responsive web application. The interface is designed
to feel calm; the implementation focuses on the less visible work that makes a
messaging product dependable: ordered writes, safe retries, membership-aware
history, session rotation, and recovery after a dropped connection.

The project is a **TypeScript monorepo with a modular-monolith backend**. It keeps
application boundaries explicit without introducing a separate service for every
feature.

## Interface

![VibeLine login and signup panel designs with original conversation illustrations](docs/assets/auth-panels-preview.png)

*Login and signup panel previews. The illustrated conversations are decorative and
use fictional content; they are not screenshots of live user messages.*

The auth interface uses locally imported SVG artwork, route-specific copy, scoped
styles, and reduced-motion support. The shared visual panel is hidden below
1024px so smaller screens prioritize the form. Implementation details live in the
[auth interface guide](docs/auth-ui.md).

## Product

| Area | Implemented capabilities |
| --- | --- |
| **Conversations** | Direct and group chats, membership roles, cursor-based history, message editing and deletion, reactions, presence, and delivery/read receipts. |
| **Media** | Image, video, and voice messages; browser camera capture; an editor with crop, rotation, effects, text, and stickers; shared media rendering and export. |
| **Calling** | One-to-one audio/video calls over WebRTC, incoming-call controls, call history, reconnect handling, and server-side expiry of abandoned calls. |
| **Stories** | Image and video stories with a 24-hour lifetime, connection-based visibility, playback controls, and viewer tracking. |
| **Identity** | Email/password registration, email verification, password recovery, session refresh, and optional Google sign-in. |
| **Optional integrations** | Web Push notifications and an in-conversation assistant backed by a configured model provider. These require separate credentials. |

For a walkthrough, register two verified accounts in separate browser sessions,
start a conversation, exchange a voice note or edited image, and place a call.
Then publish a story between connected accounts and check its viewer state.

## Architecture

```mermaid
flowchart LR
    Web["Next.js web client"]
    API["Fastify API"]
    DB[("PostgreSQL")]
    Media[("Media filesystem")]
    Peer["Another browser"]
    Services["SMTP and optional external providers"]

    Web -->|REST commands and queries| API
    API -->|Server-Sent Events| Web
    API <-->|SQL and LISTEN / NOTIFY| DB
    API -->|Authorized reads and writes| Media
    API --> Services
    Web <-->|WebRTC media; TURN when needed| Peer
```

**PostgreSQL is the source of truth.** REST requests perform mutations; realtime
events notify clients about committed state. A missed event does not become a
lost message: clients can fetch history after their last known sequence.

### Engineering decisions

**Ordering and retry safety belong in the database.** Message creation locks its
conversation row, allocates a sequence, and persists the message in a transaction.
A unique client-message key makes retries return the existing message rather than
create duplicates. The lock is per conversation, not global. See the
[chat repository](apps/server/src/modules/chat/chat.repository.ts) and
[database schema](apps/server/src/db/schema.ts).

**REST and SSE have separate responsibilities.** The client sends commands through
REST and receives server events through a shared SSE connection. API instances
exchange notifications through PostgreSQL `LISTEN`/`NOTIFY`; each process delivers
them to its own connected clients. Message and call-signal references avoid
putting the full payload into every notification. This is event delivery, not a
durable event queue. See the
[realtime publisher](apps/server/src/modules/chat/realtime.publisher.ts) and
[client provider](apps/web/src/features/realtime/realtime-provider.tsx).

**Authentication has explicit session boundaries.** Access tokens stay in browser
memory. Refresh credentials are opaque tokens sent in HttpOnly cookies, stored as
hashes, and rotated on use. Reusing a revoked refresh token revokes that user's
active refresh sessions. Conversation access is checked on the server; hiding a
control in the UI is not authorization. See the
[session service](apps/server/src/modules/auth/session.service.ts).

**Shared contracts reduce drift.** Zod schemas and TypeScript types live in
[`packages/contracts`](packages/contracts), while UI primitives live in
[`packages/ui`](packages/ui). Feature code owns its domain behavior; shared
packages hold reusable contracts and presentation building blocks.

### Technology

| Layer | Implementation |
| --- | --- |
| Web | Next.js 15 App Router, React, TypeScript, Tailwind CSS, Zustand |
| API | Fastify, Zod validation, Pino structured logging |
| Persistence | PostgreSQL, Drizzle ORM, versioned SQL migrations |
| Realtime and calls | Server-Sent Events, PostgreSQL notifications, WebRTC |
| Workspace and tooling | pnpm workspaces, Turborepo, ESLint, Prettier, Docker, nginx |

## Repository layout

```text
apps/
  web/
    app/                     # App Router pages and layouts
    src/features/            # Auth, chat, calls, media, stories, realtime, notifications
    src/shared/              # Shared hooks and local SVG assets
  server/
    src/modules/             # Domain routes, services, and repositories
    src/db/                  # Database client and schema
    drizzle/                 # SQL migrations and migration journal
    test/                    # Database-backed integration tests
packages/
  contracts/                 # Shared Zod schemas and types
  ui/                        # Shared components and theme tokens
  utils/                     # Common helpers
  config/                    # Tooling presets
infra/
  docker/                    # Container builds and Compose services
  nginx/                     # Reverse proxy configuration
  ci/                        # Reference CI workflow
docs/                       # Architecture and feature documentation
```

## Getting started

### Prerequisites

Use **Node.js 24.11 or later within the 24.x release line** and **pnpm 9.12.3**, as
specified in the workspace manifest. You also need PostgreSQL and SMTP credentials
for verification and recovery emails. The supplied Compose service runs
PostgreSQL 16; Docker is optional when using an existing database.

Run the following commands from the repository root.

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile

# Preserve an existing local configuration.
test -f .env || cp .env.example .env
```

### 2. Configure the environment

Edit `.env` before starting the API. The authoritative validation rules are in
[`apps/server/src/config/env.ts`](apps/server/src/config/env.ts).

| Setting | Local configuration |
| --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/vibeline` for the supplied local database. |
| `JWT_SECRET`, `AUTH_CREDENTIAL_SECRET`, `OAUTH_STATE_SECRET` | Three different random values, each at least 32 characters. |
| `APP_URL` | `http://localhost:3002` |
| `CORS_ORIGIN` | `http://localhost:3002`, or a comma-separated list of explicitly allowed origins. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `INVITE_FROM_EMAIL` | Credentials and sender address for your mail service. Set `SMTP_SECURE` to match that service. |
| `NEXT_PUBLIC_API_BASE_URL` | Leave empty for the default same-origin `/v1` proxy. |

Generate separate secrets locally, then copy the output into `.env`:

```bash
node -e "const { randomBytes } = require('node:crypto'); for (const key of ['JWT_SECRET', 'AUTH_CREDENTIAL_SECRET', 'OAUTH_STATE_SECRET']) console.log(key + '=' + randomBytes(32).toString('hex'));"
```

> **!IMPORTANT**
> Optional provider settings must be configured as complete groups. The current
> `.env.example` includes a model endpoint URL even though its key and model are
> empty. To run without the assistant provider, clear **all three** values below;
> leaving only the URL populated fails startup validation.

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_RESPONSES_URL=
```

Keep real secrets out of commits, screenshots, and shared logs.

### 3. Start PostgreSQL and apply migrations

Skip the Compose commands when your database is already running.

```bash
docker compose -f infra/docker/docker-compose.yml up -d postgres
docker compose -f infra/docker/docker-compose.yml exec postgres pg_isready -U postgres -d vibeline

pnpm --filter @vibeline/server db:migrate
```

Wait for PostgreSQL to report that it is accepting connections before migrating.

### 4. Start the application

```bash
pnpm dev
```

| Service | Development address |
| --- | --- |
| Web | `http://localhost:3002` |
| API | `http://localhost:5001` |
| Liveness | `http://localhost:5001/health/live` |
| Readiness | `http://localhost:5001/health/ready` |

The web app rewrites `/v1/*` to the API. The readiness endpoint checks database
connectivity; it does not verify email delivery or optional providers.

### Optional integrations

| Integration | Configuration |
| --- | --- |
| Google sign-in | Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` together. The local API callback is `http://localhost:5001/v1/auth/google/callback`. |
| Assistant | Set `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_RESPONSES_URL` together. Conversation context used for a response is sent to the configured provider. |
| Web Push | Set `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, and `WEB_PUSH_SUBJECT` together. |
| Calling relay | Set `CALL_TURN_URLS` with either `CALL_TURN_SECRET` or the `CALL_TURN_USERNAME` / `CALL_TURN_PASSWORD` pair. `CALL_STUN_URLS` and `CALL_TURN_TTL_SECONDS` are also configurable. |
| Media storage | Set `MEDIA_STORAGE_DIR` to override `.data/media`, which is relative to the server's working directory. |

The TURN configuration supports both short-lived credentials minted from a shared
secret and a configured username/password pair. Test calls across the networks
you intend to support; a successful local call does not establish internet-wide
connectivity.

## Quality and testing

### Workspace commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start workspace development processes. |
| `pnpm build` | Build the applications and their workspace dependencies. |
| `pnpm typecheck` | Run workspace TypeScript checks. |
| `pnpm lint` | Run configured lint tasks. |
| `pnpm format` | Check formatting without rewriting files. |
| `pnpm --filter @vibeline/server db:migrate` | Apply registered database migrations. |

### Integration tests

The [server test suite](apps/server/test) exercises authentication and chat
invariants, including refresh rotation and reuse, membership isolation, concurrent
message ordering, idempotent retries, history boundaries, and assistant-generation
failure paths. These are database-backed tests, not mocked persistence tests.

> **Warning — Integration test database**
>
> Run integration tests against a **dedicated, disposable database only**.
> The cleanup in `chat.integration.test.ts` deletes all conversations in the
> connected database. Never point the test command at a database containing
> data you want to keep.

Create an empty `vibeline_test` database first. Then, in a POSIX-compatible shell:

```bash
(
  export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/vibeline_test'
  pnpm --filter @vibeline/server db:migrate &&
    pnpm --filter @vibeline/server test:integration
)
```

The subshell limits the database override to those commands. The test script sets
`RUN_DB_TESTS=1` and loads the remaining configuration from the root `.env`.

A [reference CI workflow](infra/ci/github-actions.yml) defines lint, type checking,
migrations, integration tests, builds, and container checks. It is stored under
`infra/ci`; its presence is not evidence of an active or passing GitHub workflow.
Browser end-to-end tests and load-test results are not yet included in the
repository.

## Deployment considerations

The repository includes container and reverse-proxy configuration, not a claim
that every deployment is production-ready. These boundaries matter:

| Boundary | Operational consideration |
| --- | --- |
| Realtime | Disable proxy buffering for `/v1/chat/events` and allow long-lived responses. The API sends a heartbeat every 25 seconds. |
| Uploads | Match proxy body limits to the application's media limits. The supplied nginx configuration allows 100 MB. |
| Database capacity | Budget for the request pool and one dedicated realtime listener connection per API instance. Run migrations as an explicit rollout step. |
| Media durability | Local files need persistent storage and backups. Multiple API replicas need shared storage or an object-storage implementation. |
| Abuse protection | The current rate limiter is process-local, not a global quota across replicas. |
| Transport and cookies | Production validation requires HTTPS application and CORS origins. Enable `TRUST_PROXY` only behind infrastructure you control. |
| Privacy | Chat messages are not end-to-end encrypted. The server stores and processes message content. |

The Compose web service uses port **3000**, while `pnpm dev` uses **3002**. For a
full container deployment, configure the database host as `postgres` rather than
`localhost`, and align application origins and OAuth callbacks with the deployed
address. Backups, TLS termination, monitoring, and recovery drills remain
responsibilities of the deployment environment.

## Documentation

| Reference | Focus |
| --- | --- |
| [API surface](docs/api.md) | Authentication, conversations, media, calls, stories, and notifications. |
| [Media architecture](docs/media-architecture.md) | Capture, non-destructive editing, shared rendering, and export limitations. |
| [Calling architecture](docs/calling-architecture.md) | Signaling, call lifecycle, failure handling, and TURN credentials. |
| [Stories architecture](docs/stories-architecture.md) | Expiry, visibility, viewer tracking, and playback. |
| [Auth interface](docs/auth-ui.md) | Login/signup artwork, component boundaries, accessibility, and customization. |
| [Migration journal](apps/server/drizzle/meta/_journal.json) | Ordered SQL migration registration. |

Some earlier architecture documents describe previous implementation phases.
For current session and realtime behavior, use the source links in the
[architecture section](#architecture).

## License

[MIT](LICENSE) · Copyright © 2026 Maryam Ameen.

Third-party assets and dependencies retain their own licenses and attribution
requirements.

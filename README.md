# Auth Foundation Monorepo

Focused full-stack authentication starter designed for portfolio and interview extension.

## Workspace

```txt
apps/
  web/      Next.js auth frontend (login/register/verify/reset + protected home)
  server/   Fastify auth API (JWT, refresh, email verification, password reset, OAuth)
packages/
  ui/       Shared UI primitives
  types/    Shared auth contracts
  utils/    Shared utility helpers
  config/   Shared tsconfig/eslint/prettier presets
infra/
  docker/
  nginx/
  ci/
docs/
```

## Included Auth Flows

- Email/password registration and login
- Access token + refresh token session model
- Email verification (token + code)
- Password reset (token + code)
- OAuth callback handling (Google + GitHub)
- Protected route guard and `/users/me` profile bootstrap

## Quick Start

1. Install dependencies: `pnpm install`
2. Copy env file: `cp .env.example .env`
3. Start apps: `pnpm dev`

Web app runs on `http://localhost:3002` and API on `http://localhost:5001`.

## Commands

- `pnpm dev` run all workspaces in dev mode
- `pnpm lint` lint all workspaces
- `pnpm typecheck` strict typecheck
- `pnpm build` production builds

More detail: `docs/architecture.md`

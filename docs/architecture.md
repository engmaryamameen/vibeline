# Authentication Architecture

## Monorepo boundaries

- `apps/web`: Next.js client for authentication UX and protected entry page
- `apps/server`: Fastify API for auth, session, and profile bootstrap
- `packages/ui`: reusable UI primitives shared by web
- `packages/types`: shared auth-centric contracts (`User`, `Role`, `AuthTokens`)
- `packages/utils`: low-level helpers (`cn`)
- `packages/config`: shared TS/ESLint/Prettier configs

## Backend layering

Each backend module follows `controller -> service -> repository`.

- Controller: HTTP handling and schema validation
- Service: auth business logic and security checks
- Repository: persistence boundary (Drizzle/Postgres)

This keeps HTTP concerns out of business logic and keeps persistence isolated for future DB changes.

## Authentication model

- Access token and refresh token are signed JWTs.
- Refresh token is sent and rotated via HttpOnly cookie.
- Access token is returned in response payload and used by the frontend store.
- `/users/me` is used to hydrate an authenticated session after refresh/OAuth callbacks.

## Flow coverage

- Register with email/password
- Login with verified email requirement
- Email verification via token or 6-digit code
- Password reset via token or 6-digit code
- OAuth initiation + callback handling for Google and GitHub

## Operational model

- Stateless API process with environment-driven config
- Docker compose includes only web, server, and postgres
- CI executes install, lint, typecheck, and build

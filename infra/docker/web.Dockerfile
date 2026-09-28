FROM node:24.21.0-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --filter @vibeline/web... --frozen-lockfile
COPY . .
RUN pnpm --filter @vibeline/web build

FROM node:24.21.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build --chown=app:app /app/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=app:app /app/apps/web/.next ./apps/web/.next
COPY --from=build --chown=app:app /app/apps/web/public ./apps/web/public
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/web/node_modules ./apps/web/node_modules
USER app
EXPOSE 3000
CMD ["pnpm", "--filter", "@vibeline/web", "start"]

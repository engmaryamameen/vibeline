FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json apps/server/
COPY packages/config/package.json packages/config/
COPY packages/types/package.json packages/types/
RUN pnpm install --filter @vibeline/server... --frozen-lockfile=false

FROM deps AS build
COPY . .
RUN pnpm --filter @vibeline/server build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
USER app
EXPOSE 5001
CMD ["node", "dist/server.cjs"]

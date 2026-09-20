FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @vibeline/server build
EXPOSE 5001
CMD ["pnpm", "--filter", "@vibeline/server", "start"]

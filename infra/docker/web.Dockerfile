FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @vibeline/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@vibeline/web", "start"]

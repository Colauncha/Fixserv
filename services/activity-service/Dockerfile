# ---- STAGE 1: Builder ----
FROM node:22-alpine AS builder
WORKDIR /app


RUN corepack enable && corepack prepare pnpm@10.6.5 --activate


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/activity-service/package.json ./services/activity-service/


# RUN pnpm install --shamefully-hoist
RUN pnpm install --no-frozen-lockfile


COPY services ./services


RUN cd services/activity-service && pnpm install --no-frozen-lockfile
RUN cd services/activity-service && pnpm run build


# ---- STAGE 2: Runtime ----
FROM node:22-alpine
WORKDIR /app


COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/services/activity-service/node_modules ./services/activity-service/node_modules

COPY --from=builder /app/services/activity-service/dist ./dist
COPY --from=builder /app/services/activity-service/package.json ./


ENV NODE_ENV=production
CMD ["node", "dist/index.js"]


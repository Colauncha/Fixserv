FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/activity-service/package.json ./services/activity-service/

# Hoist everything (runtime + devDeps) into /app/node_modules
RUN pnpm install --no-frozen-lockfile --shamefully-hoist

# Copy source
COPY services ./services

# Build using the hoisted tsc from /app/node_modules/.bin/tsc
# Do NOT use "pnpm exec tsc" — it looks inside the service node_modules
# Use the direct path instead so it always finds the hoisted binary
RUN /app/node_modules/.bin/tsc -p services/activity-service/tsconfig.json

# ---- Runtime ----
FROM node:22-alpine

WORKDIR /app

# Single flat node_modules — everything Node needs is here
COPY --from=builder /app/node_modules ./node_modules

# Compiled output
COPY --from=builder /app/services/activity-service/dist ./dist

# Package.json for module resolution
COPY --from=builder /app/services/activity-service/package.json ./

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
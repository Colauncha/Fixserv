# ---- STAGE 1: Builder ----
# FROM node:18-alpine AS builder

# WORKDIR /app

# Use corepack instead of npm install -g (faster and built-in)
# RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo root files (for dependency caching)
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all service-level package.json files for dependency resolution
# COPY services/user-management/package.json ./services/user-management/
# COPY services/shared/package.json ./services/shared/

# Install all workspace dependencies (dev + prod) - this layer is cached
# RUN pnpm install --shamefully-hoist

# Copy the rest of the workspace (separate layer for better caching)
# COPY services ./services

# Build shared package first, then user-management (combined for fewer layers)
# RUN pnpm --filter services/shared run build && \
    # pnpm --filter services/user-management run build
#  
# ---- STAGE 2: Production Dependencies ----
# FROM node:18-alpine AS prod-deps

# WORKDIR /app

# RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# COPY services/user-management/package.json ./services/user-management/
# COPY services/shared/package.json ./services/shared/

# Install ONLY production dependencies (smaller final image)
#  RUN pnpm install --shamefully-hoist

# ---- STAGE 3: Runtime ----
# FROM node:18-alpine
# 
#  WORKDIR /app

#  ENV NODE_ENV=production

# Copy ONLY production dependencies (not dev dependencies)
#  COPY --from=prod-deps /app/node_modules ./node_modules

#  Copy built artifacts from builder
#  COPY --from=builder /app/services/user-management/dist ./dist
# #   COPY --from=builder /app/services/user-management/package.json ./package.json

#  Copy built shared package into node_modules
# #  COPY --from=builder /app/services/shared/build ./node_modules/@fixserv-colauncha/shared/build
# #  COPY --from=builder /app/services/shared/package.json ./node_modules/@fixserv-colauncha/shared/package.json
# 
#  COPY --from=builder /app/services/user-management/.env .env
# 



# EXPOSE 4000
# 
# CMD ["node", "dist/index.js"]


FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.5 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/user-management/package.json ./services/user-management/

# Install root workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY services ./services

# Install service-level dependencies (includes dotenv and all runtime deps)
RUN cd services/user-management && pnpm install --no-frozen-lockfile

# Build TypeScript
RUN cd services/user-management && pnpm run build

# ---- Runtime ----
FROM node:22-alpine

WORKDIR /app

# Copy root node_modules (shared packages like @fixserv-colauncha/shared)
COPY --from=builder /app/node_modules ./node_modules

# ── KEY FIX: also copy service-level node_modules ────────────────────────
# dotenv and all other service deps live here, not in root node_modules
COPY --from=builder /app/services/user-management/node_modules ./services/user-management/node_modules

# Copy the compiled output
COPY --from=builder /app/services/user-management/dist ./dist

# Copy package.json so Node knows how to resolve modules
COPY --from=builder /app/services/user-management/package.json ./

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]












































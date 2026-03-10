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


# ---- STAGE 1: Builder ----
FROM node:18-alpine AS builder
WORKDIR /app
#  
RUN npm install -g pnpm
 
 COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
 COPY services/user-management/package.json ./services/user-management/
 
RUN pnpm install --shamefully-hoist
 
COPY services ./services

 RUN cd services/user-management && pnpm install --shamefully-hoist
RUN cd services/user-management && pnpm run build

# ---- STAGE 3: Runtime ----
FROM node:18-alpine
WORKDIR /app
# 
COPY --from=builder /app/node_modules ./node_modules
 COPY --from=builder /app/services/user-management/dist ./dist
 COPY --from=builder /app/services/user-management/package.json ./
 
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]



















































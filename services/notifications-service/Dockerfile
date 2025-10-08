# # ---- STAGE 1: Builder ----
# FROM node:18-alpine AS builder

# WORKDIR /app

# # Install pnpm globally
# RUN npm install -g pnpm

# # Copy monorepo root files
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# # Copy all service-level package.json files for dependency resolution
# COPY services/notifications-service/package.json ./services/notifications-service/
# # COPY services/shared/package.json ./services/shared/

# # Install all workspace dependencies (dev + prod)
# RUN pnpm install --shamefully-hoist

# # Copy the rest of the workspace
# COPY services ./services

# # Build shared package first
# # RUN cd services/shared && pnpm run build
# # RUN pnpm --filter services/shared run build

# # 🔥 Run the build script from the root using workspace filter
# RUN cd pnpm install --shamefully-hoist
# RUN cd pnpm run build
# RUN ls -R /app/services/notifications-service

# # ---- STAGE 2: Runtime ----
# FROM node:18-alpine

# WORKDIR /app

# # 
# # 
# COPY --from=builder /app/node_modules ./node_modules

# # Copy built shared package
# # COPY --from=builder /app/services/shared/build ./node_modules/@fixserv-colauncha/shared



# COPY --from=builder /app/services/notifications-service/dist ./dist
# COPY --from=builder /app/services/notifications-service/package.json ./

# # Copy shared package into node_modules to simulate npm install
# # COPY --from=builder /app/services/shared/build ./node_modules/@fixserv-colauncha/shared/build
# # COPY --from=builder /app/services/shared/package.json ./node_modules/@fixserv-colauncha/shared/package.json


# # COPY --from=builder /app/services/shared/build ./node_modules/@fixserv-colauncha/shared


# ENV NODE_ENV=production
# COPY --from=builder /app/services/notifications-service/.env .env




# CMD ["node", "dist/index.js"]

# ---- STAGE 1: Builder ----
FROM node:18-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/notifications-service/package.json ./services/notifications-service/

RUN pnpm install --shamefully-hoist

COPY services ./services

RUN cd services/notifications-service && pnpm install --shamefully-hoist
RUN cd services/notifications-service && pnpm run build

# ---- STAGE 2: Runtime ----
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/notifications-service/dist ./dist
COPY --from=builder /app/services/notifications-service/package.json ./

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]

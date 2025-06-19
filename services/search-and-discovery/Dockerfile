FROM node:18-alpine

WORKDIR /app


COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./



COPY services/search-and-discovery/package.json ./services/search-and-discovery/


RUN npm install -g pnpm && \
    pnpm install --shamefully-hoist 
    # pnpm build 

COPY services/search-and-discovery ./services/search-and-discovery

WORKDIR /app/services/search-and-discovery


CMD ["/app/node_modules/ts-node-dev/lib/bin.js", "--respawn", "src/index.ts"]
# CMD ["node","dist/index.js"]


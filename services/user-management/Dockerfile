FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml  ./

COPY services/user-management/package.json ./services/user-management/

# Install with --shamefully-flatten to completely avoid symlinks

RUN npm install -g pnpm && \
    pnpm install --shamefully-hoist 
 

     
COPY services/user-management ./services/user-management/

WORKDIR /app/services/user-management

RUN pnpm --filter ./services/user-management... run build


CMD ["node","dist/index.js"]


# CMD ["/app/node_modules/ts-node-dev/lib/bin.js", "--respawn", "src/index.ts"]



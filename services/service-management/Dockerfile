FROM node:18-alpine

WORKDIR /app


COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./



COPY services/service-management/package.json ./services/service-management/


RUN npm install -g pnpm && \
    pnpm install --shamefully-hoist 
    # pnpm build 

COPY services/service-management ./services/service-management

WORKDIR /app/services/service-management

RUN pnpm --filter ./services/service-management... run build

CMD ["/app/node_modules/ts-node-dev/lib/bin.js", "--respawn", "src/index.ts"]
# CMD ["node","dist/index.js"]


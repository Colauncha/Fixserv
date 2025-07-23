FROM node:18-alpine

WORKDIR /app


COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./



COPY services/order-management/package.json ./services/order-management/



RUN npm install -g pnpm && \
    pnpm install --shamefully-hoist 


COPY services/order-management ./services/order-management

WORKDIR /app/services/order-management


CMD ["/app/node_modules/ts-node-dev/lib/bin.js", "--respawn", "src/index.ts"]

# CMD ["node","dist/index.js"]

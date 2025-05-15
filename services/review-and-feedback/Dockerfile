FROM node:18-alpine

WORKDIR /app


COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./







COPY services/review-and-feedback/package.json ./services/review-and-feedback/



RUN npm install -g pnpm && \
    pnpm install --shamefully-hoist 


COPY services/review-and-feedback ./services/review-and-feedback

WORKDIR /app/services/review-and-feedback

RUN pnpm --filter ./services/review-and-feedback... run build

# CMD ["/app/node_modules/ts-node-dev/lib/bin.js", "--respawn", "src/index.ts"]

CMD ["node","dist/index.js"]

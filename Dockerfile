FROM node:22-alpine AS builder
WORKDIR /tmp/build

COPY package.json tsconfig.json ./
COPY src ./src
RUN npm i
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /tmp/build/package.json ./
COPY --from=builder /tmp/build/dist ./dist
RUN npm i --omit=dev

ENTRYPOINT ["node", "/app/dist/notes-mcp-server.js"]
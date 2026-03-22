FROM node:22-slim AS base
WORKDIR /app

# Install dependencies for all packages
COPY packages/agent/package.json packages/agent/package-lock.json* packages/agent/
COPY packages/server/package.json packages/server/package-lock.json* packages/server/
COPY packages/frontend/package.json packages/frontend/package-lock.json* packages/frontend/
RUN cd packages/agent && npm install --production=false
RUN cd packages/server && npm install --production=false
RUN cd packages/frontend && npm install --production=false

# Copy source
COPY packages/agent/ packages/agent/
COPY packages/server/ packages/server/
COPY packages/frontend/ packages/frontend/

# Build all packages
RUN cd packages/agent && npx tsc
RUN cd packages/server && npx tsc
RUN cd packages/frontend && npx vite build

# Runtime
FROM node:22-slim
WORKDIR /app

COPY --from=base /app/packages/agent/dist packages/agent/dist
COPY --from=base /app/packages/agent/node_modules packages/agent/node_modules
COPY --from=base /app/packages/agent/package.json packages/agent/package.json
COPY --from=base /app/packages/server/dist packages/server/dist
COPY --from=base /app/packages/server/node_modules packages/server/node_modules
COPY --from=base /app/packages/server/package.json packages/server/package.json
COPY --from=base /app/packages/frontend/dist packages/frontend/dist
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]

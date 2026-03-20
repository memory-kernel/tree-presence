FROM node:22-slim AS base
WORKDIR /app

# Install dependencies for both packages
COPY packages/agent/package.json packages/agent/package-lock.json* packages/agent/
COPY packages/web/package.json packages/web/package-lock.json* packages/web/
RUN cd packages/agent && npm install --production=false
RUN cd packages/web && npm install --production=false

# Copy source
COPY packages/agent/ packages/agent/
COPY packages/web/ packages/web/

# Build both packages
RUN cd packages/agent && npx tsc
RUN cd packages/web && npx tsc

# Runtime
FROM node:22-slim
WORKDIR /app

COPY --from=base /app/packages/agent/dist packages/agent/dist
COPY --from=base /app/packages/agent/node_modules packages/agent/node_modules
COPY --from=base /app/packages/agent/package.json packages/agent/package.json
COPY --from=base /app/packages/web/dist packages/web/dist
COPY --from=base /app/packages/web/node_modules packages/web/node_modules
COPY --from=base /app/packages/web/package.json packages/web/package.json
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]

# Janki Design backend (Medusa v2). Build context: repository root.

FROM node:22-bookworm-slim AS build
WORKDIR /repo
COPY package.json package-lock.json .npmrc turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --no-audit --no-fund
COPY apps/backend apps/backend
RUN cd apps/backend && npx medusa build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/backend/.medusa/server ./
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund
# Starter product images; copied into the uploads volume on first start
COPY apps/backend/static ./seed-static
COPY deploy/backend-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 9000
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=10 \
  CMD node -e "fetch('http://127.0.0.1:9000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/entrypoint.sh"]

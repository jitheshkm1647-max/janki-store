# Janki Design storefront (Next.js). Build context: repository root.
# The site is built when the container first starts, because the build reads
# the catalogue from the running backend.

FROM node:22-bookworm-slim
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY apps/storefront/package.json apps/storefront/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/storefront ./
COPY deploy/storefront-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=300s --retries=10 \
  CMD node -e "fetch('http://127.0.0.1:8000/in').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/entrypoint.sh"]

# ==============================================================================
# Aegis Student Telemetry Platform: Production Web Dashboard Dockerfile
# Standalone Next.js multi-stage build with non-root user
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code and configurations
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production Minimal Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user creation
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Support monorepo nested path if generated
RUN if [ -d "./apps/dashboard" ]; then \
      mkdir -p ./apps/dashboard/.next && \
      cp -r ./.next/static ./apps/dashboard/.next/static; \
    fi

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["sh", "-c", "if [ -f apps/dashboard/server.js ]; then node apps/dashboard/server.js; else node server.js; fi"]

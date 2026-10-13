# 06. Deployment, Operations & Testing Runbook

## 1. Overview

This document serves as the operational manual for deploying, running, and verifying the Aegis Student Telemetry Platform in both local development environments and multi-container production environments.

---

## 2. Production Docker Orchestration (`docker-compose.prod.yml`)

The production deployment consists of five isolated, networked microservices:

```
┌──────────────────────────────────────────────────────────┐
│                   INTERNET / CLIENTS                     │
└────────────────────────────┬─────────────────────────────┘
                             │ Ports 80 & 443
                             ▼
┌──────────────────────────────────────────────────────────┐
│          1. NGINX SSL REVERSE PROXY (aegis-proxy)        │
│          - TLS 1.3 Termination                           │
│          - SSE & WebSocket Buffer Bypass                 │
└──────────────┬────────────────────────────┬──────────────┘
               │ /api/                      │ /
               ▼                            ▼
┌────────────────────────────┐ ┌───────────────────────────┐
│ 2. INGESTION BACKEND       │ │ 3. MANAGEMENT DASHBOARD   │
│    (aegis-backend:4000)    │ │    (aegis-dashboard:3000) │
│    - Fastify Clustered API │ │    - Next.js 14 Standalone│
└──────────────┬─────────────┘ └───────────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌──────────────┐
│ 4. REDIS 7   │ │ 5. TIMESCALE │
│ (aegis-redis)│ │ (TimescaleDB)│
│ - Dedup LRU  │ │ - Hypertable │
└──────────────┘ └──────────────┘
```

### 2.1 Service Specifications

1. **`timescaledb` (`timescale/timescaledb:latest-pg16`)**:
   - Volume-mounted persistent data directory: `timescaledb_data`.
   - Auto-executes `001_create_telemetry_schema.sql` on first boot via `/docker-entrypoint-initdb.d/`.
   - Healthcheck: `pg_isready -U postgres -d telemetry_db`.
2. **`redis` (`redis:7-alpine`)**:
   - Enforces password authentication: `--requirepass ${REDIS_PASSWORD}`.
   - Memory management: `--maxmemory 256mb --maxmemory-policy allkeys-lru`.
   - Snapshot persistence: `--save 60 1`.
3. **`backend` (Fastify Ingestion API)**:
   - Multi-stage Docker build targeting non-root user `nodejs:nodejs`.
   - Connection pool limit: `DATABASE_POOL_MAX=30`.
   - Healthcheck: `wget http://localhost:4000/health/live`.
4. **`dashboard` (Next.js 14 Web App)**:
   - Multi-stage standalone output Docker build targeting `nextjs:nodejs`.
   - Proxies backend requests through Nginx internal upstream.
5. **`nginx` (Edge Reverse Proxy)**:
   - Exposes ports `80` (HTTP redirect) and `443` (TLS 1.3).
   - Dedicated configuration disabling buffer delay on SSE endpoints.

---

## 3. Production Launch Commands

### 3.1 Start the Complete Production Stack
```bash
# Export production passwords
export DB_PASSWORD="AegisStrongProdPassword2026!"
export REDIS_PASSWORD="AegisStrongRedisPassword2026!"
export JWT_SECRET="aegis-production-secret-token-key-2026-xyz"

# Launch in detached mode with build
docker compose -f docker-compose.prod.yml up -d --build
```

### 3.2 Inspect Stack Health & Logs
```bash
# View container status
docker compose -f docker-compose.prod.yml ps

# Follow logs from Ingestion Backend
docker compose -f docker-compose.prod.yml logs -f backend

# Follow logs from Nginx Proxy
docker compose -f docker-compose.prod.yml logs -f nginx
```

---

## 4. Local Development: Host in 1 Step

To run the platform locally on your development machine without Docker:

```bash
./start.sh
# or
./scripts/dev.sh
```

### What `scripts/dev.sh` Does Automatically:
1. Loads environment configuration from the centralized root `.env` file.
2. Checks Node.js runtime compatibility.
3. Automatically installs dependencies in `services/backend` and `apps/dashboard` if missing.
4. Seeds the database with **80+ categorized application packages** and a test fleet of students (`seed_categories.ts`).
5. Concurrently boots:
   - **Fastify Ingestion API** on `http://localhost:4000`.
   - **Next.js Web Management Dashboard** on `http://localhost:3001`.
6. Traps termination signals (`SIGINT`, `SIGTERM`, `EXIT`) to guarantee clean, leak-free shutdowns.

---

## 5. Android Client Build Pipeline

The repository provides automated compilation scripts in `scripts/`:

### 5.1 Automated APK Compilation (`scripts/build-mobile.sh`)
```bash
./scripts/build-mobile.sh
```

#### Build Pipeline Execution Steps:
1. Installs mobile npm dependencies (`apps/mobile/node_modules`).
2. Runs **Expo Prebuild** (`npx expo prebuild --platform android --no-install`), executing `plugins/withUsagePermissions.js` to inject Android system permissions.
3. Pre-bundles React Native JavaScript assets using `npx expo export:embed`.
4. Compiles the native Android Gradle project using `./gradlew assembleDebug`.
5. Copies the resulting APK directly to the root `release/` directory:
   - `release/student-telemetry-client.apk`

### 5.2 Release Android App Bundle (`scripts/build-release-aab.sh`)
```bash
./scripts/build-release-aab.sh
```
Compiles a production-ready, ProGuard-optimized **Android App Bundle (.aab)** for Google Play Store distribution.

---

## 6. Automated Pipeline Verification & Testing

The repository contains an end-to-end test suite (`scripts/test-pipeline.sh` executing `services/backend/src/test_e2e_pipeline.ts`):

```bash
./scripts/test-pipeline.sh
```

### Verification Checks Performed:

```
[TEST 1] Ingestion Backend Liveness & Readiness Probes
         ✓ GET /health/live returned 200 OK
         ✓ GET /health/ready returned 200 OK

[TEST 2] Device Enrollment & JWT Provisioning
         ✓ POST /api/v1/auth/pair-device provisioned valid token
         ✓ JWT decoded with studentId, deviceId, schoolId

[TEST 3] Batch Telemetry Ingestion (Zod Validation & Storage)
         ✓ Ingested batch of 15 realistic application intervals
         ✓ Status 200 OK returned with insertedCount = 15

[TEST 4] Redis Deduplication Idempotency Filter
         ✓ Re-transmitted the identical batch payload
         ✓ Backend detected duplicateCount = 15, insertedCount = 0

[TEST 5] Analytics Computation Verification
         ✓ Daily Focus Score calculated with mathematical precision
         ✓ 24-Hour Timeline Heatmap bucketed across all 24 hours
         ✓ Network Bandwidth aggregated with school hour spike checks
         ✓ Tamper detection engine evaluated fleet status

[TEST 6] Real-Time SSE Event Broadcasting
         ✓ EventSource client received broadcasted payload on /stream
```

---

## 7. Troubleshooting & Operational Runbook

### Issue: Android Device Cannot Reach Backend on Local Machine
- **Android Emulator**: Ensure endpoint is configured to `http://10.0.2.2:4000` (the special Android alias for the host loopback).
- **Physical Device**: Ensure device is on the same WiFi network and use your machine's LAN IP (e.g. `http://192.168.1.50:4000`).

### Issue: Mobile Client Permissions Revoked
- If Android battery saver or usage access is revoked, open the mobile app and tap **Grant Access** on the respective card in the **Settings** or **Today** tab.
- The app uses explicit Android intents:
  - Usage Stats: `Settings.ACTION_USAGE_ACCESS_SETTINGS`
  - Battery Optimization: `Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`

### Issue: Port 4000 or 3001 Already in Use
Check for existing processes:
```bash
lsof -i :4000
lsof -i :3001
# Terminate conflicting process
kill -9 <PID>
```

# 01. System Architecture & Topology

## 1. Executive Overview

The **Aegis Student Telemetry Platform** is an enterprise-grade monitoring, analytics, and privacy-governance platform designed for remote-learning environments. It allows educational institutions, parents, and administrators to gain visibility into student digital focus, educational engagement, and potential distractions without infringing on student privacy.

### The Problem It Solves
Traditional remote-learning solutions often suffer from either:
1. **Intrusive surveillance**: Logging keystrokes, taking webcam captures, and recording private chats—violating COPPA, FERPA, and GDPR principles.
2. **Fragile, inaccurate reporting**: Relying on coarse foreground estimations or polling-based battery monitors that are routinely killed by Android Doze mode and manufacturer battery savers.

### The Aegis Solution
Aegis implements an **event-driven, zero-content telemetry architecture**:
- Captures accurate Android `UsageEvents` (`ACTIVITY_RESUMED` / `ACTIVITY_PAUSED`) directly from the Linux kernel / Android OS layer.
- Measures network byte transfer deltas (`bytesRx` and `bytesTx`) per application UID.
- Buffers all telemetry on-device in a high-performance SQLite FIFO outbox queue.
- Transmits encrypted 15-minute batches using signed rotating JWT device tokens.
- De-duplicates incoming intervals using Redis and stores them in TimescaleDB hypertables.
- Visualizes real-time and historical analytics across interactive Next.js dashboards.

---

## 2. Monorepo Organization

The project is structured as a unified monorepo:

```
ankush/app/
├── apps/
│   ├── mobile/                    # Android React Native Client (Expo SDK 51 + Native Kotlin)
│   │   ├── modules/usage-telemetry/ # Custom Kotlin Native Module (API 34 / Android 14)
│   │   ├── plugins/               # Expo Config Plugins (permissions & manifest injection)
│   │   └── src/                   # React Native UI, SQLite storage, state management
│   └── dashboard/                 # Web Management & Analytics Dashboard (Next.js 14 App Router)
│       └── src/                   # Tailwind CSS, Recharts, SSE real-time stream components
├── services/
│   └── backend/                   # High-Throughput Ingestion & Analytics API (Node.js Fastify)
│       └── src/
│           ├── db/                # PostgreSQL/TimescaleDB connection pool & migrations
│           ├── middleware/        # JWT device verification & security handlers
│           ├── routes/            # Ingestion, analytics, student, and auth endpoints
│           └── services/          # Redis dedup, analytics calculator, SSE broadcaster
├── nginx/                         # Production Reverse Proxy & SSL Configuration
├── documents/                     # System Specifications & Technical Documentation
├── release/                       # Pre-compiled Android binaries (.apk / .aab)
├── scripts/                       # Orchestration, compilation, testing, and build scripts
├── docker-compose.prod.yml        # Multi-container production deployment stack
└── .env                           # Centralized configuration file
```

---

## 3. High-Level System Topology

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       ANDROID 14+ STUDENT CLIENT                          │
│                                                                           │
│   ┌────────────────────────┐         ┌──────────────────────────────┐     │
│   │   UsageStatsManager    │         │      NetworkStatsManager     │     │
│   │   ACTIVITY_RESUMED     │         │      Package UID Rx/Tx       │     │
│   │   ACTIVITY_PAUSED      │         │      Network Byte Deltas     │     │
│   └───────────┬────────────┘         └──────────────┬───────────────┘     │
│               │                                     │                     │
│               ▼                                     ▼                     │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │    EventIntervalCalculator & TelemetryOutboxDbHelper (SQLite)   │     │
│   │    Local Encrypted FIFO Buffer with Exponential Backoff         │     │
│   └────────────────────────────────┬────────────────────────────────┘     │
│                                    │                                      │
│                                    ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │    Android WorkManager: TelemetrySyncWorker (15-Min Cadence)    │     │
│   │    Constraints: NetworkType.CONNECTED, Doze-Bypass Keystore     │     │
│   └────────────────────────────────┬────────────────────────────────┘     │
└────────────────────────────────────┼──────────────────────────────────────┘
                                     │
                                     │ POST /api/v1/telemetry/batch
                                     │ Authorization: Bearer <Rotating-JWT>
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    NGINX SSL REVERSE PROXY (Port 443 / 80)                │
│             SSL Termination, HTTP/2, SSE Stream Buffer Bypass             │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                 FASTIFY INGESTION BACKEND (Port 4000)                     │
│                                                                           │
│   ┌────────────────────────┐         ┌──────────────────────────────┐     │
│   │  Device JWT Auth       │         │  Zod Schema Batch Validation │     │
│   │  Token Verification    │         │  Interval Range & Bounds     │     │
│   └───────────┬────────────┘         └──────────────┬───────────────┘     │
│               │                                     │                     │
│               ▼                                     ▼                     │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  Redis Deduplication Pipeline (24h TTL SHA256 Key Cache)        │     │
│   └────────────────────────────────┬────────────────────────────────┘     │
│                                    │                                      │
│                                    ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  TimescaleDB Idempotent Inserter (ON CONFLICT DO NOTHING)       │     │
│   └──────────────────┬──────────────────────────────┬───────────────┘     │
│                      │                              │                     │
│                      ▼                              ▼                     │
│   ┌─────────────────────────────┐    ┌──────────────────────────────┐     │
│   │ TimescaleDB 16 Hypertables  │    │ SSE Real-Time Broadcaster    │     │
│   │ PostgreSQL Partitioned Data │    │ Push to Live Dashboards      │     │
│   └─────────────────────────────┘    └──────────────┬───────────────┘     │
└─────────────────────────────────────────────────────┼─────────────────────┘
                                                      │
                                                      │ SSE Event Stream / REST
                                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                NEXT.JS 14 MANAGEMENT DASHBOARD (Port 3000)                │
│                                                                           │
│   - Daily Focus Score Radial Progress Gauge                               │
│   - 24-Hour Timeline Heatmap (08:00 - 15:00 School Hours Highlight)       │
│   - Network Bandwidth Anomaly & Streaming Spike Detection (>15MB)         │
│   - Tamper Alert System (>2h Sync Delays, Battery Saver Re-enables)       │
│   - Real-Time Live Telemetry Stream with Manual Simulator Hook            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Matrix

| Tier | Component | Technology Stack | Runtime / Port | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Client** | `apps/mobile` | React Native 0.74, Expo SDK 51, TypeScript | Android API 34+ | User interface, student onboarding, offline SQLite queue, privacy ledger modal. |
| **Native Module** | `usage-telemetry` | Kotlin 1.9, Android WorkManager, Keystore | In-process Android | Direct OS event calculation, UID byte tracking, background sync worker, Doze bypass. |
| **Proxy Tier** | `nginx` | Nginx Alpine, OpenSSL, TLS 1.3 | `:80`, `:443` | SSL termination, reverse proxying, WebSockets & Server-Sent Events (SSE) streaming. |
| **Ingestion Backend** | `services/backend`| Fastify 4, Node.js 20, TypeScript, Zod | `:4000` | High-throughput batch ingestion, JWT validation, Redis dedup, SSE broadcaster. |
| **Cache Tier** | `redis` | Redis 7.2 Alpine | `:6379` | High-speed deduplication pipeline, 24-hour interval seen cache, atomic batch checks. |
| **Database Tier** | `timescaledb` | PostgreSQL 16 + TimescaleDB Extension | `:5432` | Relational student/device catalog, hypertable time-series storage, automated compression. |
| **Web Dashboard** | `apps/dashboard` | Next.js 14, React 18, Tailwind CSS, Recharts | `:3001` (Dev) / `:3000` (Prod) | Real-time monitoring dashboard, focus score gauge, timeline heatmap, tamper alerts. |

---

## 5. Security & Trust Model

### 5.1 Device Enrollment & Token Rotation
1. **Device Pairing**: When a student enrolls via `POST /api/v1/auth/pair-device` using a unique Student Enrollment Code (e.g., `STU-94021`) and hardware fingerprint, the server provisions:
   - A unique `deviceId` (UUID v4).
   - A signed JWT **Device-Token** containing `deviceId`, `studentId`, and `schoolId`.
2. **Keystore Storage**: The Android client receives the token and immediately encrypts it in hardware-backed storage via `AndroidKeyStore` using AES-256 GCM in `SecureStorageManager.kt`.
3. **Rotating TTL**: Device tokens carry a 7-day expiration (`JWT_EXPIRY=7d`). Background sync requests authenticate via the HTTP header:
   ```http
   Authorization: Bearer <Device-Token-JWT>
   ```

### 5.2 Zero-Content Telemetry Policy (Privacy Ledger)

Aegis enforces a strict, architecturally verifiable **Zero-Content Telemetry** policy:

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│     WHAT AEGIS STRICTLY COLLECTS      │      WHAT AEGIS NEVER COLLECTS        │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ ✓ Application package names           │ ✗ Keystrokes, passwords, form inputs  │
│ ✓ Exact foreground start/end times    │ ✗ Screen recordings or screenshots    │
│ ✓ Foreground active session duration  │ ✗ Private chats, emails, or texts     │
│ ✓ Inbound bytes (bytesRx) per app UID │ ✗ Microphone or ambient audio         │
│ ✓ Outbound bytes (bytesTx) per app UID│ ✗ Camera or video recordings          │
│ ✓ Device OS version and sync status   │ ✗ Personal photos, videos, or files   │
│ ✓ Battery optimization status flags   │ ✗ GPS or granular physical location   │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

### 5.3 Network & Transport Hardening
- **TLS 1.3 Transport**: All communication between Android devices and the ingestion API is encrypted over HTTPS.
- **Strict Non-Root Containers**: Backend and dashboard Docker containers run under dedicated unprivileged system users (`nodejs:nodejs` and `nextjs:nodejs`).
- **Idempotency Guarantees**: A composite unique index on `(device_id, package_name, start_time)` ensures retransmissions do not distort analytics.

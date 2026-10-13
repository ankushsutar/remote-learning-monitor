# 05. End-to-End System Workflows & Lifecycles

## 1. Overview

This document provides a comprehensive operational breakdown of the core workflows in the Aegis platform. Each workflow is illustrated with a sequence diagram and accompanied by step-by-step technical execution details.

---

## 2. Workflow 1: Student Device Enrollment & Initial Pairing

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student / Guardian
    participant App as Mobile App (React Native)
    participant Keystore as Android KeyStore
    participant API as Ingestion Backend (Fastify)
    participant DB as TimescaleDB / PostgreSQL
    participant WM as Android WorkManager

    Student->>App: Launch App & Enter Student Code (e.g. STU-94021)
    Student->>App: Tap "Pair & Authorize Device"
    App->>API: POST /api/v1/auth/pair-device {studentCode, deviceFingerprint, osVersion}
    API->>DB: Query students WHERE student_code = $1 AND is_active = true
    DB-->>API: Return Student Record (id, name, school_id)
    API->>DB: INSERT INTO devices (student_id, fingerprint, os) ON CONFLICT UPDATE
    DB-->>API: Return device_id (UUID v4)
    API->>API: Generate Signed JWT Device-Token (7-day TTL)
    API-->>App: HTTP 200 {token, deviceId, studentName}
    App->>Keystore: Encrypt & Store token, deviceId, backendUrl (AES-256 GCM)
    App->>WM: Schedule PeriodicTelemetrySyncWorker (15-min cadence)
    App->>Student: Display Pairing Confirmation & Launch Permission Wizard
```

### Technical Details:
1. **Enrollment Code Input**: The student enters their code manually or opens a school pairing deep link (`telemetry://pair?code=STU-94021&url=https://...`).
2. **Device Fingerprint Extraction**: The app generates a hardware identifier combining Android build parameters (`Build.MANUFACTURER`, `Build.MODEL`, `Build.ID`).
3. **Hardware Keystore Storage**: Credentials are immediately handed over to `SecureStorageManager.kt` and encrypted via hardware-backed Android KeyStore keys.
4. **WorkManager Initialization**: `TelemetrySyncWorker.schedulePeriodicSync(context)` enqueues the 15-minute background synchronization job with `ExistingPeriodicWorkPolicy.UPDATE`.

---

## 3. Workflow 2: On-Device Interval Collection & Local Buffering

```mermaid
sequenceDiagram
    autonumber
    participant OS as Android OS (Kernel)
    participant EIC as EventIntervalCalculator
    participant NSH as NetworkStatsHelper
    participant Outbox as SQLite Outbox (WAL)
    participant App as React Native UI

    Note over OS: Student uses applications (Google Classroom, YouTube, etc.)
    OS->>EIC: Log UsageEvents (ACTIVITY_RESUMED / ACTIVITY_PAUSED)
    OS->>NSH: Record Network Packet Deltas per UID
    Note over EIC,NSH: Periodic 15-Minute Sampling Window Triggers
    EIC->>EIC: Calculate foreground durations per package (exclude lock screen)
    NSH->>NSH: Compute bytesRx and bytesTx per package UID
    EIC->>Outbox: Enqueue AppTelemetryRecords (INSERT INTO telemetry_outbox)
    NSH->>Outbox: Attach rx/tx network byte counters
    Outbox-->>App: Update pendingCount and bufferedRecords in useTelemetry hook
    App->>App: Render updated Focus Ring & Leaderboard
```

### Technical Details:
1. **Direct OS Querying**: Every 15 minutes (or on manual snapshot trigger), `UsageStatsManager.queryEvents(startTime, endTime)` is inspected.
2. **Foreground Focus Parsing**: `ACTIVITY_RESUMED` marks the start of an active interval, and `ACTIVITY_PAUSED` marks the conclusion.
3. **Lock Screen Compensation**: `KEYGUARD_SHOWN` and `SCREEN_NON_INTERACTIVE` events trigger immediate interval truncation so idle time is never counted.
4. **Local FIFO Enqueue**: Records are stored in Android SQLite WAL mode. Even if the phone immediately loses power, the intervals remain completely preserved.

---

## 4. Workflow 3: Background Sync via Android WorkManager

```mermaid
sequenceDiagram
    autonumber
    participant WM as Android WorkManager
    participant Worker as TelemetrySyncWorker
    participant Outbox as SQLite Outbox
    participant Keystore as Android KeyStore
    participant API as Ingestion Backend
    participant DB as TimescaleDB

    WM->>Worker: doWork() Triggered (15-min periodic, NetworkType.CONNECTED)
    Worker->>Keystore: Read backendUrl, deviceToken, lastSyncTimestamp
    Worker->>Outbox: Query getPendingRecords(limit = 100)
    alt Outbox is Empty
        Worker->>Keystore: Update lastSyncTimestamp = now
        Worker-->>WM: Return Result.success()
    else Outbox Has Records
        Worker->>API: POST /api/v1/telemetry/batch (Bearer JWT, 100 intervals)
        alt Server Responds HTTP 200 OK
            API->>DB: Batch Insert & Update last_sync_at
            API-->>Worker: HTTP 200 {success: true, insertedCount: 100}
            Worker->>Outbox: deleteRecords(pendingIds)
            Worker->>Keystore: Update lastSyncTimestamp = now
            Worker-->>WM: Return Result.success()
        else Network Timeout / Server 5xx Error
            API--xWorker: Connection Failed / 503 Service Unavailable
            Worker->>Outbox: incrementRetry(pendingIds)
            Worker-->>WM: Return Result.retry() (Exponential Backoff: 5m, 10m, 20m)
        end
    end
```

### Technical Details:
1. **Network Constraint**: The sync worker only fires when `NetworkType.CONNECTED` is satisfied, preventing unnecessary battery drain on offline devices.
2. **Atomic Ingestion Acknowledgement**: Outbox records are strictly deleted **after** the server returns `HTTP 200`.
3. **Exponential Backoff**: If transmission fails, `WorkManager` reschedules the attempt using `BackoffPolicy.EXPONENTIAL` (5 minutes base interval).

---

## 5. Workflow 4: Batch Ingestion, Validation, Deduplication & Storage

```mermaid
sequenceDiagram
    autonumber
    participant Client as Mobile Client
    participant Auth as Fastify Auth Middleware
    participant Zod as Zod Validation Schema
    participant Redis as Redis Deduplication Cache
    participant Service as TelemetryService
    participant DB as TimescaleDB Hypertables

    Client->>Auth: POST /api/v1/telemetry/batch (Authorization: Bearer <Token>)
    Auth->>Auth: Verify JWT signature & expiration
    Auth->>Zod: Validate request payload structure
    Zod->>Zod: Check endTime >= startTime & non-negative values
    Zod->>Service: ingestBatch(deviceId, intervals)
    Service->>Redis: Pipeline multi-EXISTS (dedup:{devId}:{pkg}:{start})
    Redis-->>Service: Return duplicate bitmask
    Service->>Service: Filter out previously seen duplicates
    Service->>DB: Batch INSERT INTO telemetry_intervals ON CONFLICT DO NOTHING
    Service->>DB: UPDATE devices SET last_sync_at = now WHERE id = deviceId
    Service->>Redis: Mark newly seen intervals (24-Hour TTL)
    Service-->>Client: HTTP 200 {totalReceived, insertedCount, duplicateCount}
```

### Technical Details:
1. **Zod Schema Bounds Enforcement**: Ensures batches contain between 1 and 1000 items and rejects inverted timestamps.
2. **Redis Fast Pipeline**: Avoids database query overhead by dropping retransmissions directly in memory.
3. **Idempotent Insertion**: Uses PostgreSQL's `ON CONFLICT (device_id, package_name, start_time) DO NOTHING` to guarantee mathematical idempotency.

---

## 6. Workflow 5: Real-Time Telemetry Broadcasting to Dashboard

```mermaid
sequenceDiagram
    autonumber
    participant Client as Android Client
    participant Ingestion as Ingestion API (/batch)
    participant Broadcaster as SSE Broadcaster (/stream)
    participant Dashboard as Web Dashboard (Next.js)
    actor Admin as School Administrator

    Admin->>Dashboard: Open Management Dashboard (http://localhost:3000)
    Dashboard->>Broadcaster: GET /api/v1/telemetry/stream (EventSource Connection)
    Broadcaster-->>Dashboard: SSE Connection Established (200 text/event-stream)
    Note over Client: TelemetrySyncWorker transmits 15-minute batch
    Client->>Ingestion: POST /api/v1/telemetry/batch
    Ingestion->>Ingestion: Ingest & Persist to Database
    Ingestion->>Broadcaster: broadcast(payload)
    Broadcaster-->>Dashboard: event: message data: {deviceId, studentName, intervals}
    Dashboard->>Dashboard: Slide in live event card into LiveTelemetryStream
    Dashboard->>Dashboard: Re-fetch /api/v1/analytics/focus-score & timeline
    Dashboard-->>Admin: Visual update: Gauge re-animates & Heatmap increments
```

### Technical Details:
1. **Server-Sent Events (SSE)**: Provides low-overhead unidirectional event streaming without the complexity of bidirectional WebSockets.
2. **Reverse Proxy Compatibility**: Nginx configuration includes `proxy_buffering off` and `proxy_read_timeout 86400s` to ensure immediate push delivery without chunk buffering.

---

## 7. Workflow 6: Automated Tamper & Anomaly Alert Workflow

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Analytics Engine
    participant DB as TimescaleDB / Devices Table
    participant Dashboard as Web Dashboard
    actor Guardian as Student Guardian

    loop Every 60 Seconds
        Cron->>DB: Query devices WHERE is_active = true
        DB-->>Cron: Return device list with last_sync_at and battery_opt flags
        Cron->>Cron: Calculate delay = now - last_sync_at
        alt delay > 2 Hours
            Cron->>Cron: Trigger TamperAlert {type: 'SYNC_TIMEOUT', severity: 'CRITICAL'}
        end
        alt battery_optimization_disabled == false
            Cron->>Cron: Trigger TamperAlert {type: 'BATTERY_OP_RE_ENABLED', severity: 'WARNING'}
        end
    end
    Dashboard->>Cron: GET /api/v1/analytics/tamper-alerts
    Cron-->>Dashboard: Return active tamper alert list
    Dashboard->>Dashboard: Render glowing red alert badge on TamperAlertIndicator
    Dashboard->>Guardian: Guardian clicks "Send Guardian Warning"
    Dashboard->>Dashboard: Dispatches SMS / Push Notification to Guardian
```

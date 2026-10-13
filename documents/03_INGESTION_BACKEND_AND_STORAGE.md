# 03. Ingestion Backend, Storage & Redis Pipeline

## 1. Overview

The Aegis Ingestion Backend (`services/backend`) is a high-throughput, low-latency microservice written in **Node.js, TypeScript, and Fastify**. It is responsible for authenticating student mobile clients, validating batches of telemetry intervals, deduplicating records in-memory, persistently storing time-series data into **PostgreSQL / TimescaleDB**, and broadcasting real-time ingestion events to connected web dashboards.

---

## 2. Ingestion Pipeline Architecture

```
[ Android Client ]
       │
       │ HTTP POST /api/v1/telemetry/batch (Bearer JWT)
       ▼
┌────────────────────────────────────────────────────────┐
│ 1. Device Token Auth Middleware (verifyDeviceToken)    │
│    - Validates JWT signature & expiry                  │
│    - Extracts deviceId, studentId, schoolId            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Zod Schema Validation (TelemetryBatchSchema)        │
│    - Validates interval limits (1 to 1000 items)       │
│    - Validates bounds: endTime >= startTime            │
│    - Validates non-negative duration & byte values     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Redis Deduplication Pipeline (RedisCache)           │
│    - Generates dedup keys: dedup:{devId}:{pkg}:{start} │
│    - Executes atomic pipeline multi-EXISTS query       │
│    - Drops previously seen intervals (24-hour TTL)     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. TimescaleDB Idempotent Inserter                     │
│    - Batch INSERT INTO telemetry_intervals             │
│    - ON CONFLICT (device_id, package_name, start_time) │
│      DO NOTHING                                        │
│    - Updates devices.last_sync_at timestamp           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 5. SSE Real-Time Broadcaster (telemetryBroadcaster)    │
│    - Pushes event payload to /api/v1/telemetry/stream  │
│    - Updates real-time activity stream on dashboard    │
└────────────────────────────────────────────────────────┘
```

---

## 3. High-Throughput Engine (Fastify)

Aegis uses **Fastify 4** instead of Express for several structural reasons:
1. **Low Overhead**: Fastify provides up to 5x higher request throughput than Express.
2. **Schema Compilation**: Request bodies are parsed and validated using compiled schemas for optimal CPU utilization.
3. **Graceful Shutdown**: The server intercepts `SIGINT` and `SIGTERM` signals to cleanly drain active HTTP connections, close database pools, and disconnect Redis clients.

---

## 4. Authentication & Security Middleware

### Device Token Authentication (`middleware/auth.ts`)
All ingestion routes require a signed device token:

```typescript
export async function verifyDeviceToken(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as DeviceTokenPayload;
    request.device = payload;
  } catch {
    return reply.status(401).send({ error: 'Unauthorized: Invalid or expired device token' });
  }
}
```

---

## 5. Redis Deduplication Pipeline (`services/redisService.ts`)

When mobile devices experience intermittent network connectivity, WorkManager may retry batches that were partially received by the server. If unchecked, this causes redundant database writes.

Aegis mitigates this by passing incoming records through a **Redis pipeline cache**:

```typescript
// Key generation format
private getKey(deviceId: string, packageName: string, startTime: number): string {
  return `dedup:${deviceId}:${packageName}:${startTime}`;
}

async filterNewRecords<T extends { packageName: string; startTime: number }>(
  deviceId: string,
  records: T[]
): Promise<{ newRecords: T[]; duplicateCount: number }> {
  const pipeline = this.client.pipeline();
  for (const r of records) {
    pipeline.exists(this.getKey(deviceId, r.packageName, r.startTime));
  }
  const results = await pipeline.exec();

  const newRecords: T[] = [];
  let duplicateCount = 0;

  for (let i = 0; i < records.length; i++) {
    const [err, exists] = results[i];
    if (!err && exists === 1) {
      duplicateCount++;
    } else {
      newRecords.push(records[i]);
      // Mark as seen with a 24-hour expiration window
      await this.markSeen(deviceId, records[i].packageName, records[i].startTime, 86400);
    }
  }

  return { newRecords, duplicateCount };
}
```

---

## 6. TimescaleDB / PostgreSQL Schema Architecture

The database schema (`001_create_telemetry_schema.sql`) is engineered specifically for time-series scalability:

```sql
-- 1. App Categories Catalog Table
CREATE TABLE IF NOT EXISTS app_categories (
    package_name VARCHAR(255) PRIMARY KEY,
    app_name VARCHAR(255) NOT NULL,
    category app_category_enum NOT NULL DEFAULT 'UNCLASSIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Telemetry Intervals Hypertable
CREATE TABLE IF NOT EXISTS telemetry_intervals (
    id BIGSERIAL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    foreground_duration_sec INTEGER NOT NULL DEFAULT 0,
    bytes_rx BIGINT NOT NULL DEFAULT 0,
    bytes_tx BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, start_time)
);

-- Strict composite unique index enforcing mathematical idempotency
CREATE UNIQUE INDEX IF NOT EXISTS uq_telemetry_device_pkg_start 
ON telemetry_intervals (device_id, package_name, start_time);

-- High-performance query indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_package_time 
ON telemetry_intervals (package_name, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_device_time 
ON telemetry_intervals (device_id, start_time DESC);
```

### TimescaleDB Optimization Policies:
1. **Hypertable Partitioning**: Telemetry intervals are automatically partitioned into time chunks based on `start_time`.
2. **Compression Policy (7 Days)**:
   ```sql
   PERFORM add_compression_policy('telemetry_intervals', INTERVAL '7 days');
   ```
   Chunks older than 7 days are compressed via columnar compression, reducing disk usage by 70–90%.
3. **Data Retention Policy (90 Days)**:
   ```sql
   PERFORM add_retention_policy('telemetry_intervals', INTERVAL '90 days');
   ```
   Outdated records are dropped automatically without manual cron jobs.

### Zero-Dependency In-Memory Fallback:
If PostgreSQL or TimescaleDB is temporarily offline during local development or unit testing, `connection.ts` automatically falls back to an in-memory database simulation that mimics SQL joins, date filtering, and unique constraints.

---

## 7. Real-Time Broadcaster (`telemetryBroadcaster.ts`)

Web dashboards maintain a live connection via **Server-Sent Events (SSE)** at `/api/v1/telemetry/stream`. When a student device uploads a batch, the server broadcasts an event payload containing:
- Device ID and student name
- Number of intervals in batch
- Total foreground duration (seconds)
- Total network data transferred (`bytesRx` and `bytesTx`)
- Preview of top 5 active applications

```typescript
telemetryBroadcaster.broadcast({
  deviceId: device.deviceId,
  studentName: `Device ${device.deviceId.slice(0, 8)}`,
  intervalCount: intervals.length,
  totalDurationSec: intervals.reduce((acc, i) => acc + i.foregroundDurationSec, 0),
  totalBytesRx: intervals.reduce((acc, i) => acc + i.bytesRx, 0),
  totalBytesTx: intervals.reduce((acc, i) => acc + i.bytesTx, 0),
  timestamp: new Date().toISOString(),
  intervals: intervals.slice(0, 5).map((i) => ({
    packageName: i.packageName,
    durationSec: i.foregroundDurationSec
  }))
});
```

---

## 8. REST API Reference

### 8.1 Device Pairing & Authentication
- **`POST /api/v1/auth/pair-device`**
  - **Body**: `{ "studentCode": "STU-94021", "deviceFingerprint": "...", "osVersion": "Android 14 (API 34)" }`
  - **Response (200)**:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "deviceId": "c8b87190-2e45-42f1-a1b9-37e42d7a224a",
      "studentName": "Alex Rivera",
      "studentCode": "STU-94021"
    }
    ```

### 8.2 Telemetry Ingestion
- **`POST /api/v1/telemetry/batch`**
  - **Headers**: `Authorization: Bearer <Device-Token>`
  - **Body**:
    ```json
    {
      "intervals": [
        {
          "packageName": "com.google.android.apps.classroom",
          "startTime": 1718000000000,
          "endTime": 1718000900000,
          "foregroundDurationSec": 820,
          "bytesRx": 1420000,
          "bytesTx": 340000
        }
      ]
    }
    ```
  - **Response (200)**:
    ```json
    {
      "success": true,
      "totalReceived": 1,
      "newRecordsProcessed": 1,
      "duplicateCount": 0,
      "insertedCount": 1,
      "timestamp": 1718000905000
    }
    ```

### 8.3 Analytics Endpoints
- **`GET /api/v1/analytics/focus-score?studentId=...&date=...`**: Calculates Daily Focus Score, category distribution, and total screen time.
- **`GET /api/v1/analytics/timeline?studentId=...&date=...`**: Generates 24-hour hour-by-hour application category distribution for the timeline heatmap.
- **`GET /api/v1/analytics/bandwidth?studentId=...&date=...`**: Evaluates network traffic and flags classroom hour streaming/gaming spikes.
- **`GET /api/v1/analytics/tamper-alerts`**: Returns devices with sync delays (>2 hours) or disabled battery exemptions.
- **`GET /api/v1/telemetry/stream`**: Establishes persistent SSE event stream.
- **`POST /api/v1/telemetry/simulate`**: Emulates a batch push for live dashboard demonstrations.
- **`GET /health/live` & `GET /health/ready`**: Container liveness and readiness probes.

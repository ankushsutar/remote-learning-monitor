---
name: telemetry-backend-pipeline
description: >-
  Procedures for managing, testing, and debugging the Fastify ingestion API, Redis deduplication pipeline, and TimescaleDB hypertable persistence.
  Use this skill whenever working on telemetry ingestion endpoints, database migrations, deduplication caching, E2E pipeline verification, or Server-Sent Events (SSE) real-time streaming.
---

# Telemetry Ingestion Backend & Storage Pipeline Skill

This skill contains standard procedures for developing, testing, and benchmarking the high-throughput Fastify ingestion backend (`services/backend`).

---

## 1. Running the CI/CD Pipeline Verification Suite

To verify all pipeline stages (Android native module, Dashboard typecheck, Backend security, Idempotency, and High-concurrency benchmarks):

```bash
bash scripts/test-pipeline.sh
```

### What this verifies:
1. **Liveness & Readiness probes**: `/health/live` and `/health/ready`.
2. **Cryptographic Device Pairing**: Checks JWT signing and device fingerprinting.
3. **Idempotent Ingestion**: Sends duplicate concurrent batches and verifies 0 duplicates are inserted into the database.
4. **Throughput Benchmark**: Tests 500 batches with concurrency=50 (typically achieves 7,000+ batches/sec).
5. **Autocannon Load Test**: Tests 50 concurrent connections with >50,000 req/sec.

---

## 2. Ingestion Route Architecture

- **Main Endpoint**: `POST /api/v1/telemetry/batch`
- **Authentication**: Requires header `Authorization: Bearer <Device-Token>`
- **Validation**: Enforced via Zod `TelemetryBatchSchema`:
  - Intervals must contain between 1 and 1000 items.
  - `endTime >= startTime`
  - Non-negative `foregroundDurationSec`, `bytesRx`, `bytesTx`.

---

## 3. Redis Deduplication Protocol

Before hitting PostgreSQL, every incoming interval is checked in Redis:
- Key Format: `dedup:${deviceId}:${packageName}:${startTime}`
- Pipeline Execution: `pipeline.exists(...)` drops duplicates with 0 DB overhead.
- Newly seen records are marked with a 24-hour TTL (`EX 86400`).

---

## 4. TimescaleDB / Database Ingestion Rules

- **Strict Composite Idempotency**:
  ```sql
  CREATE UNIQUE INDEX uq_telemetry_device_pkg_start 
  ON telemetry_intervals (device_id, package_name, start_time);
  ```
- **Insert Query**: Always insert with `ON CONFLICT (device_id, package_name, start_time) DO NOTHING`.
- **Sync Timestamp**: Always update `devices.last_sync_at` to the current timestamp upon successful batch ingestion.

---

## 5. Real-Time SSE Stream Testing

To monitor the live stream from the terminal:
```bash
curl -N -H "Accept: text/event-stream" http://localhost:4000/api/v1/telemetry/stream
```

To simulate an incoming client batch push:
```bash
curl -X POST http://localhost:4000/api/v1/telemetry/simulate \
  -H "Content-Type: application/json" \
  -d '{"studentCode":"STU-94021","intervalCount":5}'
```

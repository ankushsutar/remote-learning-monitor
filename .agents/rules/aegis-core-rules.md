---
description: Core architectural principles and non-negotiable coding guidelines for the Aegis Student Telemetry Platform.
always_on: true
---

# Aegis Core Repository Rules

## 1. Zero-Content Telemetry (Non-Negotiable Privacy Rule)
- Aegis monitors **duration**, **application package names**, and **network byte deltas** only.
- **NEVER** introduce code, libraries, or background services that capture:
  - Keystrokes, passwords, or text inputs.
  - Screenshots, screen recordings, or display buffers.
  - Microphone, ambient audio, or phone calls.
  - Camera, photos, or file storage contents.
  - Private messages, emails, or chat bodies.

## 2. Centralized Configuration
- All environment variables across backend, dashboard, and scripts **MUST** reside in the single root `.env` file.
- Do not create separate `.env` files inside `services/backend/` or `apps/dashboard/`.

## 3. Strict Idempotency in Database Operations
- All telemetry insertion logic must enforce the composite unique constraint:
  `(device_id, package_name, start_time)`
- Always use `ON CONFLICT DO NOTHING` to guarantee that duplicate network transmissions never distort analytics.

## 4. SQLite Outbox Resilience
- Any client-side SQLite storage (both native Android SQLite in `TelemetryOutboxDbHelper.kt` and `src/storage/db.ts`) must operate in Write-Ahead Logging (`WAL`) mode:
  `PRAGMA journal_mode = WAL;`
- Outbox records must **ONLY** be deleted after receiving an explicit `HTTP 200` response from the ingestion backend.

## 5. Signal Trapping in Shell Scripts
- In bash scripts containing cleanup traps (such as `dev.sh`), always disable the trap (`trap - SIGINT SIGTERM EXIT`) upon entering the cleanup function to prevent recursive execution loops.

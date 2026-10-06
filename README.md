# Aegis Telemetry & Monitoring Platform

> Production-grade, privacy-compliant, fault-tolerant Telemetry and Monitoring platform for remote-learning students.

---

## 1. System Topology

```
┌──────────────────────────────────────────────────────────────┐
│                    ANDROID CLIENT (/apps/mobile)             │
│  - Kotlin Native Module (API 34 / Android 14+)               │
│  - UsageStatsManager (ACTIVITY_RESUMED / ACTIVITY_PAUSED)   │
│  - NetworkStatsManager (UID Delta Rx/Tx bytes)               │
│  - Android WorkManager (15-min periodic background sync)     │
│  - expo-sqlite (Local FIFO buffer with exponential backoff)  │
└───────────────────────────────┬──────────────────────────────┘
                                │ POST /api/v1/telemetry/batch
                                │ (Signed rotating Device-Token JWT)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│              INGESTION BACKEND (/services/backend)           │
│  - Node.js + Fastify + TypeScript (Sub-millisecond latency)  │
│  - PostgreSQL + TimescaleDB (Hypertables & unique indexes)   │
│  - Redis-backed deduplication pipeline                       │
│  - Zod batch validation & Device auth middleware             │
└───────────────────────────────┬──────────────────────────────┘
                                │ Analytics Query APIs
                                ▼
┌──────────────────────────────────────────────────────────────┐
│             WEB DASHBOARD (/apps/dashboard)                  │
│  - Next.js 14 App Router + Tailwind CSS + Recharts           │
│  - Daily Focus Score Radial Gauge                            │
│  - 24-Hour Timeline Heatmap (School Hours 08:00 - 15:00)     │
│  - Bandwidth Consumption & Classroom Streaming Spike Alerts  │
│  - Automated Tamper Alerts (>2h sync timeout, Doze bypass)   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Centralized Configuration (`.env`)

All environment variables across the entire monorepo are consolidated into a single `.env` file at the repository root. A template is provided in [`.env.example`](./.env.example).

| Variable Category | Key Variables | Default Value | Description |
| :--- | :--- | :--- | :--- |
| **Global Runtime** | `NODE_ENV`, `LOG_LEVEL` | `development`, `info` | Node environment & log verbosity |
| **Ingestion Backend** | `PORT`, `HOST` | `4000`, `0.0.0.0` | Fastify HTTP server binding |
| **Security & Auth** | `JWT_SECRET`, `JWT_EXPIRY` | `antigravity-...`, `7d` | Rotating device token signing key & TTL |
| **Database** | `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string (auto-fallbacks to in-memory) |
| **Deduplication** | `REDIS_URL`, `REDIS_DEDUP_TTL_SEC` | `redis://...`, `86400` | Redis batch deduplication cache |
| **Web Dashboard** | `DASHBOARD_PORT`, `NEXT_PUBLIC_BACKEND_URL` | `3000`, `http://localhost:4000` | Next.js port & backend proxy target |
| **Mobile Client** | `EXPO_PUBLIC_BACKEND_URL` | `http://10.0.2.2:4000` | Target API URL (10.0.2.2 for Android Emulator) |
| **Compliance** | `TELEMETRY_SYNC_INTERVAL_MIN` | `15` | Periodic background WorkManager sync interval |
| **Tamper Alerts** | `TAMPER_SYNC_TIMEOUT_HOURS` | `2` | Inactivity threshold before triggering tamper alarm |
| **Spike Detection** | `CLASSROOM_BANDWIDTH_SPIKE_MB` | `15` | Streaming/gaming data limit during class hours |

---

## 3. Quickstart: Host Locally in 1 Step

To start the Ingestion Backend and Web Dashboard concurrently with automatic database seeding:

```bash
./start.sh
# or
./scripts/dev.sh
```

Once running:
- **Web Management Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Fastify Ingestion API:** [http://localhost:4000](http://localhost:4000)
- **API Health Check:** [http://localhost:4000/health](http://localhost:4000/health)

To run the automated verification test suite:
```bash
./scripts/test-pipeline.sh
```

---

## 3. How to Build the Mobile App (`apps/mobile`)

### Prerequisites
1. **Node.js 18+** & npm.
2. **JDK 17** (`openjdk-17-jdk`).
3. **Android Studio & SDK** targeting API 34 (`Android 14+`).
4. **Android device or emulator** connected via ADB.

### Option A: Automated Build Script
Run the automated script which installs dependencies, runs Expo prebuild with the custom config plugin, and builds the Gradle APK:

```bash
./scripts/build-mobile.sh
```

### Option B: Step-by-Step Manual Build
1. **Navigate to the mobile directory:**
   ```bash
   cd apps/mobile
   npm install
   ```

2. **Generate the native Android project via Expo Prebuild:**
   The custom plugin [`plugins/withUsagePermissions.js`](./plugins/withUsagePermissions.js) automatically injects required permissions (`PACKAGE_USAGE_STATS`, `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, `FOREGROUND_SERVICE`, `RECEIVE_BOOT_COMPLETED`) into `AndroidManifest.xml`:
   ```bash
   npx expo prebuild --platform android --no-install
   ```

3. **Compile the Debug APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The compiled APK is located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Install onto your connected device or emulator:**
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

5. **Launch the application:**
   ```bash
   adb shell am start -n com.telemetry.studentmonitor/com.telemetry.studentmonitor.MainActivity
   ```

---

## 4. How to Use the System

### Step 1: Device Enrollment
1. Open the **Student Telemetry Client** app on your Android device.
2. Enter the **Backend API Endpoint**:
   - For an **Android Emulator**: `http://10.0.2.2:4000`
   - For a **Physical Device**: `http://<your-machine-lan-ip>:4000`
3. Enter a valid student enrollment code (e.g. `STU-94021`).
4. Tap **Pair & Authorize Device**.
   - The device receives a signed rotating JWT `Device-Token` valid for 7 days.
   - The app automatically configures and starts the Android `WorkManager` background service.

### Step 2: Granting Required Android System Permissions
The mobile app displays permission status cards:
1. **Usage Access (`UsageStatsManager`):**
   - Tap **Grant Access**.
   - Android will open **Usage Access Settings**.
   - Toggle **Student Telemetry Client** to **Allowed**.
   - *Why this is needed:* Allows reading exact application foreground transitions (`ACTIVITY_RESUMED` / `ACTIVITY_PAUSED`) without estimating.
2. **Battery Optimization Exemption (`PowerManager`):**
   - Tap **Grant Access**.
   - Confirm the dialog asking to "Let app run in the background without battery optimization".
   - *Why this is needed:* Prevents Android Doze mode from killing periodic 15-minute `WorkManager` background sync cycles when the phone is idle.

### Step 3: Persistent Background Telemetry
- The app automatically runs `TelemetrySyncWorker` every 15 minutes with `NetworkType.CONNECTED` constraints.
- Intervals are written to the local SQLite FIFO queue first (`expo-sqlite`).
- When network connectivity is established, batches are uploaded to `POST /api/v1/telemetry/batch`.
- Upon successful HTTP 200 response, sent items are deleted from the local SQLite queue.
- If network fails, records are retained and retried with exponential backoff.
- You can tap **Capture 15m Telemetry** and **Sync Offline Buffer** at any time to trigger a manual sync.

### Step 4: Web Management Dashboard
Open [http://localhost:3000](http://localhost:3000) in your browser:

1. **Student Profile Switcher:**
   - Switch between **Aggregated Fleet View** and individual students (Alex Rivera, Maya Patel, Noah Davis, etc.).
2. **Daily Focus Score:**
   - Radial progress gauge measuring the ratio of `(PRODUCTIVE + EDUCATIONAL)` duration to total screen time.
   - Visual breakdown bars for Productive, Educational, Social Media, Gaming, and Entertainment.
   - Distraction Index penalty showing non-academic percentage.
3. **Timeline Heatmap:**
   - Stacked bar chart showing hour-by-hour app distribution.
   - Visual highlight of core classroom hours (08:00 – 15:00).
4. **Bandwidth Consumption:**
   - Area chart tracking upload/download traffic.
   - Automated detection of high-bandwidth streaming or gaming anomalies during class hours.
5. **Tamper Alert Indicator:**
   - Immediately flags any student whose device has not synced in > 2 hours (`SYNC_TIMEOUT`).
   - Flags any student who re-enabled Android battery optimization (`BATTERY_OP_RE_ENABLED`).
   - Includes one-click **Send Guardian Warning** action.
6. **Live Telemetry Stream:**
   - Click **Simulate Client Batch Push** to generate real-time incoming batches and observe instant UI updates.

---

## 5. Security & Privacy Architecture

- **Rotating Device-Token JWTs:** All batch requests require signed `Authorization: Bearer <Device-Token>` headers.
- **Strict Idempotency:** The database enforces a composite unique index on `(device_id, package_name, start_time)` with `ON CONFLICT DO NOTHING`, guaranteeing that retransmitted batches never double-count screen time.
- **Deduplication:** A fast Redis pipeline filter drops duplicate intervals before querying the database.
- **Privacy Compliance:** Only foreground session durations and application UID network byte deltas are monitored; keystrokes, personal messages, or screen contents are never recorded.

# 02. Android Client Engineering & Native Module

## 1. Overview

The mobile client (`apps/mobile`) is built on **React Native (Expo SDK 51)** running on Android API 34+ (Android 14). While standard React Native applications operate purely in JavaScript, low-level OS telemetry collection (such as foreground activity tracking and per-application network byte counting) requires direct access to restricted Android Linux kernel APIs.

To achieve this without compromising battery efficiency or falling victim to Android Doze mode, Aegis employs a custom native Android module written in **Kotlin** (`modules/usage-telemetry`) registered via the **Expo Modules API**.

---

## 2. Kotlin Native Module Architecture

The native module is organized into specialized subsystems:

```
apps/mobile/modules/usage-telemetry/android/src/main/java/expo/modules/usagetelemetry/
├── UsageTelemetryModule.kt       # Expo Module definition & JS Bridge
├── TelemetrySyncWorker.kt        # Android WorkManager 15-min periodic coroutine worker
├── db/
│   └── TelemetryOutboxDbHelper.kt # Local Android SQLite Outbox (WAL mode, FIFO)
├── models/
│   └── AppTelemetryRecord.kt     # In-memory telemetry data class
├── security/
│   └── SecureStorageManager.kt   # Android Keystore encrypted credential storage
├── service/
│   └── TelemetryForegroundService.kt # Optional persistent foreground service
└── utils/
    ├── EventIntervalCalculator.kt # UsageStatsManager event parser (RESUMED / PAUSED)
    └── NetworkStatsHelper.kt      # NetworkStatsManager UID byte delta calculator
```

---

## 3. Core Native Subsystems & Algorithms

### 3.1 Accurate Foreground Tracking (`EventIntervalCalculator.kt`)
Traditional monitoring apps estimate screen time by polling `ActivityManager.getRunningAppProcesses()` or `UsageStats.getTotalTimeInForeground()`. This leads to major inaccuracies because polling misses brief app switches, while cumulative stats cannot be isolated to specific 15-minute windows.

Aegis uses the event-stream approach via `UsageStatsManager.queryEvents(startTime, endTime)`:

```kotlin
// Event stream traversal algorithm
val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
val event = UsageEvents.Event()
val resumedTimestamps = mutableMapOf<String, Long>()

while (usageEvents.hasNextEvent()) {
    usageEvents.getNextEvent(event)
    val pkg = event.packageName ?: continue
    val timeStamp = event.timeStamp

    when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> {
            // App entered foreground
            resumedTimestamps[pkg] = timeStamp
        }
        UsageEvents.Event.ACTIVITY_PAUSED -> {
            // App exited foreground
            val resumeTime = resumedTimestamps.remove(pkg)
            val sessionStart = resumeTime?.coerceAtLeast(startTime) ?: startTime
            val sessionEnd = timeStamp.coerceAtMost(endTime)
            if (sessionEnd > sessionStart) {
                durationMap[pkg] = (durationMap[pkg] ?: 0L) + (sessionEnd - sessionStart)
            }
        }
        UsageEvents.Event.KEYGUARD_SHOWN,
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
            // User locked device or display turned off: pause all active sessions
            for ((activePkg, resumeTime) in resumedTimestamps) {
                val sessionStart = resumeTime.coerceAtLeast(startTime)
                val sessionEnd = timeStamp.coerceAtMost(endTime)
                if (sessionEnd > sessionStart) {
                    durationMap[activePkg] = (durationMap[activePkg] ?: 0L) + (sessionEnd - sessionStart)
                }
            }
            resumedTimestamps.clear()
        }
    }
}
```

#### Boundary Conditions Handled:
1. **App already active at `startTime`**: If an `ACTIVITY_PAUSED` event arrives without a preceding `ACTIVITY_RESUMED` within the query window, `sessionStart` safely defaults to `startTime`.
2. **App still active at `endTime`**: Any application remaining in `resumedTimestamps` when event iteration concludes is credited with duration up to `endTime`.
3. **Screen sleep / Lock Screen**: When the screen turns off (`SCREEN_NON_INTERACTIVE`) or the device is locked (`KEYGUARD_SHOWN`), all currently active sessions are immediately ended so background time is never counted as active student engagement.

---

### 3.2 Network Traffic Measurement (`NetworkStatsHelper.kt`)
To detect high-bandwidth distractions (e.g. streaming 4K video or gaming during classroom sessions), the client measures exact network consumption per package UID using Android's `NetworkStatsManager`.

1. **UID Resolution**: `PackageManager.getPackageUid(packageName, 0)` resolves the Android Linux user ID assigned to the application.
2. **Traffic Aggregation**: Both WiFi (`ConnectivityManager.TYPE_WIFI`) and Mobile (`ConnectivityManager.TYPE_MOBILE`) network interfaces are queried:

```kotlin
fun getNetworkUsageForUid(uid: Int, startTime: Long, endTime: Long): NetworkDelta {
    var rxBytes = 0L
    var txBytes = 0L

    // Query WiFi Traffic
    val wifiBucket = networkStatsManager.querySummaryForDevice(
        ConnectivityManager.TYPE_WIFI, null, startTime, endTime
    )
    // Query Cellular Traffic
    val mobileBucket = networkStatsManager.querySummaryForDevice(
        ConnectivityManager.TYPE_MOBILE, null, startTime, endTime
    )

    // Query specific UID summary
    val uidStats = networkStatsManager.queryDetailsForUid(
        ConnectivityManager.TYPE_WIFI, null, startTime, endTime, uid
    )
    val bucket = NetworkStats.Bucket()
    while (uidStats.hasNextBucket()) {
        uidStats.getNextBucket(bucket)
        rxBytes += bucket.rxBytes
        txBytes += bucket.txBytes
    }
    return NetworkDelta(rxBytes, txBytes)
}
```

---

### 3.3 Hardware-Encrypted Keystore Storage (`SecureStorageManager.kt`)
Student authentication tokens and server endpoint credentials must be protected against tampering by root users, third-party apps, or extraction via ADB backup.

`SecureStorageManager.kt` integrates with the `AndroidKeyStore` provider:
- Generates an **AES-256 GCM** secret key inside the hardware-backed keystore.
- Encrypts configuration preferences into a private file (`telemetry_secure_prefs.xml`).
- Stores:
  - `backend_url`: Ingestion server endpoint (e.g., `https://telemetry.school.edu`).
  - `device_token`: Signed 7-day rotating JWT device authorization token.
  - `device_id`: Canonical device UUID v4.
  - `last_sync_timestamp`: High-precision epoch timestamp of the last successful sync cycle.

---

### 3.4 Local SQLite Outbox Buffer (`TelemetryOutboxDbHelper.kt`)
To guarantee that student devices never lose data when offline (e.g. on school buses, remote locations, or during network drops), telemetry is saved to a local Android SQLite database before any network upload is attempted:

- **Storage Engine**: SQLite in **Write-Ahead Logging (WAL)** mode (`PRAGMA journal_mode = WAL;`).
- **Table Schema**:
  ```sql
  CREATE TABLE telemetry_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_name TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      foreground_duration_sec INTEGER NOT NULL,
      bytes_rx INTEGER NOT NULL,
      bytes_tx INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_outbox_time ON telemetry_outbox(start_time);
  ```
- **Lifecycle Operations**:
  - `enqueueRecords(records)`: Atomically inserts fresh 15-minute intervals.
  - `getPendingRecords(limit)`: Retrieves the oldest FIFO records for batch transmission.
  - `deleteRecords(ids)`: Purges records only after HTTP 200 server acknowledgement.
  - `incrementRetry(ids)`: Tracks failed delivery attempts for exponential backoff.

---

### 3.5 Enterprise WorkManager Sync Worker (`TelemetrySyncWorker.kt`)
Periodic background execution is managed through Android's modern `WorkManager` framework:

```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .build()

val syncRequest = PeriodicWorkRequestBuilder<TelemetrySyncWorker>(
    15, TimeUnit.MINUTES,
    5, TimeUnit.MINUTES // Flex window
)
    .setConstraints(constraints)
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 5, TimeUnit.MINUTES)
    .addTag("TelemetrySyncWorker")
    .build()

WorkManager.getInstance(context).enqueueUniquePeriodicWork(
    "PeriodicTelemetrySyncWorker",
    ExistingPeriodicWorkPolicy.UPDATE,
    syncRequest
)
```

#### Key Capabilities:
- **Periodic Execution**: Fires automatically every 15 minutes.
- **Doze Mode Resilience**: Uses a 5-minute flex interval so Android can batch wakeups efficiently without battery drain.
- **Clock Drift Protection**: Sanitizes `startTime` and `endTime` against system clock shifts (e.g. manual clock manipulation or timezone adjustments).
- **Automatic Purge**: Once the server accepts the batch, the corresponding SQLite IDs are wiped.

---

## 4. Permissions & Expo Config Plugin

Android requires specific elevated privileges for usage and power management:

| Permission | Category | Purpose | User Grant Mechanism |
| :--- | :--- | :--- | :--- |
| `android.permission.PACKAGE_USAGE_STATS` | Special App Access | Reading `UsageEvents` stream. | Directed Intent to `Settings.ACTION_USAGE_ACCESS_SETTINGS`. |
| `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Power Management | Doze mode exemption for background sync. | System dialog via `Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. |
| `android.permission.FOREGROUND_SERVICE` | System Service | Running ongoing notification service. | Declared in manifest. |
| `android.permission.RECEIVE_BOOT_COMPLETED` | System Broadcast | Rescheduling WorkManager upon device reboot. | Declared in manifest. |
| `android.permission.INTERNET` | Normal | Batch transmission to API backend. | Declared in manifest. |

### Automated Manifest Injection (`plugins/withUsagePermissions.js`)
Rather than editing generated Android build files manually, an Expo Config Plugin injects all required permissions and services into `AndroidManifest.xml` during `npx expo prebuild`:

```javascript
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withUsagePermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    // Automatically injects PACKAGE_USAGE_STATS, FOREGROUND_SERVICE, etc.
    return config;
  });
};
```

### 4.1 Android 13 & 14 Restricted Settings Resolution (e.g. Motorola Edge 50 Fusion)

On devices running **Android 13 or Android 14+** (such as the Motorola Edge 50 Fusion with Hello UI), Google enforces **Restricted Settings** for any sideloaded application (installed outside of Google Play):
When trying to enable **Usage Access (App usage data)**, Android intercepts with the system dialog:
> *"App was denied access: Access to this permission can put your personal and financial info at risk."*

#### Resolution Steps on Device:
1. Open phone **Settings** ➔ **Apps** ➔ **See all apps**.
2. Select **Student Telemetry Client**.
3. In the top-right corner, tap the **three vertical dots (⋮)**.
4. Tap **"Allow restricted settings"** (or "Allow restricted permissions").
5. Authenticate via fingerprint, PIN, or pattern.
6. Return to **Settings** ➔ **Apps** ➔ **Special app access** ➔ **Usage access** (or open the app and tap **Grant Access**). The toggle is now active and can be enabled.

#### Resolution via Developer ADB:
```bash
# Bypass restriction and grant usage stats directly
adb shell appops set com.telemetry.studentmonitor GET_USAGE_STATS allow
adb shell dumpsys deviceidle whitelist +com.telemetry.studentmonitor
```

---

## 5. React Native UI & State Management

The React Native application (`apps/mobile/src`) features a modern, clean dark-mode interface:

### 5.1 Architecture of `useTelemetry.ts`
The custom hook `useTelemetry` acts as the single source of truth for the mobile UI:
- Monitors native permission status (`hasUsagePermission`, `isBatteryOptimizationIgnored`).
- Connects to `UsageTelemetry.getOutboxStats()` and `UsageTelemetry.getOutboxRecords()`.
- Provides manual snapshot actions (`collectAndEnqueue(15)`).
- Triggers immediate buffer sync (`triggerSync()`).
- Automatically refreshes status every 8 seconds via background timer.

### 5.2 Application Screen Hierarchy
1. **Today Tab (`TodayTab.tsx`)**:
   - Focus Ring circular progress visualization.
   - Screen time totals, inbound/outbound bandwidth cards.
   - 7-day study streak tracker.
   - Built-in Pomodoro study timer with focus session presets.
2. **Insights Tab (`InsightsTab.tsx`)**:
   - Real-time application breakdown leaderboard with categorized badges (📘 Educational, 🎮 Gaming, 💬 Social, 📺 Entertainment).
   - Instant "Snapshot 15m" manual trigger button.
   - Total network traffic summary card (Rx/Tx).
3. **Settings Tab (`SettingsTab.tsx`)**:
   - Backend API endpoint selector (supports localhost, LAN IP, and production domain).
   - Student Pairing code input with deep-link auto-fill (`telemetry://pair?code=...`).
   - Interactive permission check cards with direct links to Android system settings.
4. **Governance & Audit Modals**:
   - **`PrivacyLedgerModal.tsx`**: Interactive ledger outlining what the application does and does not monitor.
   - **`ProminentDisclosureModal.tsx`**: Explicit disclosure modal presented before requesting Android Usage Access.
   - **`OnboardingWizard.tsx`**: 3-step setup guide for first-time student enrollment.

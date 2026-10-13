---
name: mobile-build-and-deploy
description: >-
  Procedures for building, compiling, packaging, signing, and installing the Aegis Student Telemetry Android client (APK/AAB).
  Use this skill whenever building Android release/debug binaries, troubleshooting ADB device installations, resolving Android 14 Restricted Settings permissions, or working with the native Kotlin usage-telemetry module.
---

# Mobile Build, Packaging & Device Deployment Skill

This skill contains the standard operating procedures for building, maintaining, and deploying the Android Mobile Client (`apps/mobile`) for the Aegis Student Telemetry Platform.

---

## 1. Quick Automated Build

To build the debug APK and export it directly to `release/student-telemetry-client.apk`:

```bash
bash scripts/build-mobile.sh
```

### Artifact Outputs:
- Primary APK: `release/student-telemetry-client.apk`
- Standard Gradle APK: `release/app-debug.apk`

---

## 2. Production App Bundle (.aab) Build

To compile an optimized, ProGuard-minified Android App Bundle (.aab) for Google Play:

```bash
bash scripts/build-release-aab.sh
```

---

## 3. Sideloading & Installation on Physical Device / Emulator

### Step 1: Check Attached Devices
```bash
adb devices
```

### Step 2: Prevent Package Signature Conflicts
If a previous version is installed on the phone, uninstall it first to avoid `INSTALL_FAILED_UPDATE_INCOMPATIBLE`:
```bash
adb uninstall com.telemetry.studentmonitor
```

### Step 3: Clean Install
```bash
adb install -r -d -t release/student-telemetry-client.apk
```

---

## 4. Android 13 & 14 Restricted Settings Bypass (e.g. Motorola, Pixel)

On Android 14+ (such as Motorola Edge 50 Fusion), sideloaded APKs block **Usage Access** with:
> *"App was denied access: Access to this permission can put your personal and financial info at risk."*

### Automated ADB One-Liner (Instant Bypass):
```bash
adb shell appops set com.telemetry.studentmonitor GET_USAGE_STATS allow
adb shell dumpsys deviceidle whitelist +com.telemetry.studentmonitor
```

### Manual Device Resolution:
1. Open phone **Settings** ➔ **Apps** ➔ **See all apps**.
2. Tap **Student Telemetry Client**.
3. In top-right corner, tap the **three vertical dots (⋮)**.
4. Tap **"Allow restricted settings"** and verify fingerprint/PIN.
5. Return to **Settings** ➔ **Apps** ➔ **Special app access** ➔ **Usage access** ➔ enable the toggle.

---

## 5. Native Module Maintenance (`modules/usage-telemetry`)

When modifying Kotlin native files:
- Source path: `apps/mobile/modules/usage-telemetry/android/src/main/java/expo/modules/usagetelemetry/`
- Always verify that `UsageStatsManager` events handle both `ACTIVITY_RESUMED` and `ACTIVITY_PAUSED`.
- Keep SQLite Write-Ahead Logging active in `TelemetryOutboxDbHelper.kt` (`PRAGMA journal_mode = WAL;`).
- Before building, test TypeScript typing in mobile directory:
  ```bash
  (cd apps/mobile && npx tsc --noEmit)
  ```

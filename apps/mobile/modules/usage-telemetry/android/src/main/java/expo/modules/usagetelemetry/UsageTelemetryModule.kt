package expo.modules.usagetelemetry

import android.annotation.SuppressLint
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.usagetelemetry.models.AppTelemetryRecord
import expo.modules.usagetelemetry.utils.EventIntervalCalculator
import expo.modules.usagetelemetry.utils.NetworkStatsHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Production-grade Expo Native Module for Android Usage and Network Telemetry.
 * Directly integrates UsageStatsManager, NetworkStatsManager, AppOpsManager, and PowerManager.
 */
class UsageTelemetryModule : Module() {

    private val tag = "UsageTelemetryModule"

    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React application context is not available.")

    override fun definition() = ModuleDefinition {
        Name("UsageTelemetry")

        // 1. Check if OPSTR_GET_USAGE_STATS is explicitly granted
        Function("hasUsagePermission") {
            hasUsageStatsPermission()
        }

        // 2. Request Usage Access via Android Settings Activity
        Function("requestUsagePermission") {
            try {
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                Log.w(tag, "Failed to launch usage settings intent, opening app details fallback", e)
                try {
                    val appSettingsIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        data = Uri.fromParts("package", context.packageName, null)
                    }
                    context.startActivity(appSettingsIntent)
                } catch (e2: Exception) {
                    Log.e(tag, "Failed to launch fallback app details settings", e2)
                }
            }
        }

        // Open App Info settings (used for Android 13/14 'Allow restricted settings')
        Function("openAppSettings") {
            try {
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    data = Uri.fromParts("package", context.packageName, null)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                Log.e(tag, "Failed to open app settings", e)
            }
        }

        // 3. Check if application is currently exempt from Android battery optimizations (Doze mode)
        Function("isBatteryOptimizationIgnored") {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
                ?: return@Function false
            powerManager.isIgnoringBatteryOptimizations(context.packageName)
        }

        // 4. Request exemption from battery optimizations
        Function("requestIgnoreBatteryOptimization") {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = Uri.parse("package:${context.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            try {
                context.startActivity(intent)
            } catch (e: Exception) {
                Log.e(tag, "Unable to launch battery optimization request dialog", e)
            }
        }

        // 5. Query exact interval usage telemetry using EventIntervalCalculator & NetworkStatsHelper
        AsyncFunction("collectIntervalTelemetry") { startTime: Double, endTime: Double ->
            val startMillis = startTime.toLong()
            val endMillis = endTime.toLong()

            if (!hasUsageStatsPermission()) {
                Log.w(tag, "Cannot collect telemetry: UsageStats permission not granted.")
                return@AsyncFunction emptyList<AppTelemetryRecord>()
            }

            if (endMillis <= startMillis) {
                Log.w(tag, "Invalid interval: endTime ($endMillis) must be greater than startTime ($startMillis).")
                return@AsyncFunction emptyList<AppTelemetryRecord>()
            }

            val eventCalculator = EventIntervalCalculator(context)
            val networkStatsHelper = NetworkStatsHelper(context)

            val foregroundDurations = eventCalculator.calculateForegroundDurations(startMillis, endMillis)
            val records = mutableListOf<AppTelemetryRecord>()

            for ((pkg, durationSec) in foregroundDurations) {
                // Filter system noise / empty durations
                if (durationSec <= 0L && pkg.contains("launcher")) continue

                val uid = networkStatsHelper.getUidForPackage(pkg)
                val networkDelta = if (uid != null) {
                    networkStatsHelper.getNetworkUsageForUid(uid, startMillis, endMillis)
                } else {
                    NetworkStatsHelper.NetworkDelta(0L, 0L)
                }

                records.add(
                    AppTelemetryRecord(
                        packageName = pkg,
                        startTime = startMillis,
                        endTime = endMillis,
                        foregroundDurationSec = durationSec,
                        bytesRx = networkDelta.rxBytes,
                        bytesTx = networkDelta.txBytes
                    )
                )
            }

            records.sortedByDescending { it.foregroundDurationSec }
        }

        // 6. Configure parameters for background WorkManager sync
        Function("configureSyncWorker") { backendUrl: String, deviceToken: String, deviceId: String ->
            val prefs = context.getSharedPreferences(
                TelemetrySyncWorker.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            prefs.edit()
                .putString(TelemetrySyncWorker.KEY_BACKEND_URL, backendUrl)
                .putString(TelemetrySyncWorker.KEY_DEVICE_TOKEN, deviceToken)
                .putString(TelemetrySyncWorker.KEY_DEVICE_ID, deviceId)
                .apply()
            Log.i(tag, "Configured background sync worker with endpoint: $backendUrl")
        }

        // 7. Schedule WorkManager persistent 15-minute background worker
        Function("startBackgroundSync") {
            TelemetrySyncWorker.schedulePeriodicSync(context)
        }

        // 8. Cancel WorkManager background worker
        Function("stopBackgroundSync") {
            TelemetrySyncWorker.cancelPeriodicSync(context)
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
            ?: return false

        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }
}

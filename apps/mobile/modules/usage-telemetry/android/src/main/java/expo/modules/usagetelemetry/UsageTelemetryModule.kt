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
import expo.modules.usagetelemetry.db.TelemetryOutboxDbHelper
import expo.modules.usagetelemetry.models.AppTelemetryRecord
import expo.modules.usagetelemetry.security.SecureStorageManager
import expo.modules.usagetelemetry.service.TelemetryForegroundService
import expo.modules.usagetelemetry.utils.EventIntervalCalculator
import expo.modules.usagetelemetry.utils.NetworkStatsHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Production-grade Expo Native Module for Android Usage and Network Telemetry.
 * Directly integrates UsageStatsManager, NetworkStatsManager, AppOpsManager,
 * Android Hardware Keystore, and Unified SQLite Outbox.
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

            // Enqueue into unified SQLite Outbox automatically
            val outbox = TelemetryOutboxDbHelper.getInstance(context)
            if (records.isNotEmpty()) {
                outbox.enqueueRecords(records)
            }

            records.sortedByDescending { it.foregroundDurationSec }
        }

        // 6. Configure parameters in Android Keystore backed SecureStorageManager
        Function("configureSyncWorker") { backendUrl: String, deviceToken: String, deviceId: String ->
            val secureStorage = SecureStorageManager(context)
            secureStorage.saveConfig(backendUrl, deviceToken, deviceId)
            Log.i(tag, "Configured keystore credentials for endpoint: $backendUrl")
        }

        // 7. Schedule WorkManager persistent 15-minute background worker
        Function("startBackgroundSync") {
            TelemetrySyncWorker.schedulePeriodicSync(context)
        }

        // 8. Cancel WorkManager background worker
        Function("stopBackgroundSync") {
            TelemetrySyncWorker.cancelPeriodicSync(context)
        }

        // 9. Query Unified Native Outbox Statistics
        Function("getOutboxStats") {
            val stats = TelemetryOutboxDbHelper.getInstance(context).getStats()
            mapOf(
                "pendingCount" to stats.pendingCount,
                "oldestTimestamp" to (stats.oldestTimestamp ?: 0L),
                "newestTimestamp" to (stats.newestTimestamp ?: 0L),
                "storageSizeBytes" to stats.storageSizeBytes
            )
        }

        // 10. Query Buffered Entries from Native Outbox
        Function("getOutboxRecords") { limit: Int ->
            val entries = TelemetryOutboxDbHelper.getInstance(context).getPendingRecords(limit)
            entries.map {
                mapOf(
                    "id" to it.id,
                    "packageName" to it.packageName,
                    "startTime" to it.startTime,
                    "endTime" to it.endTime,
                    "foregroundDurationSec" to it.foregroundDurationSec,
                    "bytesRx" to it.bytesRx,
                    "bytesTx" to it.bytesTx,
                    "retryCount" to it.retryCount
                )
            }
        }

        // 11. Trigger Immediate Native Outbox Sync (Used by React Native UI)
        AsyncFunction("triggerImmediateSync") {
            val secureStorage = SecureStorageManager(context)
            val outbox = TelemetryOutboxDbHelper.getInstance(context)
            val entries = outbox.getPendingRecords(100)

            if (entries.isEmpty()) {
                return@AsyncFunction mapOf(
                    "success" to true,
                    "uploadedCount" to 0,
                    "remainingCount" to 0,
                    "error" to null
                )
            }

            val backendUrl = secureStorage.getBackendUrl()
            val token = secureStorage.getDeviceToken()

            if (backendUrl.isNullOrBlank() || token.isNullOrBlank()) {
                return@AsyncFunction mapOf(
                    "success" to false,
                    "uploadedCount" to 0,
                    "remainingCount" to entries.size,
                    "error" to "Device credentials missing in Keystore"
                )
            }

                var connection: HttpURLConnection? = null
                try {
                    val endpoint = if (backendUrl.endsWith("/")) "${backendUrl}api/v1/telemetry/batch" else "$backendUrl/api/v1/telemetry/batch"
                    val url = URL(endpoint)
                    connection = (url.openConnection() as HttpURLConnection).apply {
                        requestMethod = "POST"
                        setRequestProperty("Content-Type", "application/json")
                        setRequestProperty("Authorization", "Bearer $token")
                        connectTimeout = 15000
                        readTimeout = 15000
                        doOutput = true
                    }

                    val payload = JSONObject().apply {
                        val intervals = JSONArray()
                        for (rec in entries) {
                            val item = JSONObject().apply {
                                put("packageName", rec.packageName)
                                put("startTime", rec.startTime)
                                put("endTime", rec.endTime)
                                put("foregroundDurationSec", rec.foregroundDurationSec)
                                put("bytesRx", rec.bytesRx)
                                put("bytesTx", rec.bytesTx)
                            }
                            intervals.put(item)
                        }
                        put("intervals", intervals)
                        put("timestamp", System.currentTimeMillis())
                    }

                    OutputStreamWriter(connection.outputStream).use { writer ->
                        writer.write(payload.toString())
                        writer.flush()
                    }

                    val code = connection.responseCode
                    if (code in 200..299) {
                        val ids = entries.map { it.id }
                        outbox.deleteRecords(ids)
                        secureStorage.setLastSyncTimestamp(System.currentTimeMillis())
                        mapOf(
                            "success" to true,
                            "uploadedCount" to ids.size,
                            "remainingCount" to outbox.getStats().pendingCount,
                            "error" to null
                        )
                    } else {
                        mapOf(
                            "success" to false,
                            "uploadedCount" to 0,
                            "remainingCount" to entries.size,
                            "error" to "Server returned HTTP status $code"
                        )
                    }
                } catch (e: Exception) {
                    mapOf(
                        "success" to false,
                        "uploadedCount" to 0,
                        "remainingCount" to entries.size,
                        "error" to (e.message ?: "Network transport error")
                    )
                } finally {
                    connection?.disconnect()
                }
        }

        // 12. Fallback Foreground Service Controls
        Function("startForegroundMonitoring") {
            TelemetryForegroundService.start(context)
        }

        Function("stopForegroundMonitoring") {
            TelemetryForegroundService.stop(context)
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

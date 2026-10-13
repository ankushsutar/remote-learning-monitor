package expo.modules.usagetelemetry

import android.app.AppOpsManager
import android.content.Context
import android.os.Build
import android.os.Process
import android.os.SystemClock
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import expo.modules.usagetelemetry.db.TelemetryOutboxDbHelper
import expo.modules.usagetelemetry.models.AppTelemetryRecord
import expo.modules.usagetelemetry.security.SecureStorageManager
import expo.modules.usagetelemetry.utils.EventIntervalCalculator
import expo.modules.usagetelemetry.utils.NetworkStatsHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Enterprise Background Worker scheduled via Android WorkManager (15-min periodic).
 * Persists intervals into unified native SQLite Outbox and synchronizes with exponential backoff.
 */
class TelemetrySyncWorker(
    private val appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val TAG = "TelemetrySyncWorker"
        const val WORK_NAME = "PeriodicTelemetrySyncWorker"

        /**
         * Enqueues periodic 15-minute background telemetry sync with NetworkType.CONNECTED constraint
         * and exponential backoff retry policy.
         */
        @JvmStatic
        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<TelemetrySyncWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES // Flex interval
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    5, TimeUnit.MINUTES
                )
                .addTag(TAG)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                syncRequest
            )
            Log.i(TAG, "Enqueued periodic WorkManager telemetry sync job with exponential backoff.")
        }

        @JvmStatic
        fun cancelPeriodicSync(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
            Log.i(TAG, "Cancelled periodic WorkManager telemetry sync.")
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.i(TAG, "Executing scheduled background telemetry sync cycle (Attempt: $runAttemptCount)...")

        if (!hasUsageStatsPermission()) {
            Log.w(TAG, "Usage Stats permission revoked. Aborting background telemetry collection.")
            return@withContext Result.failure()
        }

        val secureStorage = SecureStorageManager(appContext)
        val outbox = TelemetryOutboxDbHelper.getInstance(appContext)

        val now = System.currentTimeMillis()
        val defaultStart = now - (15 * 60 * 1000L) // Default 15m lookback
        val lastSync = secureStorage.getLastSyncTimestamp()

        // Clock drift protection & bound sanitization
        val startTime = if (lastSync in 1 until now) {
            lastSync.coerceAtLeast(now - (24 * 60 * 60 * 1000L))
        } else {
            defaultStart
        }
        val endTime = now

        if (endTime <= startTime) {
            Log.i(TAG, "Interval span zero or negative due to clock anomaly. Resetting reference timestamp.")
            secureStorage.setLastSyncTimestamp(now)
            return@withContext Result.success()
        }

        try {
            // 1. Collect telemetry intervals from UsageStatsManager & NetworkStatsManager
            val eventCalculator = EventIntervalCalculator(appContext)
            val networkStatsHelper = NetworkStatsHelper(appContext)

            val foregroundDurations = eventCalculator.calculateForegroundDurations(startTime, endTime)
            val freshRecords = mutableListOf<AppTelemetryRecord>()

            for ((pkg, durationSec) in foregroundDurations) {
                if (durationSec <= 0 && pkg.contains("launcher")) continue

                val uid = networkStatsHelper.getUidForPackage(pkg)
                val networkDelta = if (uid != null) {
                    networkStatsHelper.getNetworkUsageForUid(uid, startTime, endTime)
                } else {
                    NetworkStatsHelper.NetworkDelta(0L, 0L)
                }

                freshRecords.add(
                    AppTelemetryRecord(
                        packageName = pkg,
                        startTime = startTime,
                        endTime = endTime,
                        foregroundDurationSec = durationSec,
                        bytesRx = networkDelta.rxBytes,
                        bytesTx = networkDelta.txBytes
                    )
                )
            }

            // 2. Persist directly into Native SQLite Outbox Buffer (Deduplicated)
            if (freshRecords.isNotEmpty()) {
                outbox.enqueueRecords(freshRecords)
            }

            // 3. Process Pending Buffer from Native Outbox
            val pendingEntries = outbox.getPendingRecords(100)
            if (pendingEntries.isEmpty()) {
                secureStorage.setLastSyncTimestamp(endTime)
                Log.i(TAG, "Outbox queue empty. Cycle completed successfully.")
                return@withContext Result.success()
            }

            val backendUrl = secureStorage.getBackendUrl()
            val deviceToken = secureStorage.getDeviceToken()

            if (!backendUrl.isNullOrBlank() && !deviceToken.isNullOrBlank()) {
                val pendingIds = pendingEntries.map { it.id }
                val uploadSuccess = uploadEntriesBatch(backendUrl, deviceToken, pendingEntries)

                if (uploadSuccess) {
                    outbox.deleteRecords(pendingIds)
                    secureStorage.setLastSyncTimestamp(endTime)
                    Log.i(TAG, "Successfully synced and purged ${pendingIds.size} intervals from native outbox.")
                    Result.success()
                } else {
                    outbox.incrementRetry(pendingIds)
                    Log.w(TAG, "Batch transmission failed. Requesting WorkManager exponential retry.")
                    Result.retry()
                }
            } else {
                Log.w(TAG, "Device not paired or backend credentials missing in Keystore. Buffering in outbox.")
                secureStorage.setLastSyncTimestamp(endTime)
                Result.success()
            }

        } catch (e: Exception) {
            Log.e(TAG, "Unhandled exception during telemetry sync worker execution", e)
            if (runAttemptCount < 4) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    private fun uploadEntriesBatch(
        baseUrl: String,
        token: String,
        entries: List<TelemetryOutboxDbHelper.OutboxEntry>
    ): Boolean {
        var connection: HttpURLConnection? = null
        return try {
            val endpoint = if (baseUrl.endsWith("/")) "${baseUrl}api/v1/telemetry/batch" else "$baseUrl/api/v1/telemetry/batch"
            val url = URL(endpoint)
            connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("User-Agent", "Aegis-Android-Client/1.0.0 (API ${Build.VERSION.SDK_INT})")
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

            val responseCode = connection.responseCode
            val isSuccess = responseCode in 200..299
            if (!isSuccess) {
                Log.w(TAG, "Backend returned HTTP response status: $responseCode")
            }
            isSuccess
        } catch (e: Exception) {
            Log.e(TAG, "Network transport failure during telemetry upload", e)
            false
        } finally {
            connection?.disconnect()
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        return try {
            val appOps = appContext.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
                ?: return false
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    appContext.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(),
                    appContext.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            Log.e(TAG, "Failed checking usage stats permission", e)
            false
        }
    }
}

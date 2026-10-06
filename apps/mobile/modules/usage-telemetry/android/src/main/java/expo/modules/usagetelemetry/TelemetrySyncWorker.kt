package expo.modules.usagetelemetry

import android.app.AppOpsManager
import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.os.Process
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import expo.modules.usagetelemetry.models.AppTelemetryRecord
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
 * Persistent background worker scheduled every 15 minutes to guarantee telemetry ingestion
 * even when the UI thread or React Native JS process is terminated.
 */
class TelemetrySyncWorker(
    private val appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val TAG = "TelemetrySyncWorker"
        const val WORK_NAME = "PeriodicTelemetrySyncWorker"
        const val PREFS_NAME = "TelemetryWorkerPrefs"
        const val KEY_LAST_SYNC_TIME = "last_sync_timestamp"
        const val KEY_BACKEND_URL = "backend_url"
        const val KEY_DEVICE_TOKEN = "device_token"
        const val KEY_DEVICE_ID = "device_id"

        /**
         * Enqueues periodic 15-minute background telemetry sync with NetworkType.CONNECTED constraint.
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
                .addTag(TAG)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                syncRequest
            )
            Log.i(TAG, "Enqueued periodic WorkManager telemetry sync job (15 min interval).")
        }

        @JvmStatic
        fun cancelPeriodicSync(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
            Log.i(TAG, "Cancelled periodic WorkManager telemetry sync.")
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.i(TAG, "Executing scheduled background telemetry sync cycle...")

        if (!hasUsageStatsPermission()) {
            Log.w(TAG, "Usage Stats permission revoked. Aborting background telemetry collection.")
            return@withContext Result.failure()
        }

        val prefs: SharedPreferences =
            appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        val now = System.currentTimeMillis()
        val defaultStart = now - (15 * 60 * 1000L) // Default 15m lookback
        val startTime = prefs.getLong(KEY_LAST_SYNC_TIME, defaultStart).coerceAtLeast(now - (24 * 60 * 60 * 1000L))
        val endTime = now

        if (endTime <= startTime) {
            Log.i(TAG, "EndTime is before or equal to startTime. Skipping interval.")
            return@withContext Result.success()
        }

        try {
            val eventCalculator = EventIntervalCalculator(appContext)
            val networkStatsHelper = NetworkStatsHelper(appContext)

            val foregroundDurations = eventCalculator.calculateForegroundDurations(startTime, endTime)
            val records = mutableListOf<AppTelemetryRecord>()

            for ((pkg, durationSec) in foregroundDurations) {
                // Ignore system launcher or zero usage
                if (durationSec <= 0 && pkg.contains("launcher")) continue

                val uid = networkStatsHelper.getUidForPackage(pkg)
                val networkDelta = if (uid != null) {
                    networkStatsHelper.getNetworkUsageForUid(uid, startTime, endTime)
                } else {
                    NetworkStatsHelper.NetworkDelta(0L, 0L)
                }

                records.add(
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

            Log.i(TAG, "Collected ${records.size} telemetry records between $startTime and $endTime.")

            val backendUrl = prefs.getString(KEY_BACKEND_URL, null)
            val deviceToken = prefs.getString(KEY_DEVICE_TOKEN, null)

            if (!backendUrl.isNullOrBlank() && !deviceToken.isNullOrBlank() && records.isNotEmpty()) {
                val uploadSuccess = uploadTelemetryBatch(backendUrl, deviceToken, records)
                if (uploadSuccess) {
                    prefs.edit().putLong(KEY_LAST_SYNC_TIME, endTime).apply()
                    Log.i(TAG, "Telemetry batch successfully uploaded and committed.")
                    return@withContext Result.success()
                } else {
                    Log.w(TAG, "Upload failed. Requesting WorkManager retry.")
                    return@withContext Result.retry()
                }
            } else {
                // If backend url not configured or empty records, update timestamp and finish
                prefs.edit().putLong(KEY_LAST_SYNC_TIME, endTime).apply()
                return@withContext Result.success()
            }

        } catch (e: Exception) {
            Log.e(TAG, "Unhandled exception during telemetry sync worker execution", e)
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    private fun uploadTelemetryBatch(
        baseUrl: String,
        token: String,
        records: List<AppTelemetryRecord>
    ): Boolean {
        var connection: HttpURLConnection? = null
        return try {
            val endpoint = if (baseUrl.endsWith("/")) "${baseUrl}api/v1/telemetry/batch" else "$baseUrl/api/v1/telemetry/batch"
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
                for (rec in records) {
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
            Log.i(TAG, "Telemetry upload responded with HTTP code: $responseCode")
            responseCode in 200..299
        } catch (e: Exception) {
            Log.e(TAG, "Error performing telemetry HTTP upload: ${e.message}")
            false
        } finally {
            connection?.disconnect()
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = appContext.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
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
        return mode == AppOpsManager.MODE_ALLOWED
    }
}

package expo.modules.usagetelemetry.utils

import android.app.usage.NetworkStats
import android.app.usage.NetworkStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.os.Build
import android.util.Log

class NetworkStatsHelper(private val context: Context) {

    private val tag = "NetworkStatsHelper"
    private val networkStatsManager: NetworkStatsManager? =
        context.getSystemService(Context.NETWORK_STATS_SERVICE) as? NetworkStatsManager

    data class NetworkDelta(val rxBytes: Long, val txBytes: Long)

    /**
     * Obtains the UID for a given package name. Returns null if package not found.
     */
    fun getUidForPackage(packageName: String): Int? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageUid(
                    packageName,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageUid(packageName, 0)
            }
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }
    }

    /**
     * Calculates the delta upload and download bytes for a specific UID within the given interval.
     * Aggregates both Mobile and WiFi interfaces.
     */
    fun getNetworkUsageForUid(uid: Int, startTime: Long, endTime: Long): NetworkDelta {
        if (networkStatsManager == null) {
            return NetworkDelta(0L, 0L)
        }

        var totalRx = 0L
        var totalTx = 0L

        // Query Mobile network stats
        val mobileDelta = queryNetworkType(ConnectivityManager.TYPE_MOBILE, uid, startTime, endTime)
        totalRx += mobileDelta.rxBytes
        totalTx += mobileDelta.txBytes

        // Query WiFi network stats
        val wifiDelta = queryNetworkType(ConnectivityManager.TYPE_WIFI, uid, startTime, endTime)
        totalRx += wifiDelta.rxBytes
        totalTx += wifiDelta.txBytes

        return NetworkDelta(totalRx, totalTx)
    }

    private fun queryNetworkType(
        networkType: Int,
        uid: Int,
        startTime: Long,
        endTime: Long
    ): NetworkDelta {
        var rx = 0L
        var tx = 0L

        try {
            val stats: NetworkStats = networkStatsManager?.queryDetailsForUid(
                networkType,
                null, // subscriberId (null matches all subscriber IDs)
                startTime,
                endTime,
                uid
            ) ?: return NetworkDelta(0L, 0L)

            val bucket = NetworkStats.Bucket()
            while (stats.hasNextBucket()) {
                stats.getNextBucket(bucket)
                rx += bucket.rxBytes
                tx += bucket.txBytes
            }
            stats.close()
        } catch (se: SecurityException) {
            Log.w(tag, "SecurityException querying network stats for UID $uid: ${se.message}")
        } catch (e: Exception) {
            Log.e(tag, "Error querying network stats for UID $uid", e)
        }

        return NetworkDelta(rx, tx)
    }
}

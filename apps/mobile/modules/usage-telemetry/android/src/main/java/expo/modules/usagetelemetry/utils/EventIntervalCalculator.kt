package expo.modules.usagetelemetry.utils

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.util.Log

class EventIntervalCalculator(private val context: Context) {

    private val tag = "EventIntervalCalc"
    private val usageStatsManager: UsageStatsManager? =
        context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager

    /**
     * Parses raw UsageEvents between [startTime] and [endTime] using strictly
     * UsageEvents.Event.ACTIVITY_RESUMED and ACTIVITY_PAUSED to derive
     * accurate foreground duration in seconds per application package.
     *
     * @return Map of package_name -> foreground_duration_seconds
     */
    fun calculateForegroundDurations(startTime: Long, endTime: Long): Map<String, Long> {
        val durationMap = mutableMapOf<String, Long>()
        if (usageStatsManager == null || startTime >= endTime) {
            return durationMap
        }

        try {
            // Query events over the specified window
            val usageEvents: UsageEvents = usageStatsManager.queryEvents(startTime, endTime)
            val event = UsageEvents.Event()

            // Map tracking when an application was resumed: packageName -> timestamp
            val resumedTimestamps = mutableMapOf<String, Long>()

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                val pkg = event.packageName ?: continue
                val timeStamp = event.timeStamp

                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        // Package gained foreground focus
                        resumedTimestamps[pkg] = timeStamp
                    }

                    UsageEvents.Event.ACTIVITY_PAUSED -> {
                        // Package lost foreground focus
                        val resumeTime = resumedTimestamps.remove(pkg)
                        val sessionStart = if (resumeTime != null) {
                            resumeTime.coerceAtLeast(startTime)
                        } else {
                            // If paused without a preceding resumed event in this window,
                            // the app was already foregrounded prior to startTime.
                            startTime
                        }

                        val sessionEnd = timeStamp.coerceAtMost(endTime)
                        if (sessionEnd > sessionStart) {
                            val durationMillis = sessionEnd - sessionStart
                            durationMap[pkg] = (durationMap[pkg] ?: 0L) + durationMillis
                        }
                    }

                    UsageEvents.Event.KEYGUARD_SHOWN,
                    UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
                        // Screen locked or turned off: pause all currently active packages
                        for ((activePkg, resumeTime) in resumedTimestamps) {
                            val sessionStart = resumeTime.coerceAtLeast(startTime)
                            val sessionEnd = timeStamp.coerceAtMost(endTime)
                            if (sessionEnd > sessionStart) {
                                val durationMillis = sessionEnd - sessionStart
                                durationMap[activePkg] = (durationMap[activePkg] ?: 0L) + durationMillis
                            }
                        }
                        resumedTimestamps.clear()
                    }
                }
            }

            // For apps that are still foregrounded at the end of the query interval
            for ((pkg, resumeTime) in resumedTimestamps) {
                val sessionStart = resumeTime.coerceAtLeast(startTime)
                if (endTime > sessionStart) {
                    val durationMillis = endTime - sessionStart
                    durationMap[pkg] = (durationMap[pkg] ?: 0L) + durationMillis
                }
            }

        } catch (se: SecurityException) {
            Log.e(tag, "Permission denied accessing UsageStats: ${se.message}")
        } catch (e: Exception) {
            Log.e(tag, "Unexpected error processing usage events", e)
        }

        // Convert all accumulated milliseconds into seconds (ceiling or standard division)
        return durationMap.mapValues { (_, millis) ->
            (millis / 1000L).coerceAtLeast(0L)
        }
    }
}

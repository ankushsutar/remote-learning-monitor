package expo.modules.usagetelemetry.models

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

/**
 * Represents an aggregated telemetry record for a specific application within a measured time slice.
 */
data class AppTelemetryRecord(
    @Field
    val packageName: String,

    @Field
    val startTime: Long,

    @Field
    val endTime: Long,

    @Field
    val foregroundDurationSec: Long,

    @Field
    val bytesRx: Long,

    @Field
    val bytesTx: Long
) : Record, Serializable {

    fun toMap(): Map<String, Any> {
        return mapOf(
            "packageName" to packageName,
            "startTime" to startTime,
            "endTime" to endTime,
            "foregroundDurationSec" to foregroundDurationSec,
            "bytesRx" to bytesRx,
            "bytesTx" to bytesTx
        )
    }
}

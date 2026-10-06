import { getDatabase } from '../db/connection';
import { getDeduplicationCache } from './redisService';

export interface TelemetryBatchItem {
  packageName: string;
  startTime: number;
  endTime: number;
  foregroundDurationSec: number;
  bytesRx: number;
  bytesTx: number;
}

export interface IngestionResult {
  totalReceived: number;
  newRecordsProcessed: number;
  duplicateCount: number;
  insertedCount: number;
  timestamp: number;
}

export class TelemetryService {
  async ingestBatch(deviceId: string, intervals: TelemetryBatchItem[]): Promise<IngestionResult> {
    const totalReceived = intervals.length;
    if (totalReceived === 0) {
      return {
        totalReceived: 0,
        newRecordsProcessed: 0,
        duplicateCount: 0,
        insertedCount: 0,
        timestamp: Date.now()
      };
    }

    const cache = getDeduplicationCache();
    const db = await getDatabase();

    // 1. Redis / In-memory fast deduplication filter
    const { newRecords, duplicateCount } = await cache.filterNewRecords(deviceId, intervals);

    if (newRecords.length === 0) {
      return {
        totalReceived,
        newRecordsProcessed: 0,
        duplicateCount,
        insertedCount: 0,
        timestamp: Date.now()
      };
    }

    // 2. Prepare records for database insertion
    const dbRecords = newRecords.map((r) => ({
      deviceId,
      packageName: r.packageName,
      startTime: new Date(r.startTime),
      endTime: new Date(r.endTime),
      foregroundDurationSec: r.foregroundDurationSec,
      bytesRx: r.bytesRx,
      bytesTx: r.bytesTx
    }));

    // 3. High-throughput batch insert with ON CONFLICT DO NOTHING
    const insertedCount = await db.batchInsertTelemetry(dbRecords);

    // 4. Update last_sync_at on devices table
    const now = new Date();
    if (db.isPostgres()) {
      await db.query(
        `UPDATE devices SET last_sync_at = $1, updated_at = $1 WHERE id = $2`,
        [now, deviceId]
      );
    } else {
      const memDb = db as any;
      const dev = memDb.devices.get(deviceId);
      if (dev) {
        dev.last_sync_at = now;
      }
    }

    return {
      totalReceived,
      newRecordsProcessed: newRecords.length,
      duplicateCount,
      insertedCount,
      timestamp: Date.now()
    };
  }
}

export const telemetryService = new TelemetryService();

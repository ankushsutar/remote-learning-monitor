import * as SQLite from 'expo-sqlite';
import { AppTelemetryRecord } from '../../modules/usage-telemetry';

export interface QueuedTelemetryRecord extends AppTelemetryRecord {
  id: number;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncResult {
  success: boolean;
  uploadedCount: number;
  remainingCount: number;
  error?: string;
  statusCode?: number;
}

let dbInstance: any = null;

// In-memory fallback if native SQLite is unavailable (e.g. web, mock tests)
const memoryStore: QueuedTelemetryRecord[] = [];
let memoryIdSeq = 1;

/**
 * Initializes the local SQLite FIFO queue for resilient offline buffering.
 */
export async function initDatabase(): Promise<void> {
  try {
    if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
      dbInstance = await SQLite.openDatabaseAsync('student_telemetry.db');
      await dbInstance.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS telemetry_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          package_name TEXT NOT NULL,
          start_time INTEGER NOT NULL,
          end_time INTEGER NOT NULL,
          foreground_duration_sec INTEGER NOT NULL,
          bytes_rx INTEGER NOT NULL,
          bytes_tx INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_telemetry_queue_time ON telemetry_queue(start_time);
      `);
      console.log('[TelemetryDB] SQLite FIFO buffer database initialized (WAL mode).');
      return;
    }
  } catch (err) {
    console.warn('[TelemetryDB] Native SQLite initialization failed, falling back to in-memory FIFO queue:', err);
  }

  // Fallback active
  dbInstance = null;
}

/**
 * Enqueues newly collected interval records into the local FIFO queue.
 */
export async function enqueueTelemetry(records: AppTelemetryRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const now = Date.now();

  if (dbInstance) {
    try {
      await dbInstance.withTransactionAsync(async () => {
        for (const r of records) {
          await dbInstance.runAsync(
            `INSERT INTO telemetry_queue 
              (package_name, start_time, end_time, foreground_duration_sec, bytes_rx, bytes_tx, created_at, retry_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              r.packageName,
              r.startTime,
              r.endTime,
              r.foregroundDurationSec,
              r.bytesRx,
              r.bytesTx,
              now
            ]
          );
        }
      });
      return records.length;
    } catch (e) {
      console.error('[TelemetryDB] Error inserting records into SQLite:', e);
    }
  }

  // Fallback to in-memory FIFO
  for (const r of records) {
    memoryStore.push({
      ...r,
      id: memoryIdSeq++,
      createdAt: now,
      retryCount: 0
    });
  }
  return records.length;
}

/**
 * Peeks up to `limit` records ordered by oldest first (FIFO).
 */
export async function peekQueue(limit = 100): Promise<QueuedTelemetryRecord[]> {
  if (dbInstance) {
    try {
      const rows = await dbInstance.getAllAsync(
        `SELECT id, package_name as packageName, start_time as startTime, end_time as endTime, 
                foreground_duration_sec as foregroundDurationSec, bytes_rx as bytesRx, bytes_tx as bytesTx,
                created_at as createdAt, retry_count as retryCount, last_error as lastError
         FROM telemetry_queue
         ORDER BY id ASC
         LIMIT ?`,
        [limit]
      );
      return rows as QueuedTelemetryRecord[];
    } catch (e) {
      console.error('[TelemetryDB] Error querying queued records:', e);
    }
  }

  return memoryStore.slice(0, limit);
}

/**
 * Deletes successfully synced records by their local IDs.
 */
export async function dequeueRecords(ids: number[]): Promise<void> {
  if (ids.length === 0) return;

  if (dbInstance) {
    try {
      const placeholders = ids.map(() => '?').join(',');
      await dbInstance.runAsync(
        `DELETE FROM telemetry_queue WHERE id IN (${placeholders})`,
        ids
      );
      return;
    } catch (e) {
      console.error('[TelemetryDB] Error deleting queued records from SQLite:', e);
    }
  }

  const idSet = new Set(ids);
  for (let i = memoryStore.length - 1; i >= 0; i--) {
    if (idSet.has(memoryStore[i].id)) {
      memoryStore.splice(i, 1);
    }
  }
}

/**
 * Records a failed sync attempt and increments retry count with exponential backoff annotation.
 */
export async function markRetry(ids: number[], errorMessage: string): Promise<void> {
  if (ids.length === 0) return;

  if (dbInstance) {
    try {
      const placeholders = ids.map(() => '?').join(',');
      await dbInstance.runAsync(
        `UPDATE telemetry_queue 
         SET retry_count = retry_count + 1, last_error = ?
         WHERE id IN (${placeholders})`,
        [errorMessage, ...ids]
      );
      return;
    } catch (e) {
      console.error('[TelemetryDB] Error incrementing retry count in SQLite:', e);
    }
  }

  const idSet = new Set(ids);
  for (const item of memoryStore) {
    if (idSet.has(item.id)) {
      item.retryCount += 1;
      item.lastError = errorMessage;
    }
  }
}

/**
 * Retrieves buffer queue statistics.
 */
export async function getQueueStats(): Promise<{
  pendingCount: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  if (dbInstance) {
    try {
      const result: any = await dbInstance.getFirstAsync(
        `SELECT COUNT(*) as pendingCount, MIN(start_time) as oldest, MAX(end_time) as newest FROM telemetry_queue`
      );
      return {
        pendingCount: result?.pendingCount ?? 0,
        oldestTimestamp: result?.oldest ?? null,
        newestTimestamp: result?.newest ?? null
      };
    } catch (e) {
      console.error('[TelemetryDB] Error retrieving queue stats:', e);
    }
  }

  return {
    pendingCount: memoryStore.length,
    oldestTimestamp: memoryStore.length > 0 ? memoryStore[0].startTime : null,
    newestTimestamp: memoryStore.length > 0 ? memoryStore[memoryStore.length - 1].endTime : null
  };
}

/**
 * Attempts a batch upload of buffered records to the backend ingestion endpoint.
 * Implements exponential backoff awareness, FIFO deletion on HTTP 200, and fault tolerance.
 */
export async function syncBufferedTelemetry(
  baseUrl: string,
  token: string,
  maxBatch = 100
): Promise<SyncResult> {
  const pendingRecords = await peekQueue(maxBatch);
  if (pendingRecords.length === 0) {
    const stats = await getQueueStats();
    return {
      success: true,
      uploadedCount: 0,
      remainingCount: stats.pendingCount
    };
  }

  const idsToSync = pendingRecords.map((r) => r.id);
  const payload = {
    timestamp: Date.now(),
    intervals: pendingRecords.map((r) => ({
      packageName: r.packageName,
      startTime: r.startTime,
      endTime: r.endTime,
      foregroundDurationSec: r.foregroundDurationSec,
      bytesRx: r.bytesRx,
      bytesTx: r.bytesTx
    }))
  };

  const endpoint = baseUrl.endsWith('/')
    ? `${baseUrl}api/v1/telemetry/batch`
    : `${baseUrl}/api/v1/telemetry/batch`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // FIFO eviction on successful ingestion
      await dequeueRecords(idsToSync);
      const stats = await getQueueStats();
      return {
        success: true,
        uploadedCount: idsToSync.length,
        remainingCount: stats.pendingCount,
        statusCode: response.status
      };
    } else {
      const errorText = await response.text();
      const errorMsg = `Server responded with ${response.status}: ${errorText.slice(0, 100)}`;
      await markRetry(idsToSync, errorMsg);
      const stats = await getQueueStats();
      return {
        success: false,
        uploadedCount: 0,
        remainingCount: stats.pendingCount,
        error: errorMsg,
        statusCode: response.status
      };
    }
  } catch (netErr: any) {
    const errorMsg = `Network connection failure: ${netErr.message || 'Unknown network error'}`;
    await markRetry(idsToSync, errorMsg);
    const stats = await getQueueStats();
    return {
      success: false,
      uploadedCount: 0,
      remainingCount: stats.pendingCount,
      error: errorMsg
    };
  }
}
